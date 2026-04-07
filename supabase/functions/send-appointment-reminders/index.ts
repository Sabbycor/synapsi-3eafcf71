import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");

  if (!brevoApiKey) {
    console.error("BREVO_API_KEY not configured");
    return new Response(JSON.stringify({ error: "BREVO_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find appointments starting in 55-65 minutes, not cancelled, not yet reminded
  const now = new Date();
  const from = new Date(now.getTime() + 55 * 60_000).toISOString();
  const to = new Date(now.getTime() + 65 * 60_000).toISOString();

  const { data: appointments, error: fetchErr } = await supabase
    .from("appointments")
    .select("id, starts_at, patients(first_name, email)")
    .gte("starts_at", from)
    .lte("starts_at", to)
    .neq("status", "cancelled")
    .eq("reminder_sent", false);

  if (fetchErr) {
    console.error("Error fetching appointments:", fetchErr.message);
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!appointments || appointments.length === 0) {
    console.log("No appointments to remind");
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sentCount = 0;

  for (const appt of appointments) {
    const patient = appt.patients as unknown as { first_name: string; email: string } | null;
    if (!patient?.email) {
      console.warn(`Appointment ${appt.id}: patient has no email, skipping`);
      continue;
    }

    // Format time in Italian timezone
    const startsAt = new Date(appt.starts_at);
    const timeStr = startsAt.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Rome",
    });

    const subject = `Promemoria seduta — oggi alle ${timeStr}`;
    const htmlContent = `<p>Ciao ${patient.first_name}, ti ricordiamo la tua seduta di oggi alle ${timeStr}.</p>`;

    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          to: [{ email: patient.email, name: patient.first_name }],
          subject,
          htmlContent,
          sender: { name: "Synapsi", email: "noreply@synapsi.app" },
        }),
      });

      if (!brevoRes.ok) {
        const errBody = await brevoRes.text();
        console.error(`Brevo error for ${appt.id}:`, brevoRes.status, errBody);
        continue;
      }

      // Mark as sent
      const { error: updErr } = await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", appt.id);

      if (updErr) {
        console.error(`Failed to set reminder_sent for ${appt.id}:`, updErr.message);
      } else {
        sentCount++;
        console.log(`Reminder sent for appointment ${appt.id} to ${patient.email}`);
      }
    } catch (err) {
      console.error(`Network error sending reminder for ${appt.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ sent: sentCount }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
