import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Logical template_id → Brevo numeric template ID
const TEMPLATE_IDS: Record<string, number> = {
  welcome: 1, // Update with your real Brevo template ID
  premium_activated: 2, // Placeholder for Stripe integration
  subscription_cancelled: 3, // Placeholder for Stripe integration
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
    template_id: string;
    to: { email: string; name: string };
    params: Record<string, string | number>;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { template_id, to, params } = body;

  if (!template_id || !to?.email || !to?.name) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Missing required fields: template_id, to.email, to.name",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const brevoTemplateId = TEMPLATE_IDS[template_id];
  if (!brevoTemplateId) {
    return new Response(
      JSON.stringify({ success: false, error: `Unknown template_id: ${template_id}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY not configured in Edge Function secrets");
    return new Response(
      JSON.stringify({ success: false, error: "BREVO_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payload = {
    to: [{ email: to.email, name: to.name }],
    templateId: brevoTemplateId,
    params,
  };

  try {
    console.log("send-email: calling Brevo", { type: template_id, email: to.email });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("send-email: Brevo responded", { status: response.status });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Brevo API error:", response.status, errorBody);
      return new Response(
        JSON.stringify({ success: false, error: `Brevo error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Email sent successfully: template=${template_id}, to=${to.email}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("send-email: network error", { error: errMsg });
    return new Response(
      JSON.stringify({ success: false, error: "Network error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
