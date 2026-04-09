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

    // Auth — get practice_profile_id
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pp } = await supabase
      .from("practice_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!pp) {
      return new Response(JSON.stringify({ error: "No practice profile" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Query at-risk patients using individual queries (no raw SQL)
    const nowIso = new Date().toISOString();
    const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

    // Get active patients
    const { data: activePatients } = await supabase
      .from("patients")
      .select("id, first_name, last_name, last_contacted_at")
      .eq("practice_profile_id", pp.id)
      .eq("status", "active");

    if (!activePatients || activePatients.length === 0) {
      return new Response(JSON.stringify({ patients: [], total_count: 0, generated_at: nowIso }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all past appointments for these patients
    const patientIds = activePatients.map((p) => p.id);
    const { data: pastAppts } = await supabase
      .from("appointments")
      .select("id, patient_id, starts_at")
      .eq("practice_profile_id", pp.id)
      .lt("starts_at", nowIso)
      .in("patient_id", patientIds);

    // Get future appointments
    const { data: futureAppts } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("practice_profile_id", pp.id)
      .gt("starts_at", nowIso)
      .in("patient_id", patientIds);

    const patientsWithFuture = new Set((futureAppts ?? []).map((a) => a.patient_id));

    // Build per-patient stats
    const patientStats = new Map<string, { lastDate: Date; count: number }>();
    for (const a of pastAppts ?? []) {
      const existing = patientStats.get(a.patient_id);
      const d = new Date(a.starts_at);
      if (!existing) {
        patientStats.set(a.patient_id, { lastDate: d, count: 1 });
      } else {
        existing.count++;
        if (d > existing.lastDate) existing.lastDate = d;
      }
    }

    // Filter at-risk
    interface AtRiskRaw {
      id: string;
      first_name: string;
      last_name: string;
      last_contacted_at: string | null;
      last_appointment_date: string;
      total_appointments: number;
      days_since_last: number;
    }

    const atRisk: AtRiskRaw[] = [];
    const cutoff = new Date(twentyOneDaysAgo);

    for (const p of activePatients) {
      if (patientsWithFuture.has(p.id)) continue;
      const stats = patientStats.get(p.id);
      if (!stats) continue;
      if (stats.lastDate >= cutoff) continue;

      const daysSince = Math.floor((Date.now() - stats.lastDate.getTime()) / (1000 * 60 * 60 * 24));
      atRisk.push({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        last_contacted_at: p.last_contacted_at,
        last_appointment_date: stats.lastDate.toISOString(),
        total_appointments: stats.count,
        days_since_last: daysSince,
      });
    }

    // Sort by days_since_last DESC, take top 10
    atRisk.sort((a, b) => b.days_since_last - a.days_since_last);
    const top10 = atRisk.slice(0, 10);

    // Generate AI messages
    const fallbackMsg = (name: string) =>
      `Ciao ${name}, ti scrivo per sapere come stai. Se ti va, possiamo riprendere le nostre sedute — sono qui per te.`;

    const generateMessage = async (p: AtRiskRaw): Promise<string> => {
      if (!openrouterKey) return fallbackMsg(p.first_name);

      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://synapsi.app",
            "X-Title": "Psicologo AI Coach",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  'Sei un assistente per psicologi italiani. Per ogni paziente a rischio abbandono, genera un breve messaggio WhatsApp/email in italiano da inviare al paziente. Tono: caldo, non invasivo, professionale. Massimo 3 frasi. Non menzionare mai diagnosi o problemi clinici. Esempio output: "Ciao [Nome], ti scrivo per sapere come stai. Se ti va, possiamo riprendere le nostre sedute — sono disponibile questa settimana."',
              },
              {
                role: "user",
                content: `Genera un messaggio per: Nome: ${p.first_name}, Giorni dall'ultima seduta: ${p.days_since_last}, Numero totale di sedute svolte insieme: ${p.total_appointments}. Personalizza il tono in base alla lunghezza del percorso terapeutico.`,
              },
            ],
            max_tokens: 150,
            temperature: 0.8,
          }),
        });

        if (!res.ok) {
          console.error("OpenRouter error for", p.id, await res.text());
          return fallbackMsg(p.first_name);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || fallbackMsg(p.first_name);
      } catch (e) {
        console.error("OpenRouter exception for", p.id, e);
        return fallbackMsg(p.first_name);
      }
    };

    const results = await Promise.allSettled(top10.map((p) => generateMessage(p)));

    const patients = top10.map((p, i) => ({
      ...p,
      suggested_message:
        results[i].status === "fulfilled" ? results[i].value : fallbackMsg(p.first_name),
    }));

    return new Response(
      JSON.stringify({ patients, total_count: atRisk.length, generated_at: nowIso }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("at-risk-patients error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
