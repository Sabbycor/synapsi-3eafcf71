import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronRight, RefreshCw, Heart, Users } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAtRiskPatients } from "@/hooks/useAtRiskPatients";
import { AtRiskPatientCard } from "@/components/dashboard/AtRiskPatientCard";
type Priority = "urgent" | "week" | "whenever";

interface Suggestion {
  id: string;
  priority: Priority;
  text: string;
  actionLabel?: string;
  route?: string;
}

const priorityConfig: Record<Priority, { emoji: string; label: string; bg: string; text: string }> = {
  urgent:   { emoji: "🔴", label: "Urgente",          bg: "bg-destructive/10", text: "text-destructive" },
  week:     { emoji: "🟡", label: "Questa settimana", bg: "bg-warning/10",     text: "text-warning" },
  whenever: { emoji: "🟢", label: "Quando vuoi",      bg: "bg-success/10",     text: "text-success" },
};

const priorityOrder: Priority[] = ["urgent", "week", "whenever"];

export function AiCoachPanel() {
  const practiceProfileId = usePracticeProfileId();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tsConfirmOpen, setTsConfirmOpen] = useState(false);
  const [tsCount, setTsCount] = useState(0);
  const [tsApptIds, setTsApptIds] = useState<string[]>([]);
  const [tsSubmitting, setTsSubmitting] = useState(false);

  const {
    patients: atRiskPatients,
    isLoading: atRiskLoading,
    error: atRiskError,
    fetchAtRiskPatients,
    markAsContacted,
  } = useAtRiskPatients();

  useEffect(() => {
    if (!practiceProfileId) return;
    fetchAtRiskPatients();
    async function analyze() {
      setLoading(true);
      const result: Suggestion[] = [];
      const now = new Date();
      const todayIso = now.toISOString();

      try {
        // 🔴 Tessera Sanitaria — completed, not transmitted, current or previous month
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const { data: tsAppts } = await supabase
          .from("appointments")
          .select("id, patient_id, patients(tax_code)")
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "completed")
          .eq("ts_transmitted", false)
          .gte("starts_at", startOfPrevMonth.toISOString())
          .lte("starts_at", endOfCurrentMonth.toISOString());

        if (tsAppts) {
          const eligible = (tsAppts as any[]).filter(
            (a) => a.patients && a.patients.tax_code && a.patients.tax_code.trim() !== ""
          );
          if (eligible.length > 0) {
            const ids = eligible.map((a) => a.id);
            setTsCount(eligible.length);
            setTsApptIds(ids);
            result.push({
              id: "ts-transmit",
              priority: "urgent",
              text: `Hai ${eligible.length} prestazioni da trasmettere al Sistema Tessera Sanitaria — verifica entro fine mese`,
              actionLabel: "Segna come trasmesse",
            });
          }
        }

        // 🔴 CF mancante
        const { data: futureAppts } = await supabase
          .from("appointments")
          .select("patient_id, patients(id, first_name, last_name, tax_code)")
          .eq("practice_profile_id", practiceProfileId)
          .gt("starts_at", todayIso)
          .neq("status", "cancelled");

        if (futureAppts) {
          const seen = new Set<string>();
          for (const a of futureAppts as any[]) {
            const p = a.patients;
            if (p && (!p.tax_code || p.tax_code.trim() === "") && !seen.has(p.id)) {
              seen.add(p.id);
              result.push({
                id: `cf-${p.id}`,
                priority: "urgent",
                text: `Il paziente ${p.first_name} ${p.last_name} non ha il codice fiscale — serve per la Tessera Sanitaria`,
                actionLabel: "Vai al paziente",
                route: `/patients/${p.id}`,
              });
            }
          }
        }

        // 🔴 Pagamento in ritardo
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: oldCompleted } = await supabase
          .from("appointments")
          .select("id, starts_at, patient_id, patients(first_name, last_name)")
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "completed")
          .lt("starts_at", thirtyDaysAgo);

        if (oldCompleted && oldCompleted.length > 0) {
          const apptIds = (oldCompleted as any[]).map((a) => a.id);
          const { data: srs } = await supabase
            .from("service_records")
            .select("appointment_id, id")
            .in("appointment_id", apptIds);

          const paidApptIds = new Set<string>();
          if (srs && srs.length > 0) {
            const srIds = srs.map((s) => s.id);
            const { data: invs } = await supabase
              .from("invoices")
              .select("service_record_id, status")
              .in("service_record_id", srIds);
            if (invs) {
              for (const inv of invs) {
                if (inv.status === "paid") {
                  const sr = srs.find((s) => s.id === inv.service_record_id);
                  if (sr) paidApptIds.add(sr.appointment_id);
                }
              }
            }
          }

          for (const a of oldCompleted as any[]) {
            if (!paidApptIds.has(a.id) && a.patients) {
              const days = Math.floor((now.getTime() - new Date(a.starts_at).getTime()) / (1000 * 60 * 60 * 24));
              result.push({
                id: `late-pay-${a.id}`,
                priority: "urgent",
                text: `Pagamento in attesa da ${days} giorni — ${a.patients.first_name} ${a.patients.last_name}`,
                actionLabel: "Pagamenti",
                route: "/payments",
              });
            }
          }
        }

        // 🟡 Fattura da emettere
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        const { data: weekCompleted } = await supabase
          .from("appointments")
          .select("id, patient_id, patients(first_name, last_name)")
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "completed")
          .gte("starts_at", startOfWeek.toISOString())
          .lte("starts_at", todayIso);

        if (weekCompleted && weekCompleted.length > 0) {
          const wIds = (weekCompleted as any[]).map((a) => a.id);
          const { data: wSrs } = await supabase
            .from("service_records")
            .select("appointment_id, id")
            .in("appointment_id", wIds);

          const invoicedApptIds = new Set<string>();
          if (wSrs && wSrs.length > 0) {
            const wSrIds = wSrs.map((s) => s.id);
            const { data: wInvs } = await supabase
              .from("invoices")
              .select("service_record_id")
              .in("service_record_id", wSrIds);
            if (wInvs) {
              for (const inv of wInvs) {
                const sr = wSrs.find((s) => s.id === inv.service_record_id);
                if (sr) invoicedApptIds.add(sr.appointment_id);
              }
            }
          }

          for (const a of weekCompleted as any[]) {
            if (!invoicedApptIds.has(a.id) && a.patients) {
              result.push({
                id: `inv-${a.id}`,
                priority: "week",
                text: `Fattura da emettere per ${a.patients.first_name} ${a.patients.last_name}`,
                actionLabel: "Fatture",
                route: "/invoices",
              });
            }
          }
        }

        // 🟢 Paziente senza prossima seduta
        const { data: activePatients } = await supabase
          .from("patients")
          .select("id, first_name, last_name")
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "active");

        if (activePatients && activePatients.length > 0) {
          const { data: futureAll } = await supabase
            .from("appointments")
            .select("patient_id")
            .eq("practice_profile_id", practiceProfileId)
            .gt("starts_at", todayIso)
            .neq("status", "cancelled");

          const patientsWithFuture = new Set((futureAll ?? []).map((a) => a.patient_id));

          for (const p of activePatients) {
            if (!patientsWithFuture.has(p.id)) {
              result.push({
                id: `no-appt-${p.id}`,
                priority: "whenever",
                text: `${p.first_name} ${p.last_name} non ha una seduta prenotata`,
                actionLabel: "Agenda",
                route: "/calendar",
              });
            }
          }
        }
      } catch (err) {
        console.error("[AiCoachPanel]", err);
      }

      // Sort: ts-transmit always first, then by priority
      result.sort((a, b) => {
        if (a.id === "ts-transmit") return -1;
        if (b.id === "ts-transmit") return 1;
        return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
      });
      setSuggestions(result.slice(0, 10));
      setLoading(false);
    }

    analyze();
  }, [practiceProfileId]);

  async function handleTsConfirm() {
    setTsSubmitting(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ ts_transmitted: true })
        .in("id", tsApptIds);

      if (error) throw error;

      setSuggestions((prev) => prev.filter((s) => s.id !== "ts-transmit"));
      setTsCount(0);
      setTsApptIds([]);
      toast({ title: "Prestazioni segnate come trasmesse ✅" });
    } catch (err) {
      console.error("[AiCoachPanel] ts update error", err);
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    } finally {
      setTsSubmitting(false);
      setTsConfirmOpen(false);
    }
  }

  if (loading && atRiskLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {suggestions.map((s) => {
          const cfg = priorityConfig[s.priority];
          return (
            <div
              key={s.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card"
            >
              <span
                className={`shrink-0 mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
              >
                {cfg.emoji} {cfg.label}
              </span>
              <p className="flex-1 min-w-0 text-sm text-foreground leading-snug line-clamp-2">{s.text}</p>
              {s.id === "ts-transmit" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs h-7"
                  onClick={() => setTsConfirmOpen(true)}
                >
                  {s.actionLabel} <ChevronRight size={12} />
                </Button>
              ) : (
                s.actionLabel &&
                s.route && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs h-7"
                    onClick={() => navigate(s.route!)}
                  >
                    {s.actionLabel} <ChevronRight size={12} />
                  </Button>
                )
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={tsConfirmOpen} onOpenChange={setTsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma trasmissione</AlertDialogTitle>
            <AlertDialogDescription>
              Confermi la trasmissione di {tsCount} prestazioni?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={tsSubmitting}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleTsConfirm} disabled={tsSubmitting}>
              {tsSubmitting ? "Aggiornamento…" : "Conferma"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
