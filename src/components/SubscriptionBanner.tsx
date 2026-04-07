import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubscriptionBanner() {
  const { isPaywalled, status, trialEndDate } = useSubscription();
  const navigate = useNavigate();

  if (!isPaywalled) return null;

  return (
    <div className="w-full bg-warning/15 border-b border-warning/30 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-warning-foreground">
        <AlertCircle size={16} className="shrink-0 text-warning" />
        <span>
          {status === "expired"
            ? "Il tuo periodo di prova è terminato. Passa a Premium per continuare senza limiti."
            : "Il tuo abbonamento è stato cancellato. Riattiva Premium per accesso completo."}
        </span>
      </div>
      <Button
        size="sm"
        onClick={() => navigate("/upgrade")}
        className="gap-1.5 shrink-0"
      >
        <Sparkles size={14} />
        Passa a Premium
      </Button>
    </div>
  );
}
