import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw new Error("No stripe-signature header");

    const event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    logStep("Event received", { type: event.type, id: event.id });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const supabaseUserId = session.metadata?.supabase_user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (supabaseUserId) {
          const { error } = await supabase.from("users").update({
            subscription_status: "active_premium",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          }).eq("id", supabaseUserId);

          logStep("checkout.session.completed processed", { supabaseUserId, customerId, error: error?.message });
        } else {
          // Fallback: find user by email
          const customerEmail = session.customer_details?.email;
          if (customerEmail) {
            const { error } = await supabase.from("users").update({
              subscription_status: "active_premium",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            }).eq("email", customerEmail);
            logStep("checkout.session.completed processed by email", { customerEmail, error: error?.message });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { error } = await supabase.from("users").update({
          subscription_status: "cancelled",
          stripe_subscription_id: null,
        }).eq("stripe_customer_id", customerId);

        logStep("customer.subscription.deleted processed", { customerId, error: error?.message });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { error } = await supabase.from("users").update({
          subscription_status: "expired",
        }).eq("stripe_customer_id", customerId);

        logStep("invoice.payment_failed processed", { customerId, error: error?.message });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
