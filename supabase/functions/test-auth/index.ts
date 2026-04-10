import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Header mancante" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: authError } = await userClient.auth.getUser();

    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Auth non valida", authError }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const { data: pp, error: ppError } = await supabase
      .from("practice_profiles")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const { count: patientCount } = await supabase
      .from("patients")
      .select("*", { count: 'exact', head: true })
      .eq("practice_profile_id", pp?.id);

    return new Response(JSON.stringify({ 
      user_id: userData.user.id, 
      email: userData.user.email,
      profile_found: !!pp,
      profile_id: pp?.id,
      patient_count: patientCount,
      profile_error: ppError
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "ERRORE_INTERNO", details: e.message }), { status: 500, headers: corsHeaders });
  }
});
