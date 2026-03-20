import { supabase } from "@/integrations/supabase/client";

interface CascadeAppointment {
  id: string;
  patient_id: string;
  practice_profile_id: string;
  starts_at: string;
  ends_at: string;
}

/**
 * Full cascade when appointment → 'completed':
 * 1. Create service_record
 * 2. Create invoice with auto-numbered invoice_number
 * 3. Create invoice_item
 */
export async function completeAppointmentCascade(appt: CascadeAppointment) {
  // Fetch practice defaults
  const { data: pp, error: ppErr } = await supabase
    .from("practice_profiles")
    .select("default_session_price, invoice_prefix, invoice_next_number")
    .eq("id", appt.practice_profile_id)
    .maybeSingle();

  if (ppErr) throw new Error(`Errore profilo: ${ppErr.message}`);

  const amount = pp?.default_session_price ?? 0;
  const durationMinutes = Math.round(
    (new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime()) / 60000
  );
  const serviceDate = appt.starts_at.slice(0, 10);

  // 1. Create service_record
  const { data: sr, error: srErr } = await supabase
    .from("service_records")
    .insert({
      appointment_id: appt.id,
      patient_id: appt.patient_id,
      practice_profile_id: appt.practice_profile_id,
      service_date: serviceDate,
      duration_minutes: durationMinutes,
      amount,
      closed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (srErr) throw new Error(`Errore service_record: ${srErr.message}`);

  // 2. Create invoice
  const prefix = pp?.invoice_prefix || "SYN";
  const nextNum = pp?.invoice_next_number || 1;
  const invoiceNumber = `${prefix}${String(nextNum).padStart(3, "0")}`;
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      service_record_id: sr.id,
      patient_id: appt.patient_id,
      practice_profile_id: appt.practice_profile_id,
      status: "draft",
      issue_date: today,
      due_date: dueDate,
      invoice_number: invoiceNumber,
      total_amount: amount,
      subtotal: amount,
    })
    .select("id")
    .single();

  if (invErr) throw new Error(`Errore fattura: ${invErr.message}`);

  // 3. Create invoice_item
  const { error: iiErr } = await supabase.from("invoice_items").insert({
    invoice_id: inv.id,
    description: "Seduta psicologica",
    quantity: 1,
    unit_amount: amount,
    total_amount: amount,
  });

  if (iiErr) throw new Error(`Errore riga fattura: ${iiErr.message}`);

  // 4. Increment invoice_next_number
  await supabase
    .from("practice_profiles")
    .update({ invoice_next_number: nextNum + 1 })
    .eq("id", appt.practice_profile_id);

  // 5. Update appointment status
  const { error: updErr } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appt.id);

  if (updErr) throw new Error(`Errore aggiornamento appuntamento: ${updErr.message}`);

  return { serviceRecordId: sr.id, invoiceId: inv.id, invoiceNumber };
}

/**
 * Handle 'no_show': create service_record with admin_notes, no invoice
 */
export async function noShowAppointment(appt: CascadeAppointment) {
  const durationMinutes = Math.round(
    (new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime()) / 60000
  );
  const serviceDate = appt.starts_at.slice(0, 10);

  const { error: srErr } = await supabase.from("service_records").insert({
    appointment_id: appt.id,
    patient_id: appt.patient_id,
    practice_profile_id: appt.practice_profile_id,
    service_date: serviceDate,
    duration_minutes: durationMinutes,
    amount: 0,
    admin_notes: "Paziente assente",
    closed_at: new Date().toISOString(),
  });

  if (srErr) throw new Error(`Errore service_record: ${srErr.message}`);

  const { error: updErr } = await supabase
    .from("appointments")
    .update({ status: "no_show" })
    .eq("id", appt.id);

  if (updErr) throw new Error(`Errore aggiornamento: ${updErr.message}`);
}

/**
 * Handle 'cancelled': cancel appointment + linked draft invoices/payments/reminders
 */
export async function cancelAppointment(appt: CascadeAppointment, reason: string) {
  // 1. Update appointment
  const { error: updErr } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancellation_reason: reason || null })
    .eq("id", appt.id);

  if (updErr) throw new Error(`Errore cancellazione: ${updErr.message}`);

  // 2. Find service_records for this appointment
  const { data: srs } = await supabase
    .from("service_records")
    .select("id")
    .eq("appointment_id", appt.id);

  if (srs && srs.length > 0) {
    const srIds = srs.map(s => s.id);

    // 3. Find draft invoices linked to these service_records
    const { data: drafts } = await supabase
      .from("invoices")
      .select("id")
      .in("service_record_id", srIds)
      .eq("status", "draft");

    if (drafts && drafts.length > 0) {
      const invoiceIds = drafts.map(i => i.id);

      // Cancel invoices
      await supabase
        .from("invoices")
        .update({ status: "cancelled" })
        .in("id", invoiceIds);

      // Cancel pending payments on those invoices
      await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .in("invoice_id", invoiceIds)
        .eq("status", "pending");
    }
  }

  // 4. Cancel pending reminders for this appointment
  await supabase
    .from("reminders")
    .update({ status: "cancelled" })
    .eq("appointment_id", appt.id)
    .eq("status", "pending");
}

/**
 * Confirm appointment (no side effects)
 */
export async function confirmAppointment(appointmentId: string) {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointmentId);

  if (error) throw new Error(`Errore conferma: ${error.message}`);
}
