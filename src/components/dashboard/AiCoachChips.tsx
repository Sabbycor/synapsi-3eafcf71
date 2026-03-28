import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { Button } from "@/components/ui/button";
import {
  FileText, AlertTriangle, Send, UserX, Clock, CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface CoachAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  route: string;
  variant: "destructive" | "warning" | "default";
}

export function AiCoachChips() {
  const practiceProfileId = usePracticeProfileId();
  const navigate = useNavigate();
  const [actions, setActions] = useState<CoachAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!practiceProfileId) return;
    async function analyze() {
      setLoading(true);
      const result: CoachAction[] = [];

      // 1. Overdue invoices
      const { count: overdueCount } = await supabase
        .from("invoices").select("id", { count: "exact", head: true })
        .eq("practice_profile_id", practiceProfileId)
        .eq("status", "overdue");
      if ((overdueCount ?? 0) > 0) {
        result.push({
          id: "overdue",
          icon: AlertTriangle,
          label: `${overdueCount} fattur${overdueCount === 1 ? "a scaduta" : "e scadute"}`,
          description: "Invia un sollecito o segna come pagata",
          route: "/invoices",
          variant: "destructive",
        });
      }

      // 2. Draft invoices to send
      const { count: draftCount } = await supabase
        .from("invoices").select("id", { count: "exact", head: true })
        .eq("practice_profile_id", practiceProfileId)
        .eq("status", "draft");
      if ((draftCount ?? 0) > 0) {
        result.push({
          id: "drafts",
          icon: Send,
          label: `${draftCount} fattur${draftCount === 1 ? "a da inviare" : "e da inviare"}`,
          description: "Genera PDF e invia al paziente",
          route: "/invoices",
          variant: "warning",
        });
      }

      // 3. Late payments (invoices sent but unpaid past due_date)
      const today = new Date().toISOString().slice(0, 10);
      const { count: lateCount } = await supabase
        .from("invoices").select("id", { count: "exact", head: true })
        .eq("practice_profile_id", practiceProfileId)
        .in("status", ["sent", "issued"])
        .lt("due_date", today);
      if ((lateCount ?? 0) > 0) {
        result.push({
          id: "late",
          icon: Clock,
          label: `${lateCount} pagament${lateCount === 1 ? "o in ritardo" : "i in ritardo"}`,
          description: "Verifica i pagamenti in sospeso",
          route: "/payments",
          variant: "warning",
        });
      }

      // 4. Patients missing tax_code
      const { count: missingCfCount } = await supabase
        .from("patients").select("id", { count: "exact", head: true })
        .eq("practice_profile_id", practiceProfileId)
        .is("tax_code", null);
      if ((missingCfCount ?? 0) > 0) {
        result.push({
          id: "missing-cf",
          icon: UserX,
          label: `${missingCfCount} pazient${missingCfCount === 1 ? "e senza C.F." : "i senza C.F."}`,
          description: "Necessario per la trasmissione TS",
          route: "/patients",
          variant: "default",
        });
      }

      // 5. Open tasks
      const { count: taskCount } = await supabase
        .from("tasks").select("id", { count: "exact", head: true })
        .eq("practice_profile_id", practiceProfileId)
        .in("status", ["open", "todo"]);
      if ((taskCount ?? 0) > 0) {
        result.push({
          id: "tasks",
          icon: CheckCircle2,
          label: `${taskCount} attività da completare`,
          description: "Gestisci le attività in sospeso",
          route: "/tasks",
          variant: "default",
        });
      }

      setActions(result.slice(0, 6));
      setLoading(false);
    }
    analyze();
  }, [practiceProfileId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
        <p className="text-sm font-medium text-success">Tutto in ordine ✓</p>
        <p className="text-xs text-muted-foreground mt-1">Nessuna azione urgente richiesta</p>
      </div>
    );
  }

  const variantStyles: Record<string, string> = {
    destructive: "bg-destructive/10 border-destructive/20",
    warning: "bg-warning/10 border-warning/20",
    default: "bg-secondary border-border",
  };

  const iconStyles: Record<string, string> = {
    destructive: "text-destructive",
    warning: "text-warning",
    default: "text-accent",
  };

  return (
    <div className="space-y-2">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => navigate(action.route)}
          className="w-full flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-card text-left hover:bg-muted/50 transition-colors"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${variantStyles[action.variant]}`}>
            <action.icon size={16} className={iconStyles[action.variant]} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.description}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}
