import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { data: pp } = await supabase
      .from("practice_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!pp) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();
    const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

    const { data: activePatients } = await supabase
      .from("patients")
      .select("id, first_name, last_name, last_contacted_at")
      .eq("practice_profile_id", pp.id)
      .eq("status", "active");

    if (!activePatients?.length) {
      return new Response(JSON.stringify({ patients: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patientIds = activePatients.map((p) => p.id);
    const { data: pastAppts } = await supabase
      .from("appointments")
      .select("id, patient_id, starts_at")
      .eq("practice_profile_id", pp.id)
      .lt("starts_at", nowIso)
      .in("patient_id", patientIds);

    const { data: futureAppts } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("practice_profile_id", pp.id)
      .gt("starts_at", nowIso)
      .in("patient_id", patientIds);

    const patientsWithFuture = new Set((futureAppts ?? []).map((a) => a.patient_id));
    const patientStats = new Map();
    
    for (const a of pastAppts ?? []) {
      const d = new Date(a.starts_at);
      if (isNaN(d.getTime())) continue;
      const existing = patientStats.get(a.patient_id);
      if (!existing || d > existing.lastDate) {
        patientStats.set(a.patient_id, { lastDate: d, count: (existing?.count || 0) + 1 });
      } else {
        existing.count++;
      }
    }

    const atRisk = [];
    const cutoff = new Date(twentyOneDaysAgo);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const p of activePatients) {
      if (patientsWithFuture.has(p.id)) continue;
      
      // Se il paziente è stato contattato negli ultimi 7 giorni, non lo consideriamo a rischio
      if (p.last_contacted_at) {
        const lastContact = new Date(p.last_contacted_at);
        if (lastContact > sevenDaysAgo) continue;
      }

      const stats = patientStats.get(p.id);
      if (!stats || stats.lastDate >= cutoff) continue;

      atRisk.push({
        ...p,
        last_appointment_date: stats.lastDate.toISOString(),
        total_appointments: stats.count,
        days_since_last: Math.floor((Date.now() - stats.lastDate.getTime()) / (1000 * 60 * 60 * 24)),
      });
    }

    atRisk.sort((a, b) => b.days_since_last - a.days_since_last);
    const top10 = atRisk.slice(0, 10);

    const results = [];
    for (const p of top10) {
      let msg = `Ciao ${p.first_name}, come stai? Spero bene. Se ti va, possiamo fissare una nuova seduta. Un saluto!`;
      if (openrouterKey) {
        try {
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openrouterKey}`,
              "HTTP-Referer": "https://synapsi.app",
              "X-Title": "Synapsi",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini",
              messages: [
                { role: "system", content: "Sei un assistente per psicologi italiani. Genera un breve messaggio caldo per un paziente che non si vede da tempo. Massimo 2 frasi." },
                { role: "user", content: `Nome: ${p.first_name}, Giorni: ${p.days_since_last}` }
              ],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            msg = data.choices[0]?.message?.content || msg;
          }
        } catch (e) { console.error("AI error:", e); }
      }
      results.push({ ...p, suggested_message: msg });
    }

    return new Response(JSON.stringify({ patients: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
