import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getAppointment, getPatientName, practice } from "@/data/mock";
import {
  ArrowLeft, CheckCircle2, FileText, CreditCard, CalendarPlus, Clock,
  User, Receipt, ArrowRight, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Riepilogo", icon: User },
  { id: 2, label: "Conferma", icon: CheckCircle2 },
  { id: 3, label: "Fattura", icon: Receipt },
  { id: 4, label: "Pagamento", icon: CreditCard },
  { id: 5, label: "Follow-up", icon: CalendarPlus },
];

export default function SessionClosurePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appointment = getAppointment(id || "");
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);

  // Form state
  const [serviceType, setServiceType] = useState(appointment?.type || "Colloquio individuale");
  const [duration, setDuration] = useState(String(appointment?.duration || 50));
  const [amount, setAmount] = useState(String(appointment?.rate || practice.defaultRate));
  const [adminNotes, setAdminNotes] = useState("");
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const [markSent, setMarkSent] = useState(false);
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [createFollowUp, setCreateFollowUp] = useState(true);
  const [createReminder, setCreateReminder] = useState(false);

  if (!appointment) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <Clock size={32} className="text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Appuntamento non trovato</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/calendar")}>Torna all'agenda</Button>
        </div>
      </PageContainer>
    );
  }

  const patientName = getPatientName(appointment.patientId);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
    else {
      setCompleted(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (completed) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <Check size={32} className="text-success" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Seduta completata</h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            La seduta con {patientName} è stata chiusa correttamente.
            {generateInvoice && " Fattura generata."}
            {recordPayment && " Pagamento registrato."}
          </p>
          <div className="flex flex-col gap-2 w-full max-w-[280px] pt-4">
            <Button onClick={() => navigate("/dashboard")}>Torna alla dashboard</Button>
            <Button variant="outline" onClick={() => navigate(`/patients/${appointment.patientId}`)}>Vedi paziente</Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Chiudi seduta</h1>
            <p className="text-xs text-muted-foreground">{patientName} · {appointment.date} · {appointment.startTime}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors shrink-0",
                  step.id === currentStep ? "bg-primary text-primary-foreground"
                    : step.id < currentStep ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.id < currentStep ? <Check size={14} /> : step.id}
              </button>
              {i < steps.length - 1 && (
                <div className={cn("h-px flex-1 mx-1", step.id < currentStep ? "bg-success" : "bg-border")} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm font-medium text-foreground text-center">{steps[currentStep - 1].label}</p>

        {/* Step content */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          {currentStep === 1 && (
            <>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paziente</span>
                  <span className="font-medium text-foreground">{patientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium text-foreground">{appointment.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Orario</span>
                  <span className="font-medium text-foreground">{appointment.startTime} – {appointment.endTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium text-foreground">{appointment.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tariffa</span>
                  <span className="font-medium text-foreground">€{appointment.rate}</span>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo di prestazione</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Colloquio individuale">Colloquio individuale</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Prima visita">Prima visita</SelectItem>
                      <SelectItem value="Consulenza">Consulenza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Durata (min)</Label>
                    <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Importo (€)</Label>
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Note amministrative</Label>
                  <Textarea placeholder="Note opzionali..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} />
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Genera fattura</p>
                    <p className="text-xs text-muted-foreground">Crea bozza fattura per questa seduta</p>
                  </div>
                  <Switch checked={generateInvoice} onCheckedChange={setGenerateInvoice} />
                </div>
                {generateInvoice && (
                  <>
                    <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Numero</span>
                        <span className="font-mono text-foreground">{practice.invoicePrefix}{String(practice.invoiceNextNumber).padStart(3, "0")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Importo</span>
                        <span className="font-medium text-foreground">€{amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Descrizione</span>
                        <span className="text-foreground">{serviceType}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Segna come inviata</p>
                        <p className="text-xs text-muted-foreground">Invia automaticamente al paziente</p>
                      </div>
                      <Switch checked={markSent} onCheckedChange={setMarkSent} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Registra pagamento ora</p>
                    <p className="text-xs text-muted-foreground">Il paziente ha già pagato?</p>
                  </div>
                  <Switch checked={recordPayment} onCheckedChange={setRecordPayment} />
                </div>
                {recordPayment ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Metodo di pagamento</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Contanti</SelectItem>
                          <SelectItem value="card">Carta</SelectItem>
                          <SelectItem value="bank_transfer">Bonifico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                      <p className="text-sm text-success font-medium">Pagamento di €{amount} sarà registrato</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                    <p className="text-sm text-warning font-medium">Il pagamento resterà in sospeso</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Verrà creato un promemoria automatico</p>
                  </div>
                )}
              </div>
            </>
          )}

          {currentStep === 5 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Pianifica follow-up</p>
                    <p className="text-xs text-muted-foreground">Crea un promemoria per il prossimo appuntamento</p>
                  </div>
                  <Switch checked={createFollowUp} onCheckedChange={setCreateFollowUp} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Crea attività</p>
                    <p className="text-xs text-muted-foreground">Aggiungi un'attività collegata</p>
                  </div>
                  <Switch checked={createReminder} onCheckedChange={setCreateReminder} />
                </div>
                {/* Summary */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Riepilogo chiusura</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">✓ Seduta: <span className="text-foreground">{serviceType} · {duration} min · €{amount}</span></p>
                    <p className="text-muted-foreground">{generateInvoice ? "✓" : "✗"} Fattura {generateInvoice ? (markSent ? "generata e inviata" : "generata come bozza") : "non generata"}</p>
                    <p className="text-muted-foreground">{recordPayment ? "✓" : "✗"} Pagamento {recordPayment ? "registrato" : "in sospeso"}</p>
                    <p className="text-muted-foreground">{createFollowUp ? "✓" : "✗"} Follow-up {createFollowUp ? "pianificato" : "non creato"}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              <ArrowLeft size={14} /> Indietro
            </Button>
          )}
          <Button className="flex-1" onClick={handleNext}>
            {currentStep === 5 ? (
              <>
                <Check size={14} /> Completa chiusura
              </>
            ) : (
              <>
                Continua <ArrowRight size={14} />
              </>
            )}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
