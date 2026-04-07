import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Read subscription state from DB (webhooks keep it in sync)
    const { data: userRecord, error: dbError } = await supabaseClient
      .from("users")
      .select("subscription_status, trial_end_date, stripe_customer_id, stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (dbError || !userRecord) throw new Error("User record not found");

    let status = userRecord.subscription_status;

    // Auto-expire trial if trial_end_date has passed and status is still trial
    if (status === "trial" && userRecord.trial_end_date) {
      const trialEnd = new Date(userRecord.trial_end_date);
      if (trialEnd <= new Date()) {
        status = "expired";
        await supabaseClient.from("users").update({ subscription_status: "expired" }).eq("id", user.id);
        logStep("Trial expired, updated status");
      }
    }

    logStep("Returning status", { status });

    return new Response(JSON.stringify({
      subscription_status: status,
      trial_end_date: userRecord.trial_end_date ?? null,
      subscribed: status === "active_premium",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
