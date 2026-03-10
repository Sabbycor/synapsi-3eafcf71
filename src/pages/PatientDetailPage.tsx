import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { AppointmentStatusBadge, InvoiceStatusBadge, ConsentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  getPatient, getAppointmentsForPatient, getInvoicesForPatient,
  getPaymentsForPatient, getTasksForPatient, getRemindersForPatient,
} from "@/data/mock";
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, CreditCard,
  Bell, ListTodo, CalendarPlus, UserX, ChevronRight, Shield,
} from "lucide-react";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const patient = getPatient(id || "");

  if (!patient) {
    return (
      <PageContainer>
        <EmptyState
          icon={UserX}
          title="Paziente non trovato"
          description="Il paziente potrebbe essere stato rimosso"
          action={<Button size="sm" onClick={() => navigate("/patients")}>Torna ai pazienti</Button>}
        />
      </PageContainer>
    );
  }

  const appts = getAppointmentsForPatient(patient.id);
  const invs = getInvoicesForPatient(patient.id);
  const pays = getPaymentsForPatient(patient.id);
  const tks = getTasksForPatient(patient.id);
  const rems = getRemindersForPatient(patient.id);

  const upcomingAppts = appts.filter(a => a.status === "scheduled" || a.status === "confirmed");
  const pastAppts = appts.filter(a => a.status === "completed" || a.status === "cancelled" || a.status === "no_show");

  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary shrink-0">
              <span className="text-base font-bold text-secondary-foreground">
                {patient.firstName[0]}{patient.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-lg font-bold text-foreground truncate">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-xs text-muted-foreground">{patient.totalSessions} sedute · {patient.status === "active" ? "Attivo" : "Inattivo"}</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Informazioni</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail size={14} /> <span>{patient.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} /> <span>{patient.phone}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">C.F.</span>
              <span className="text-foreground font-mono">{patient.fiscalCode}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Data di nascita</span>
              <span className="text-foreground">{patient.dateOfBirth}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Paziente dal</span>
              <span className="text-foreground">{patient.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Consent */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Consenso</h3>
            </div>
            <ConsentStatusBadge status={patient.consentStatus} />
          </div>
          {patient.consentDate && (
            <p className="text-xs text-muted-foreground mt-2">Firmato il {patient.consentDate}</p>
          )}
          {patient.consentStatus !== "signed" && (
            <Button variant="outline" size="sm" className="mt-3 w-full text-xs">Gestisci consenso</Button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="h-auto py-3 flex-col gap-1 text-xs">
            <CalendarPlus size={16} />
            Appuntamento
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1 text-xs">
            <FileText size={16} />
            Fattura
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1 text-xs">
            <CreditCard size={16} />
            Pagamento
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <div>
          <SectionHeader title="Prossimi appuntamenti" subtitle={`${upcomingAppts.length}`} className="mb-3" />
          {upcomingAppts.length === 0 ? (
            <EmptyState icon={Calendar} title="Nessun appuntamento" description="Pianifica una nuova seduta" />
          ) : (
            <div className="space-y-2">
              {upcomingAppts.map(a => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                    <span className="text-xs font-semibold text-secondary-foreground">{a.startTime}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.date}</p>
                    <p className="text-xs text-muted-foreground">{a.type}</p>
                  </div>
                  <AppointmentStatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        {pastAppts.length > 0 && (
          <div>
            <SectionHeader title="Storico sedute" subtitle={`${pastAppts.length}`} className="mb-3" />
            <div className="space-y-2">
              {pastAppts.map(a => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground">{a.startTime}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.date}</p>
                    <p className="text-xs text-muted-foreground">{a.type}</p>
                  </div>
                  <AppointmentStatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices */}
        <div>
          <SectionHeader title="Fatture" subtitle={`${invs.length}`} className="mb-3" />
          {invs.length === 0 ? (
            <EmptyState icon={FileText} title="Nessuna fattura" />
          ) : (
            <div className="space-y-2">
              {invs.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{inv.number}</p>
                    <p className="text-xs text-muted-foreground">€{inv.total} · {inv.date}</p>
                  </div>
                  <InvoiceStatusBadge status={inv.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments */}
        {pays.length > 0 && (
          <div>
            <SectionHeader title="Pagamenti" subtitle={`${pays.length}`} className="mb-3" />
            <div className="space-y-2">
              {pays.map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <CreditCard size={14} className="text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">€{p.amount}</p>
                    <p className="text-xs text-muted-foreground">{p.date} · {p.method === "bank_transfer" ? "Bonifico" : p.method === "cash" ? "Contanti" : "Carta"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks & Reminders */}
        {(tks.length > 0 || rems.length > 0) && (
          <div>
            <SectionHeader title="Attività e promemoria" className="mb-3" />
            <div className="space-y-2">
              {tks.map(t => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <ListTodo size={14} className="text-muted-foreground shrink-0" />
                  <p className={`text-sm flex-1 truncate ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</p>
                </div>
              ))}
              {rems.map(r => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <Bell size={14} className="text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
