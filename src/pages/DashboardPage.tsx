import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/SkeletonCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { useToast } from "@/hooks/use-toast";
import { AiCoachPanel } from "@/components/dashboard/AiCoachPanel";
import { MonthlyReports } from "@/components/dashboard/MonthlyReports";
import { WeeklyBriefingCard } from "@/components/dashboard/WeeklyBriefingCard";
import type { AppointmentStatus } from "@/components/StatusBadge";
import {
  CalendarCheck, Receipt, AlertTriangle, Plus, ChevronRight, CalendarDays, FileText,
} from "lucide-react";

interface TodayAppointment {
  id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  status: string | null;
  patients: { first_name: string; last_name: string } | null;
  hasServiceRecord: boolean;
  hasInvoice: boolean;
  invoicePaid: boolean;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const practiceProfileId = usePracticeProfileId();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Dottore/Dottoressa");
  const [todayAppts, setTodayAppts] = useState<TodayAppointment[]>([]);
  const [stats, setStats] = useState({ sessionsToday: 0, openInvoices: 0, overduePayments: 0 });

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59`;
  const dateLabel = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const reportMonthLabel = now.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!user) return;
    async function fetchAll() {
      setLoading(true);
      try {
        // Greeting
        const { data: userData } = await supabase.from("users").select("full_name, email").eq("id", user!.id).maybeSingle();
        if (userData?.full_name) setGreeting(userData.full_name.split(" ")[0] || "Dottore/Dottoressa");
        else if (userData?.email) setGreeting(userData.email);

        // Today's appointments
        const { data: appts } = await supabase
          .from("appointments")
          .select("id, patient_id, starts_at, ends_at, status, patients(first_name, last_name)")
          .eq("practice_profile_id", practiceProfileId)
          .gte("starts_at", startOfDay).lte("starts_at", endOfDay)
          .order("starts_at", { ascending: true });

        const apptList = (appts ?? []) as any[];

        // Enrich completed appointments
        const completedIds = apptList.filter(a => a.status === "completed").map(a => a.id);
        let serviceRecordMap = new Map<string, boolean>();
        let invoiceMap = new Map<string, { exists: boolean; paid: boolean }>();

        if (completedIds.length > 0) {
          const { data: srs } = await supabase.from("service_records").select("appointment_id, id").in("appointment_id", completedIds);
          (srs ?? []).forEach(sr => serviceRecordMap.set(sr.appointment_id, true));
          const srIds = (srs ?? []).map(sr => sr.id);
          if (srIds.length > 0) {
            const { data: invs } = await supabase.from("invoices").select("service_record_id, status").in("service_record_id", srIds);
            (invs ?? []).forEach(inv => {
              const sr = (srs ?? []).find(s => s.id === inv.service_record_id);
              if (sr) invoiceMap.set(sr.appointment_id, { exists: true, paid: inv.status === "paid" });
            });
          }
        }

        setTodayAppts(apptList.map(a => ({
          ...a,
          hasServiceRecord: serviceRecordMap.has(a.id),
          hasInvoice: invoiceMap.has(a.id),
          invoicePaid: invoiceMap.get(a.id)?.paid ?? false,
        })));

        // Stats
        const [openRes, overdueRes] = await Promise.all([
          supabase.from("invoices").select("id", { count: "exact", head: true })
            .eq("practice_profile_id", practiceProfileId).in("status", ["draft", "sent", "issued"]),
          supabase.from("invoices").select("id", { count: "exact", head: true })
            .eq("practice_profile_id", practiceProfileId).eq("status", "overdue"),
        ]);
        setStats({ sessionsToday: apptList.length, openInvoices: openRes.count ?? 0, overduePayments: overdueRes.count ?? 0 });
      } catch (err: any) {
        console.error("[Dashboard]", err);
        toast({ title: "Errore", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [user, practiceProfileId]);

  function getTimeLabel(iso: string) { return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }); }
  function getPatientName(a: TodayAppointment) { return a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "Sconosciuto"; }

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
        {/* Weekly Briefing */}
        <WeeklyBriefingCard />

        {/* Greeting */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Buongiorno, {greeting} 👋</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {statCards.map(s => (
            <div key={s.label} className={`rounded-xl border bg-card p-3 md:p-4 shadow-card ${s.highlight ? "border-destructive/30" : "border-border"}`}>
              <s.icon size={16} className={s.highlight ? "text-destructive" : "text-accent"} />
              <p className={`font-display text-xl md:text-2xl font-bold mt-1 ${s.highlight ? "text-destructive" : "text-foreground"}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Today's Appointments */}
        <div>
          <SectionHeader title="Appuntamenti di oggi" action={
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/calendar")}>Agenda <ChevronRight size={14} /></Button>
          } className="mb-3" />
          {todayAppts.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nessuna seduta oggi" description="Vuoi aggiungere un appuntamento?"
              action={<Button size="sm" onClick={() => navigate("/calendar")}><Plus size={14} /> Nuovo appuntamento</Button>} />
          ) : (
            <div className="space-y-2">
              {todayAppts.map(a => {
                const status = (a.status as AppointmentStatus) ?? "scheduled";
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card">
                    <div className="shrink-0 text-center">
                      <p className="text-xs font-semibold text-foreground">{getTimeLabel(a.starts_at)}</p>
                      <p className="text-[10px] text-muted-foreground">{getTimeLabel(a.ends_at)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{getPatientName(a)}</p>
                      <AppointmentStatusBadge status={status} />
                    </div>
                    <div className="shrink-0">
                      {(status === "scheduled" || status === "confirmed") && (
                        <Button variant="outline" size="sm" className="text-xs h-9 min-h-[44px]" onClick={() => navigate(`/appointments/${a.id}/close`)}>Completa</Button>
                      )}
                      {status === "completed" && !a.hasServiceRecord && (
                        <Button variant="outline" size="sm" className="text-xs h-9 min-h-[44px]" onClick={() => navigate(`/appointments/${a.id}/close`)}>Chiudi seduta</Button>
                      )}
                      {status === "completed" && a.hasServiceRecord && !a.hasInvoice && (
                        <Button variant="outline" size="sm" className="text-xs h-9 min-h-[44px]" onClick={() => navigate("/invoices")}><FileText size={12} /> Fattura</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom sections: same header spacing + same card shell so columns align */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="flex min-h-0 flex-col">
            <SectionHeader
              title="Azioni suggerite"
              className="mb-3 shrink-0"
              subtitle={
                <span className="invisible capitalize select-none" aria-hidden>
                  {reportMonthLabel}
                </span>
              }
            />
            <div className="min-h-0 flex-1 rounded-xl border border-border bg-card p-4 shadow-card">
              <AiCoachPanel />
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <SectionHeader
              title="Report del mese"
              className="mb-3 shrink-0"
              subtitle={
                <span className="invisible capitalize select-none" aria-hidden>
                  {reportMonthLabel}
                </span>
              }
            />
            <div className="min-h-0 flex-1 rounded-xl border border-border bg-card p-4 shadow-card">
              <MonthlyReports monthLabel={reportMonthLabel} />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
