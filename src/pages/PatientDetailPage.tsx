import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { AppointmentStatusBadge, InvoiceStatusBadge, ConsentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { SkeletonList } from "@/components/SkeletonCard";
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, CreditCard,
  CalendarPlus, UserX, Shield, Hash, Cake
} from "lucide-react";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cons, setCons] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const [invs, setInvs] = useState<any[]>([]);
  const [pays, setPays] = useState<any[]>([]);
  const [tks, setTks] = useState<any[]>([]);
  const [rems, setRems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ email: "", phone: "", tax_code: "", birth_date: "" });

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const { data: pat } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();
      setPatient(pat);

      const [{ data: a }, { data: i }, { data: p }, { data: t }, { data: r }, { data: c }] =
        await Promise.all([
          supabase.from("appointments").select("*").eq("patient_id", id),
          supabase.from("invoices").select("*").eq("patient_id", id),
          supabase.from("payments").select("*").eq("patient_id", id),
          supabase.from("tasks").select("*").eq("patient_id", id),
          supabase.from("reminders").select("*").eq("patient_id", id),
          supabase.from("patient_consents").select("*").eq("patient_id", id).order("created_at", { ascending: false })
        ]);

      setAppts(a ?? []);
      setInvs(i ?? []);
      setPays(p ?? []);
      setTks(t ?? []);
      setRems(r ?? []);
      setCons(c ?? []);
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  if (loading) return <PageContainer><SkeletonList count={4} /></PageContainer>;

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

  const upcomingAppts = appts.filter(a => a.status === "scheduled" || a.status === "confirmed");
  const pastAppts = appts.filter(a => a.status === "completed" || a.status === "cancelled" || a.status === "no_show");
  const latestConsent = cons[0] ?? null;
  const consentSigned = latestConsent?.accepted_at && !latestConsent?.revoked_at;

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
                {patient.first_name[0]}{patient.last_name[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-lg font-bold text-foreground truncate">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {appts.filter(a => a.status === "completed").length} sedute · {patient.status === "active" ? "Attivo" : "Inattivo"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Personal Infos*/}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Informazioni</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => {
                if (editingInfo) {
                  // Salva su Supabase
                  supabase
                    .from("patients")
                    .update({
                      email: infoForm.email,
                      phone: infoForm.phone,
                      tax_code: infoForm.tax_code,
                      birth_date: infoForm.birth_date,
                    })
                    .eq("id", id)
                    .then(({ error }) => {
                      if (!error) {
                        setPatient({ ...patient, ...infoForm });
                      }
                    });
                } else {
                  setInfoForm({
                    email: patient.email ?? "",
                    phone: patient.phone ?? "",
                    tax_code: patient.tax_code ?? "",
                    birth_date: patient.birth_date ?? "",
                  });
                }
                setEditingInfo(!editingInfo);
              }}
            >
              {editingInfo ? "Salva" : "Modifica"}
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            {editingInfo ? (
              <>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  <input
                    className="flex-1 bg-muted rounded-md px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    value={infoForm.email}
                    onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Email"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-muted-foreground shrink-0" />
                  <input
                    className="flex-1 bg-muted rounded-md px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    value={infoForm.phone}
                    onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Telefono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-muted-foreground shrink-0" />
                  <input
                    className="flex-1 bg-muted rounded-md px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    value={infoForm.tax_code}
                    onChange={e => setInfoForm(f => ({ ...f, tax_code: e.target.value }))}
                    placeholder="Codice fiscale"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Cake size={14} className="text-muted-foreground shrink-0" />
                  <input
                    type="date"
                    className="flex-1 bg-muted rounded-md px-2 py-1 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                    value={infoForm.birth_date}
                    onChange={e => setInfoForm(f => ({ ...f, birth_date: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} /> <span>{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} /> <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash size={14} /> <span>{patient.tax_code}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cake size={14} /> <span>{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString("it-IT") : "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar size={14} /> <span>{new Date(patient.created_at).toLocaleDateString("it-IT")}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Consent */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Consenso</h3>
            </div>
            <ConsentStatusBadge status={consentSigned ? "signed" : "pending"} />
          </div>
          {latestConsent?.accepted_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Firmato il {new Date(latestConsent.accepted_at).toLocaleDateString("it-IT")}
            </p>
          )}
          {!consentSigned && (
            <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
              Gestisci consenso
            </Button>
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
                    <span className="text-xs font-semibold text-secondary-foreground">{a.starts_at}</span>
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
                    <span className="text-xs font-semibold text-muted-foreground">{a.starts_at}</span>
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
      </div>
    </PageContainer>
  );
}
