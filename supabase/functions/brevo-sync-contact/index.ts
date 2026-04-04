import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: {
    email?: string;
    full_name?: string | null;
    created_at?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { email, full_name, created_at } = body;

  if (!email) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required field: email" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY not configured in Edge Function secrets");
    return new Response(
      JSON.stringify({ success: true, warning: "BREVO_API_KEY not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const firstName = full_name ? full_name.split(" ")[0] : "";

  const payload = {
    email,
    updateEnabled: true,
    attributes: {
      FIRSTNAME: firstName,
      TRIAL_START: created_at || new Date().toISOString(),
      PLAN: "trial",
    },
  };

  try {
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Brevo contacts API error:", response.status, errorBody);
    } else {
      console.log(`Brevo contact synced successfully: ${email}`);
    }
  } catch (err) {
    console.error("Network error calling Brevo contacts API:", err);
  }

  // Always return 200 to never block the signup flow
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
