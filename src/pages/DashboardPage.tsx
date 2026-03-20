import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonList } from "@/components/SkeletonCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { useToast } from "@/hooks/use-toast";
import type { AppointmentStatus } from "@/components/StatusBadge";
import {
  CalendarCheck, Receipt, AlertTriangle, Clock, CheckCircle2,
  Plus, ChevronRight, CalendarDays, FileText,
} from "lucide-react";

interface TodayAppointment {
  id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  status: string | null;
  patients: { first_name: string; last_name: string } | null;
  // Joined info for smart actions
  hasServiceRecord: boolean;
  hasInvoice: boolean;
  invoicePaid: boolean;
}

interface UrgentAction {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: React.ElementType;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const practiceProfileId = usePracticeProfileId();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Dottore/Dottoressa");
  const [todayAppts, setTodayAppts] = useState<TodayAppointment[]>([]);
  const [urgentActions, setUrgentActions] = useState<UrgentAction[]>([]);
  const [stats, setStats] = useState({ sessionsToday: 0, openInvoices: 0, overduePayments: 0 });

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59`;
  const dateLabel = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    if (!user) return;

    async function fetchAll() {
      setLoading(true);
      try {
        // 1. User greeting
        const { data: userData } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("id", user!.id)
          .maybeSingle();

        if (userData?.full_name) {
          setGreeting(userData.full_name.split(" ")[0] || "Dottore/Dottoressa");
        } else if (userData?.email) {
          setGreeting(userData.email);
        }

        // 2. Today's appointments
        const { data: appts, error: apptsErr } = await supabase
          .from("appointments")
          .select("id, patient_id, starts_at, ends_at, status, patients(first_name, last_name)")
          .eq("practice_profile_id", practiceProfileId)
          .gte("starts_at", startOfDay)
          .lte("starts_at", endOfDay)
          .order("starts_at", { ascending: true });

        if (apptsErr) {
          console.error("[Dashboard] appointments error:", apptsErr);
          toast({ title: "Errore caricamento appuntamenti", description: apptsErr.message, variant: "destructive" });
        }

        const apptList = (appts ?? []) as Array<{
          id: string; patient_id: string; starts_at: string; ends_at: string;
          status: string | null; patients: { first_name: string; last_name: string } | null;
        }>;

        // 3. For completed appointments, check service_records and invoices
        const completedIds = apptList.filter(a => a.status === "completed").map(a => a.id);

        let serviceRecordMap = new Map<string, boolean>();
        let invoiceMap = new Map<string, { exists: boolean; paid: boolean }>();

        if (completedIds.length > 0) {
          const { data: srs } = await supabase
            .from("service_records")
            .select("appointment_id, id")
            .in("appointment_id", completedIds);

          (srs ?? []).forEach(sr => serviceRecordMap.set(sr.appointment_id, true));

          const srIds = (srs ?? []).map(sr => sr.id);
          if (srIds.length > 0) {
            const { data: invs } = await supabase
              .from("invoices")
              .select("service_record_id, status")
              .in("service_record_id", srIds);

            (invs ?? []).forEach(inv => {
              if (inv.service_record_id) {
                // Find the appointment_id for this service_record
                const sr = (srs ?? []).find(s => s.id === inv.service_record_id);
                if (sr) {
                  invoiceMap.set(sr.appointment_id, {
                    exists: true,
                    paid: inv.status === "paid",
                  });
                }
              }
            });
          }
        }

        const enriched: TodayAppointment[] = apptList.map(a => ({
          ...a,
          hasServiceRecord: serviceRecordMap.has(a.id),
          hasInvoice: invoiceMap.has(a.id),
          invoicePaid: invoiceMap.get(a.id)?.paid ?? false,
        }));
        setTodayAppts(enriched);

        // 4. Stats: open invoices & overdue
        const [openRes, overdueRes] = await Promise.all([
          supabase.from("invoices").select("id", { count: "exact", head: true })
            .eq("practice_profile_id", practiceProfileId)
            .in("status", ["draft", "sent", "issued"]),
          supabase.from("invoices").select("id", { count: "exact", head: true })
            .eq("practice_profile_id", practiceProfileId)
            .eq("status", "overdue"),
        ]);

        setStats({
          sessionsToday: apptList.length,
          openInvoices: openRes.count ?? 0,
          overduePayments: overdueRes.count ?? 0,
        });

        // 5. Urgent actions
        const actions: UrgentAction[] = [];

        // Overdue invoices
        if ((overdueRes.count ?? 0) > 0) {
          actions.push({
            id: "overdue",
            label: "Fatture scadute",
            description: `${overdueRes.count} fattur${(overdueRes.count ?? 0) === 1 ? "a scaduta" : "e scadute"}`,
            route: "/invoices",
            icon: AlertTriangle,
          });
        }

        // Draft invoices to send
        const { count: draftCount } = await supabase
          .from("invoices").select("id", { count: "exact", head: true })
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "draft");

        if ((draftCount ?? 0) > 0) {
          actions.push({
            id: "drafts",
            label: "Fatture da inviare",
            description: `${draftCount} bozz${(draftCount ?? 0) === 1 ? "a" : "e"} da completare`,
            route: "/invoices",
            icon: FileText,
          });
        }

        // Open tasks
        const { count: taskCount } = await supabase
          .from("tasks").select("id", { count: "exact", head: true })
          .eq("practice_profile_id", practiceProfileId)
          .in("status", ["open", "todo"]);

        if ((taskCount ?? 0) > 0) {
          actions.push({
            id: "tasks",
            label: "Attività aperte",
            description: `${taskCount} attività da completare`,
            route: "/tasks",
            icon: CheckCircle2,
          });
        }

        setUrgentActions(actions.slice(0, 5));
      } catch (err: any) {
        console.error("[Dashboard] unexpected error:", err);
        toast({ title: "Errore", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [user, practiceProfileId]);

  function getTimeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  function getPatientName(a: TodayAppointment) {
    return a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "Sconosciuto";
  }

  // Loading
  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="h-7 w-52 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
          <SkeletonList count={3} />
        </div>
      </PageContainer>
    );
  }

  const statCards = [
    { icon: CalendarCheck, label: "Sedute oggi", value: stats.sessionsToday },
    { icon: Receipt, label: "Fatture aperte", value: stats.openInvoices },
    { icon: AlertTriangle, label: "In ritardo", value: stats.overduePayments, highlight: stats.overduePayments > 0 },
  ];

  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        {/* Greeting */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Buongiorno, {greeting} 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
        </div>

        {/* Quick Stats — 3 numbers */}
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border bg-card p-3.5 shadow-card ${s.highlight ? "border-destructive/30" : "border-border"}`}
            >
              <s.icon size={16} className={s.highlight ? "text-destructive" : "text-accent"} />
              <p className={`font-display text-2xl font-bold mt-1 ${s.highlight ? "text-destructive" : "text-foreground"}`}>
                {s.value}
              </p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Today's Appointments */}
        <div>
          <SectionHeader
            title="Appuntamenti di oggi"
            action={
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/calendar")}>
                Agenda <ChevronRight size={14} />
              </Button>
            }
            className="mb-3"
          />

          {todayAppts.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nessuna seduta oggi"
              description="Vuoi aggiungere un appuntamento?"
              action={
                <Button size="sm" onClick={() => navigate("/calendar")}>
                  <Plus size={14} /> Nuovo appuntamento
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {todayAppts.map((a) => {
                const status = (a.status as AppointmentStatus) ?? "scheduled";
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card">
                    {/* Time */}
                    <div className="shrink-0 text-center">
                      <p className="text-xs font-semibold text-foreground">{getTimeLabel(a.starts_at)}</p>
                      <p className="text-[10px] text-muted-foreground">{getTimeLabel(a.ends_at)}</p>
                    </div>

                    {/* Patient + status */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{getPatientName(a)}</p>
                      <AppointmentStatusBadge status={status} />
                    </div>

                    {/* Smart action */}
                    <div className="shrink-0">
                      {(status === "scheduled" || status === "confirmed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => navigate(`/appointments/${a.id}/close`)}
                        >
                          Completa
                        </Button>
                      )}
                      {status === "completed" && !a.hasServiceRecord && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => navigate(`/appointments/${a.id}/close`)}
                        >
                          Chiudi seduta
                        </Button>
                      )}
                      {status === "completed" && a.hasServiceRecord && !a.hasInvoice && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => toast({ title: "Prossimamente", description: "La generazione fattura sarà disponibile nel prossimo aggiornamento." })}
                        >
                          <FileText size={12} /> Fattura
                        </Button>
                      )}
                      {status === "completed" && a.hasInvoice && !a.invoicePaid && (
                        <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">
                          In attesa
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Urgent Actions */}
        <div>
          <SectionHeader title="Azioni urgenti" className="mb-3" />
          {urgentActions.length === 0 ? (
            <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
              <p className="text-sm font-medium text-success">Tutto in ordine per oggi ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {urgentActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.route)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <action.icon size={16} className="text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
