import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));

    // Determine target month
    let targetMonth: string;
    if (body.target_month && /^\d{4}-\d{2}$/.test(body.target_month)) {
      targetMonth = body.target_month;
    } else {
      const now = new Date();
      now.setMonth(now.getMonth() - 1);
      targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    const monthStart = `${targetMonth}-01`;
    const nextMonthDate = new Date(`${targetMonth}-01T00:00:00Z`);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const monthEnd = nextMonthDate.toISOString().slice(0, 10);

    console.log("generate-monthly-invoices: processing", { targetMonth, monthStart, monthEnd });

    // Fetch unbilled service_records in target month
    const { data: records, error: recErr } = await supabase
      .from("service_records")
      .select("id, patient_id, practice_profile_id, amount, service_date, service_type, duration_minutes")
      .is("invoice_id", null)
      .gte("service_date", monthStart)
      .lt("service_date", monthEnd);

    if (recErr) throw new Error(`Error fetching service_records: ${recErr.message}`);

    if (!records || records.length === 0) {
      return new Response(JSON.stringify({ created: 0, updated: 0, errors: [], message: "No unbilled service records found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by patient_id + practice_profile_id
    const groups = new Map<string, typeof records>();
    for (const r of records) {
      const key = `${r.patient_id}__${r.practice_profile_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const [key, recs] of groups) {
      const [patientId, practiceProfileId] = key.split("__");
      const totalAmount = recs.reduce((s, r) => s + (r.amount || 0), 0);

      try {
        // Check if invoice already exists for this patient + billing_month
        const { data: existing } = await supabase
          .from("invoices")
          .select("id, total_amount, subtotal")
          .eq("patient_id", patientId)
          .eq("practice_profile_id", practiceProfileId)
          .eq("billing_month", monthStart)
          .maybeSingle();

        let invoiceId: string;

        if (existing) {
          // Update existing invoice totals
          const newTotal = (existing.total_amount || 0) + totalAmount;
          await supabase
            .from("invoices")
            .update({ total_amount: newTotal, subtotal: newTotal })
            .eq("id", existing.id);
          invoiceId = existing.id;
          updated++;
        } else {
          // Generate invoice number
          const { data: pp } = await supabase
            .from("practice_profiles")
            .select("invoice_prefix, invoice_next_number")
            .eq("id", practiceProfileId)
            .maybeSingle();

          const prefix = pp?.invoice_prefix || "SYN";
          const nextNum = pp?.invoice_next_number || 1;
          const invoiceNumber = `${prefix}${String(nextNum).padStart(3, "0")}`;
          const today = new Date().toISOString().slice(0, 10);

          const { data: inv, error: invErr } = await supabase
            .from("invoices")
            .insert({
              patient_id: patientId,
              practice_profile_id: practiceProfileId,
              billing_month: monthStart,
              invoice_number: invoiceNumber,
              issue_date: today,
              status: "draft",
              total_amount: totalAmount,
              subtotal: totalAmount,
            })
            .select("id")
            .single();

          if (invErr) throw new Error(invErr.message);
          invoiceId = inv.id;

          // Increment invoice_next_number
          await supabase
            .from("practice_profiles")
            .update({ invoice_next_number: nextNum + 1 })
            .eq("id", practiceProfileId);

          // Create invoice_items for each service_record
          const items = recs.map((r) => ({
            invoice_id: invoiceId,
            description: r.service_type || "Seduta psicologica",
            quantity: 1,
            unit_amount: r.amount || 0,
            total_amount: r.amount || 0,
          }));

          await supabase.from("invoice_items").insert(items);

          created++;
        }

        // Link service_records to this invoice
        const recIds = recs.map((r) => r.id);
        await supabase
          .from("service_records")
          .update({ invoice_id: invoiceId })
          .in("id", recIds);

      } catch (err: any) {
        console.error("generate-monthly-invoices: group error", { patientId, error: err.message });
        errors.push(`Patient ${patientId}: ${err.message}`);
      }
    }

    console.log("generate-monthly-invoices: done", { created, updated, errors: errors.length });

    return new Response(JSON.stringify({ created, updated, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-monthly-invoices: fatal error", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
