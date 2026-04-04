import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Clock, CheckCircle2, CalendarDays } from "lucide-react";
import { completeAppointmentCascade } from "@/lib/appointmentCascade";
import { auditSessionClosed } from "@/lib/auditLog";
import { MicroFeedback } from "@/components/MicroFeedback";
import posthog from "posthog-js";

const SERVICE_TYPES = [
  { value: "Colloquio individuale", label: "Colloquio individuale" },
  { value: "Follow-up", label: "Follow-up" },
  { value: "Prima visita", label: "Prima visita" },
  { value: "Consulenza", label: "Consulenza" },
  { value: "Colloquio di coppia", label: "Colloquio di coppia" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Contanti" },
  { value: "bank_transfer", label: "Bonifico" },
  { value: "card", label: "POS" },
  { value: "other", label: "Altro" },
];

interface AppointmentData {
  id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  status: string | null;
  patients: { first_name: string; last_name: string } | null;
}

interface PracticeDefaults {
  default_session_price: number | null;
  default_session_duration: number | null;
}

export default function SessionClosurePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const practiceProfileId = usePracticeProfileId();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: appt, error: apptErr } = await supabase
        .from("appointments")
        .select("id, patient_id, starts_at, ends_at, status, patients(first_name, last_name)")
        .eq("id", id!)
        .eq("practice_profile_id", practiceProfileId)
        .maybeSingle();

      if (apptErr) {
        console.error("[SessionClosure] appointment fetch error:", apptErr);
        toast({ title: "Errore caricamento appuntamento", description: apptErr.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      setAppointment(appt as AppointmentData | null);

      const { data: profile } = await supabase
        .from("practice_profiles")
        .select("default_session_price, default_session_duration")
        .eq("id", practiceProfileId)
        .maybeSingle();

      const defaults = profile as PracticeDefaults | null;
      if (defaults?.default_session_price) {
        setAmount(String(defaults.default_session_price));
      }
      setLoading(false);
    }
    if (id) load();
  }, [id, practiceProfileId]);

  const patientName = appointment?.patients
    ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
    : "Sconosciuto";

  const durationMinutes = appointment
    ? Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60000)
    : 0;

  const appointmentDate = appointment
    ? new Date(appointment.starts_at).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  const appointmentTime = appointment
    ? `${new Date(appointment.starts_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} – ${new Date(appointment.ends_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
    : "";

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = "Inserisci un importo positivo";
    }
    if (!serviceType) {
      newErrors.serviceType = "Seleziona il tipo di prestazione";
    }
    if (!paymentMethod) {
      newErrors.paymentMethod = "Seleziona il metodo di pagamento";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleClose() {
    if (!validate() || !appointment) return;
    setSubmitting(true);
    try {
      const result = await completeAppointmentCascade({
        id: appointment.id,
        patient_id: appointment.patient_id,
        practice_profile_id: practiceProfileId,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
      });

      // Update service_record with user-chosen fields
      await supabase.from("service_records").update({
        service_type: serviceType,
        admin_notes: adminNotes || null,
        amount: parseFloat(amount),
      }).eq("id", result.serviceRecordId);

      setCompleted(true);
      posthog.capture(
        "session_closed",
        {
          service_type: serviceType,
          payment_method: paymentMethod,
          amount: parseFloat(amount),
          duration_minutes: durationMinutes,
        },
        { send_instantly: true }
      );
      setShowFeedback(true);
      await auditSessionClosed(appointment.id, "service_recorded");
      toast({ title: "Seduta chiusa", description: "Servizio registrato. Genera la fattura mensile dalla sezione Fatture." });
    } catch (err: any) {
      console.error("[SessionClosure] cascade error:", err);
      toast({ title: "Errore chiusura seduta", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </PageContainer>
    );
  }

  if (!appointment) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <Clock size={32} className="text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Appuntamento non trovato</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/calendar")}>
            Torna all'agenda
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (completed) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Seduta chiusa</h2>
          <p className="text-sm text-muted-foreground max-w-[320px]">
            La seduta con {patientName} è stata registrata. Potrai generare la fattura mensile dalla sezione Fatture.
          </p>
          <div className="flex flex-col gap-2 w-full max-w-[320px] pt-4">
            <Button onClick={() => navigate("/invoices")}>
              Vai alle fatture
            </Button>
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <CalendarDays size={14} /> Torna alla dashboard
            </Button>
          </div>
          {showFeedback && <MicroFeedback contextAction="session_closure" onDismiss={() => setShowFeedback(false)} />}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/calendar")}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Chiudi seduta</h1>
            <p className="text-xs text-muted-foreground">{patientName}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Riepilogo</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paziente</span>
              <span className="font-medium text-foreground">{patientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium text-foreground capitalize">{appointmentDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Orario</span>
              <span className="font-medium text-foreground">{appointmentTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Durata</span>
              <span className="font-medium text-foreground">{durationMinutes} min</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <div className="space-y-2">
            <Label>Importo seduta (€)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: "" })); }}
              placeholder="80"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipo prestazione</Label>
            <Select value={serviceType} onValueChange={v => { setServiceType(v); setErrors(prev => ({ ...prev, serviceType: "" })); }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceType && <p className="text-xs text-destructive">{errors.serviceType}</p>}
          </div>

          <div className="space-y-2">
            <Label>Metodo di pagamento</Label>
            <Select value={paymentMethod} onValueChange={v => { setPaymentMethod(v); setErrors(prev => ({ ...prev, paymentMethod: "" })); }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona metodo" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod}</p>}
          </div>

          <div className="space-y-2">
            <Label>Note operative (opzionale)</Label>
            <Textarea
              placeholder="Note non cliniche..."
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value.slice(0, 300))}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">{adminNotes.length}/300</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleClose} disabled={submitting}>
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Chiusura in corso…</> : <><CheckCircle2 size={14} /> Chiudi seduta</>}
          </Button>
          <Button variant="outline" onClick={() => navigate("/calendar")} disabled={submitting}>
            Torna all'agenda
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
