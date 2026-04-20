import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge, InvoiceStatusBadge, ConsentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { SkeletonList } from "@/components/SkeletonCard";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area, Label as RechartsLabel
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, CreditCard,
  CalendarPlus, UserX, Shield, Hash, Cake, Trash2, Filter
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cons, setCons] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const [invs, setInvs] = useState<any[]>([]);
  const [pays, setPays] = useState<any[]>([]);
  const [tks, setTks] = useState<any[]>([]);
  const [rems, setRems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInfo, setEditingInfo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [infoForm, setInfoForm] = useState({ email: "", phone: "", tax_code: "", birth_date: "" });
  const [activeTab, setActiveTab] = useState<"appts" | "invs" | "pays">("appts");
  const [historyMonth, setHistoryMonth] = useState<string>("all");

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Paziente eliminato" });
      navigate("/patients");
    } catch (err: any) {
      console.error("[PatientDetail] delete error:", err);
      toast({
        title: "Errore eliminazione",
        description: err.message.includes("foreign key")
          ? "Impossibile eliminare: il paziente ha documenti o appuntamenti associati. Prova a renderlo inattivo."
          : "Errore durante l'eliminazione.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const upcomingAppts = appts.filter(a => a.status === "scheduled" || a.status === "confirmed");
  const pastAppts = appts.filter(a => a.status === "completed" || a.status === "cancelled" || a.status === "no_show");
  const latestConsent = cons[0] ?? null;
  const consentSigned = latestConsent?.accepted_at && !latestConsent?.revoked_at;

  const formatDate = (ds: string) => {
    if (!ds) return "—";
    const d = new Date(ds);
    if (isNaN(d.getTime())) return ds;
    return d.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const attendanceData = useMemo(() => {
    try {
      const months: Record<string, number> = {};
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - (5 - i));
        return d.toLocaleString("it-IT", { month: "short" }).replace(".", "");
      });

      last6Months.forEach(m => (months[m] = 0));

      appts.forEach(a => {
        if (!a.starts_at) return;
        const d = new Date(a.starts_at);
        if (isNaN(d.getTime())) return;
        const m = d.toLocaleString("it-IT", { month: "short" }).replace(".", "");
        if (months[m] !== undefined) months[m]++;
      });

      return Object.entries(months).map(([name, total]) => ({ name, total }));
    } catch (e) {
      console.error("Error calculating attendance data", e);
      return [];
    }
  }, [appts]);

  const statusData = useMemo(() => {
    try {
      const stats = {
        completed: appts.filter(a => a.status === "completed").length,
        no_show: appts.filter(a => a.status === "no_show").length,
        cancelled: appts.filter(a => a.status === "cancelled").length,
        upcoming: appts.filter(a => ["scheduled", "confirmed"].includes(a.status)).length,
      };
      return [
        { name: "Completati", value: stats.completed, fill: "#10b981" },
        { name: "Assenze", value: stats.no_show, fill: "#ef4444" },
        { name: "Annullati", value: stats.cancelled, fill: "#f59e0b" },
        { name: "Programmati", value: stats.upcoming, fill: "#3b82f6" },
      ].filter(d => d.value > 0);
    } catch (e) {
      return [];
    }
  }, [appts]);

  const chartConfig = {
    total: { label: "Sedute" },
    Completati: { label: "Completate", color: "#10b981" },
    Assenze: { label: "Assenze", color: "#ef4444" },
    Annullati: { label: "Annullate", color: "#f59e0b" },
    Programmati: { label: "Programmate", color: "#3b82f6" },
  } satisfies ChartConfig;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const initials = `${patient?.first_name?.[0] || ""}${patient?.last_name?.[0] || ""}`;

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
                {initials}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={18} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione eliminerà definitivamente il paziente e non potrà essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                  if (!infoForm.tax_code.trim()) {
                    toast({ title: "Campo obbligatorio", description: "Il codice fiscale è richiesto.", variant: "destructive" });
                    return;
                  }
                  if (infoForm.tax_code.trim().length !== 16) {
                    toast({ title: "Codice fiscale non valido", description: "Il codice fiscale deve essere esattamente di 16 caratteri.", variant: "destructive" });
                    return;
                  }
                  // Salva su Supabase
                  supabase
                    .from("patients")
                    .update({
                      email: infoForm.email.trim() || null,
                      phone: infoForm.phone.trim() || null,
                      tax_code: infoForm.tax_code.trim() || null,
                      birth_date: infoForm.birth_date || null,
                    })
                    .eq("id", id)
                    .then(({ error }) => {
                      if (!error) {
                        setPatient({ ...patient, ...infoForm });
                        toast({ title: "Informazioni aggiornate" });
                        setEditingInfo(false);
                      } else {
                        console.error("[PatientDetail] update error:", error);
                        const msg = error.message;
                        let description = msg;
                        if (msg.includes("patients_tax_code_key") || (msg.includes("duplicate") && msg.includes("tax_code"))) {
                          description = "Esiste già un paziente con questo codice fiscale.";
                        } else if (msg.includes("patients_email_key") || (msg.includes("duplicate") && msg.includes("email"))) {
                          description = "Esiste già un paziente con questa email.";
                        } else if (msg.includes("patients_phone_key") || (msg.includes("duplicate") && msg.includes("phone"))) {
                          description = "Esiste già un paziente con questo numero di telefono.";
                        } else if (msg.includes("patients_birth_date_key") || (msg.includes("duplicate") && msg.includes("birth_date"))) {
                          description = "Esiste già un paziente con questa data di nascita.";
                        } else if (msg.includes("invalid input syntax for type date")) {
                          description = "Il formato della data inserita non è valido.";
                        }
                        toast({ title: "Errore aggiornamento", description, variant: "destructive" });
                      }
                    });
                } else {
                  setInfoForm({
                    email: patient.email ?? "",
                    phone: patient.phone ?? "",
                    tax_code: patient.tax_code ?? "",
                    birth_date: patient.birth_date ?? "",
                  });
                  setEditingInfo(true);
                }
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
                    onChange={e => setInfoForm(f => ({ ...f, tax_code: e.target.value.toUpperCase() }))}
                    placeholder="Codice fiscale *"
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
              </>
            )}
          </div>
        </div>

        {/* Progress Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 text-center">Andamento Sedute</h3>
            <div className="h-[200px] w-full">
              <ChartContainer config={chartConfig} className="aspect-auto h-[200px]">
                <LineChart data={attendanceData} margin={{ top: 20, left: 10, right: 10 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={12}
                    axisLine={false}
                    className="capitalize text-[10px] font-medium"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--primary)", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    label={{ position: "top", offset: 10, fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 600 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 text-center">Distribuzione Stati</h3>
            <div className="h-[200px] w-full">
              {statusData.length > 0 ? (
                <ChartContainer config={chartConfig} className="aspect-auto h-[200px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      cornerRadius={4}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} className="stroke-transparent outline-none" />
                      ))}
                      <RechartsLabel
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {appts.length}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 20}
                                  className="fill-muted-foreground text-[10px] uppercase font-medium"
                                >
                                  Totali
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium" />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground italic font-medium">
                  Nessun dato disponibile
                </div>
              )}
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

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={activeTab === "appts" ? "default" : "outline"}
            className={cn("h-auto py-3 flex-col gap-1 text-xs transition-all duration-200", activeTab === "appts" && "shadow-md scale-[1.02]")}
            onClick={() => setActiveTab("appts")}
          >
            <CalendarPlus size={16} />
            Appuntamenti
          </Button>
          <Button
            variant={activeTab === "invs" ? "default" : "outline"}
            className={cn("h-auto py-3 flex-col gap-1 text-xs transition-all duration-200", activeTab === "invs" && "shadow-md scale-[1.02]")}
            onClick={() => setActiveTab("invs")}
          >
            <FileText size={16} />
            Fatture
          </Button>
          <Button
            variant={activeTab === "pays" ? "default" : "outline"}
            className={cn("h-auto py-3 flex-col gap-1 text-xs transition-all duration-200", activeTab === "pays" && "shadow-md scale-[1.02]")}
            onClick={() => setActiveTab("pays")}
          >
            <CreditCard size={16} />
            Pagamenti
          </Button>
        </div>

        {/* Dynamic Content Sections */}
        <div className="min-h-[300px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === "appts" && (
            <div className="space-y-6">
              {/* Upcoming Appointments */}
              <div>
                <SectionHeader title="Prossimi appuntamenti" subtitle={`${upcomingAppts.length}`} className="mb-3" />
                {upcomingAppts.length === 0 ? (
                  <EmptyState icon={Calendar} title="Nessun appuntamento" description="Pianifica una nuova seduta" />
                ) : (
                  <div className="space-y-2">
                    {upcomingAppts.map(a => (
                      <div key={a.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-card">
                        <div className="flex flex-col items-center justify-center h-12 rounded-lg bg-secondary shrink-0 w-[110px]">
                          <span className="text-[11px] font-bold text-secondary-foreground text-center leading-tight">
                            {formatDate(a.starts_at).split(", ")[0]}
                          </span>
                          <span className="text-[10px] font-medium text-secondary-foreground/70 text-center">
                            {formatDate(a.starts_at).split(", ")[1]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-foreground leading-tight">{a.type || "Colloquio"}</p>
                          <p className="text-xs text-muted-foreground">{a.location_type === "online" ? "Online" : "In presenza"}</p>
                        </div>
                        <AppointmentStatusBadge status={a.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Appointments */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader 
                    title="Storico sedute" 
                    subtitle={`${pastAppts.length} totali`} 
                    className="mb-0" 
                  />
                  {pastAppts.length > 0 && (
                    <Select value={historyMonth} onValueChange={setHistoryMonth}>
                      <SelectTrigger className="w-[160px] h-8 text-[10px] bg-background">
                        <Filter className="w-3 h-3 mr-2 opacity-50" />
                        <SelectValue placeholder="Filtra mese" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i mesi</SelectItem>
                        {(() => {
                          const mArr: { key: string; label: string }[] = [];
                          const seen = new Set<string>();
                          pastAppts.forEach(a => {
                            if (a.starts_at) {
                              const d = new Date(a.starts_at);
                              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                              if (!seen.has(key)) {
                                mArr.push({ 
                                  key, 
                                  label: d.toLocaleString('it-IT', { month: 'long', year: 'numeric' }) 
                                });
                                seen.add(key);
                              }
                            }
                          });
                          return mArr.sort((a,b) => b.key.localeCompare(a.key)).map(m => (
                            <SelectItem key={m.key} value={m.key} className="capitalize">{m.label}</SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {pastAppts.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground italic font-medium">Nessuna seduta passata registrata</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastAppts
                      .filter(a => {
                        if (historyMonth === "all") return true;
                        if (!a.starts_at) return false;
                        const d = new Date(a.starts_at);
                        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                        return key === historyMonth;
                      })
                      .map(a => (
                        <div key={a.id} className="flex items-center gap-4 rounded-xl border border-transparent bg-muted/20 p-3 hover:bg-muted/30 transition-colors">
                          <div className="flex flex-col items-center justify-center h-12 rounded-lg bg-muted shrink-0 w-[110px]">
                            <span className="text-[11px] font-bold text-muted-foreground text-center leading-tight uppercase">
                              {formatDate(a.starts_at).split(", ")[0]}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground/60 text-center uppercase">
                              {formatDate(a.starts_at).split(", ")[1]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground/80">{a.type || "Colloquio"}</p>
                            <p className="text-[10px] text-muted-foreground/70 truncate">
                              {a.location_type === "online" ? "Sessione Online" : "In Studio"} · Durata 50 min
                            </p>
                          </div>
                          <div className="shrink-0 scale-90 origin-right">
                            <AppointmentStatusBadge status={a.status} />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "invs" && (
            <div className="space-y-4">
              <SectionHeader title="Elenco Fatture" subtitle={`${invs.length}`} className="mb-3" />
              {invs.length === 0 ? (
                <EmptyState icon={FileText} title="Nessuna fattura" description="Non ci sono fatture emesse per questo paziente." />
              ) : (
                <div className="space-y-2">
                  {invs.map(inv => (
                    <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card active:scale-[0.98] transition-transform">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{inv.number}</p>
                        <p className="text-xs text-muted-foreground">€{inv.total} · {formatDate(inv.date).split(" ")[0]}</p>
                      </div>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "pays" && (
            <div className="space-y-4">
              <SectionHeader title="Storico Pagamenti" subtitle={`${pays.length}`} className="mb-3" />
              {pays.length === 0 ? (
                 <EmptyState icon={CreditCard} title="Nessun pagamento" description="Non sono ancora stati registrati pagamenti." />
              ) : (
                <div className="space-y-2">
                  {pays.map(p => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                        <CreditCard size={16} className="text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">€{p.amount}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.date)} · {p.method === "bank_transfer" ? "Bonifico" : p.method === "cash" ? "Contanti" : "Carta"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
