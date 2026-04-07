import { useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, Loader2, Crown } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const features = [
  "Gestione illimitata pazienti",
  "Fatturazione mensile automatica",
  "Calendario appuntamenti",
  "Report e dashboard avanzati",
  "Esportazione dati CSV",
  "Supporto prioritario",
];

export default function UpgradePage() {
  const { status, isPremium, trialEndDate } = useSubscription();
  const { session } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!session?.access_token) return;
    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      toast({ title: "Errore", description: "Impossibile avviare il checkout. Riprova.", variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Crown size={14} />
            {isPremium ? "Il tuo piano attuale" : "Scegli il tuo piano"}
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {isPremium ? "Sei Premium! 🎉" : "Passa a AURA Premium"}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {isPremium
              ? `Il tuo abbonamento è attivo${subscriptionEnd ? ` fino al ${format(new Date(subscriptionEnd), "d MMMM yyyy", { locale: it })}` : ""}.`
              : status === "trial" && trialEndDate
                ? `Il tuo periodo di prova termina il ${format(new Date(trialEndDate), "d MMMM yyyy", { locale: it })}.`
                : "Sblocca tutte le funzionalità per gestire il tuo studio al meglio."}
          </p>
        </div>

        {/* Plans */}
        {!isPremium && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Monthly */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4 flex flex-col">
              <div>
                <h3 className="font-display font-semibold text-lg text-foreground">{PLANS.monthly.label}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-foreground">€14,99</span>
                  <span className="text-muted-foreground">/mese</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check size={14} className="text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full gap-2"
                variant="outline"
                disabled={!!loadingPlan}
                onClick={() => handleCheckout(PLANS.monthly.priceId, "monthly")}
              >
                {loadingPlan === "monthly" ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                Scegli Mensile
              </Button>
            </div>

            {/* Annual */}
            <div className="rounded-xl border-2 border-primary bg-card p-6 shadow-card space-y-4 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                Più conveniente
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-foreground">{PLANS.annual.label}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-foreground">€119</span>
                  <span className="text-muted-foreground">/anno</span>
                </div>
                <p className="text-xs text-accent font-medium mt-1">{PLANS.annual.savings}</p>
              </div>
              <ul className="space-y-2 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check size={14} className="text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full gap-2"
                disabled={!!loadingPlan}
                onClick={() => handleCheckout(PLANS.annual.priceId, "annual")}
              >
                {loadingPlan === "annual" ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                Scegli Annuale
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
