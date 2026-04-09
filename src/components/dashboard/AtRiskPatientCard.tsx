import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, ChevronDown, Copy, Check, CheckCheck, Loader2 } from "lucide-react";
import type { AtRiskPatient } from "@/hooks/useAtRiskPatients";

interface AtRiskPatientCardProps {
  patient: AtRiskPatient;
  onMarkContacted: (id: string) => Promise<void>;
}

export function AtRiskPatientCard({ patient, onMarkContacted }: AtRiskPatientCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const isHighRisk = patient.days_since_last > 45;
  const alreadyContacted = !!patient.last_contacted_at;

  async function handleCopy() {
    await navigator.clipboard.writeText(patient.suggested_message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  async function handleMark() {
    setIsMarking(true);
    try {
      await onMarkContacted(patient.id);
    } finally {
      setIsMarking(false);
    }
  }

  const contactLabel = alreadyContacted
    ? `Contattato il ${new Date(patient.last_contacted_at!).toLocaleDateString("it-IT")}`
    : "Mai contattato";

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-card space-y-2">
      {/* Header */}
      <div className="flex items-start gap-2">
        <AlertCircle
          size={16}
          className={`mt-0.5 shrink-0 ${isHighRisk ? "text-destructive" : "text-warning"}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {patient.first_name} {patient.last_name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Percorso: {patient.total_appointments} sedute · {contactLabel}
          </p>
        </div>
        <Badge variant={isHighRisk ? "destructive" : "secondary"} className="shrink-0 text-[11px]">
          {patient.days_since_last} giorni fa
        </Badge>
      </div>

      {/* Collapsible message */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Messaggio suggerito
          <ChevronDown
            size={12}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1.5 rounded-md border border-border bg-muted/50 p-3">
            <p className="text-sm italic text-foreground leading-relaxed">
              {patient.suggested_message}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm" className="text-xs h-8 flex-1" onClick={handleCopy}>
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          {isCopied ? "Copiato!" : "Copia messaggio"}
        </Button>
        <Button
          size="sm"
          className="text-xs h-8 flex-1"
          disabled={alreadyContacted || isMarking}
          onClick={handleMark}
        >
          {isMarking ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCheck size={12} />
          )}
          {alreadyContacted ? "Già contattato" : "Segna contattato"}
        </Button>
      </div>
    </div>
  );
}
