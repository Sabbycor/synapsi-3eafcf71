import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge, InvoiceStatusBadge } from "@/components/StatusBadge";
import { SkeletonList } from "@/components/SkeletonCard";
import {
  psychologist, dashboardStats, appointments, invoices, tasks, reminders, aiCoachSuggestions,
  getPatientName, getPatientInitials, getAppointmentsForDate,
} from "@/data/mock";
import {
  CalendarCheck, Users, Receipt, AlertTriangle, Plus, ChevronRight,
  UserPlus, FileText, CreditCard, CheckCircle2, Sparkles, Bell, ListTodo,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const todayAppointments = getAppointmentsForDate("2026-03-10");
  const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "draft");
  const overdueInvoices = invoices.filter(i => i.status === "overdue");
  const openTasks = tasks.filter(t => !t.completed);
  const unreadReminders = reminders.filter(r => !r.read);

  const stats = [
    { icon: Users, label: "Pazienti attivi", value: dashboardStats.patientsActive },
    { icon: CalendarCheck, label: "Oggi", value: dashboardStats.appointmentsToday },
    { icon: Receipt, label: "Da fatturare", value: dashboardStats.pendingInvoices },
    { icon: AlertTriangle, label: "Scadute", value: dashboardStats.overduePayments },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="h-7 w-52 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
          </div>
          <SkeletonList count={3} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        {/* Greeting */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Buongiorno, {psychologist.firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">Martedì 10 marzo 2026</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <s.icon size={18} className="text-accent" />
              <p className="font-display text-2xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* AI Coach */}
        <div>
          <SectionHeader
            title="AI Coach"
            action={<Sparkles size={16} className="text-accent" />}
            className="mb-3"
          />
          <div className="space-y-2">
            {aiCoachSuggestions.slice(0, 2).map((s) => (
              <div key={s.id} className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    {s.action && (
                      <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs text-accent">
                        {s.action} <ChevronRight size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div>
          <SectionHeader
            title="Appuntamenti di oggi"
            subtitle={`${todayAppointments.length} sessioni`}
            action={<Button variant="ghost" size="sm" onClick={() => navigate("/calendar")}>Vedi tutto <ChevronRight size={14} /></Button>}
            className="mb-3"
          />
          <div className="space-y-2">
            {todayAppointments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                  <span className="text-xs font-semibold text-secondary-foreground">{a.startTime}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{getPatientName(a.patientId)}</p>
                  <p className="text-xs text-muted-foreground">{a.type}</p>
                </div>
                <AppointmentStatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invoices */}
        {pendingInvoices.length > 0 && (
          <div>
            <SectionHeader title="Fatture in sospeso" subtitle={`${pendingInvoices.length} da gestire`} className="mb-3" />
            <div className="space-y-2">
              {pendingInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                    <FileText size={16} className="text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.number} — {getPatientName(inv.patientId)}</p>
                    <p className="text-xs text-muted-foreground">€{inv.total} · Scadenza {inv.dueDate}</p>
                  </div>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue */}
        {overdueInvoices.length > 0 && (
          <div>
            <SectionHeader title="Pagamenti scaduti" subtitle={`${overdueInvoices.length} in ritardo`} className="mb-3" />
            <div className="space-y-2">
              {overdueInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 shrink-0">
                    <AlertTriangle size={16} className="text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.number} — {getPatientName(inv.patientId)}</p>
                    <p className="text-xs text-muted-foreground">€{inv.total} · Scaduta il {inv.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Tasks */}
        <div>
          <SectionHeader title="Attività" subtitle={`${openTasks.length} da fare`} className="mb-3" />
          <div className="space-y-2">
            {openTasks.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                <div className={`w-2 h-2 rounded-full shrink-0 ${t.priority === "high" ? "bg-destructive" : t.priority === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
                <p className="text-sm text-foreground flex-1 truncate">{t.title}</p>
                <span className="text-xs text-muted-foreground shrink-0">{t.dueDate.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders */}
        {unreadReminders.length > 0 && (
          <div>
            <SectionHeader title="Promemoria" subtitle={`${unreadReminders.length} nuovi`} className="mb-3" />
            <div className="space-y-2">
              {unreadReminders.map((r) => (
                <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <Bell size={14} className="text-accent mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <SectionHeader title="Azioni rapide" className="mb-3" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: UserPlus, label: "Nuovo paziente", to: "/patients" },
              { icon: CalendarCheck, label: "Appuntamento", to: "/calendar" },
              { icon: CheckCircle2, label: "Completa seduta" },
              { icon: FileText, label: "Genera fattura" },
              { icon: CreditCard, label: "Registra pagamento" },
            ].map((qa) => (
              <Button
                key={qa.label}
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => qa.to && navigate(qa.to)}
              >
                <qa.icon size={18} />
                <span className="text-xs">{qa.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
