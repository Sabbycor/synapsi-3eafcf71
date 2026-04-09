import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!openrouterKey) {
      return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get auth user's practice_profile_id from JWT
    const authHeader = req.headers.get("Authorization");
    let practiceProfileId: string | null = null;

    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: pp } = await supabase
          .from("practice_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        practiceProfileId = pp?.id ?? null;
      }
    }

    if (!practiceProfileId) {
      return new Response(JSON.stringify({ error: "Unauthorized or no practice profile" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate current week (Monday–Sunday) in Europe/Rome
    const now = new Date();
    const romeFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" });
    const todayStr = romeFormatter.format(now); // YYYY-MM-DD
    const todayDate = new Date(todayStr + "T00:00:00");
    const dayOfWeek = todayDate.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(todayDate);
    monday.setDate(todayDate.getDate() + mondayOffset);
    const sundayEnd = new Date(monday);
    sundayEnd.setDate(monday.getDate() + 7);

    const weekStart = monday.toISOString().slice(0, 10);
    const weekEnd = sundayEnd.toISOString().slice(0, 10);

    // Query 1: Appointments count this week
    const { count: apptCount } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("practice_profile_id", practiceProfileId)
      .gte("starts_at", `${weekStart}T00:00:00`)
      .lt("starts_at", `${weekEnd}T00:00:00`);

    // Query 2: Expected revenue — use default_session_price × count
    const { data: ppData } = await supabase
      .from("practice_profiles")
      .select("default_session_price")
      .eq("id", practiceProfileId)
      .maybeSingle();

    const sessionPrice = ppData?.default_session_price;
    const revenueStr = sessionPrice && apptCount
      ? `€${(Number(sessionPrice) * (apptCount ?? 0)).toFixed(2)}`
      : "N/D";

    // Query 3: Pending TS transmissions
    const { count: tsPending } = await supabase
      .from("appointments")
      .select("patient_id", { count: "exact", head: true })
      .eq("practice_profile_id", practiceProfileId)
      .eq("status", "completed")
      .eq("ts_transmitted", false);

    // Query 4: Active patients without future appointment
    const { data: noFuturePatients } = await supabase.rpc("exec_sql" as any, {}).maybeSingle();
    // Use a direct approach: get active patients, then check
    const { data: activePatients } = await supabase
      .from("patients")
      .select("id")
      .eq("practice_profile_id", practiceProfileId)
      .eq("status", "active");

    let patientsWithoutAppt = 0;
    if (activePatients && activePatients.length > 0) {
      const patientIds = activePatients.map((p: any) => p.id);
      const { data: futureAppts } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("practice_profile_id", practiceProfileId)
        .gt("starts_at", now.toISOString())
        .in("patient_id", patientIds);

      const patientsWithFuture = new Set((futureAppts ?? []).map((a: any) => a.patient_id));
      patientsWithoutAppt = patientIds.filter((id: string) => !patientsWithFuture.has(id)).length;
    }

    // Build OpenRouter request
    const userContent = `Genera il briefing per questa settimana con i seguenti dati:
- Appuntamenti in agenda: ${apptCount ?? 0}
- Ricavo atteso: ${revenueStr}
- Sedute completate in attesa di trasmissione TS: ${tsPending ?? 0} pazienti
- Pazienti attivi senza prossimo appuntamento: ${patientsWithoutAppt} pazienti
Settimana: ${weekStart} – ${weekEnd}`;

    const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openrouterKey}`,
        "HTTP-Referer": "https://synapsi.app",
        "X-Title": "Briefing Settimanale Psicologo",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Sei un assistente di gestione per psicologi italiani. Ogni lunedì mattina generi un briefing settimanale conciso e motivante in italiano. Usa un tono professionale ma caldo. Massimo 5 frasi. Struttura: apertura settimana → sedute in agenda → priorità amministrative → chiusura motivante.",
          },
          { role: "user", content: userContent },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!openrouterRes.ok) {
      const errText = await openrouterRes.text();
      console.error("OpenRouter error:", errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await openrouterRes.json();
    const briefing = aiData.choices?.[0]?.message?.content ?? "Briefing non disponibile.";

    return new Response(JSON.stringify({ briefing }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("weekly-briefing error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
