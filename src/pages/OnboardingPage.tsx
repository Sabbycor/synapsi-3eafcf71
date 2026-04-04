import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

const steps = [
  "Dati professionista",
  "Studio e impostazioni",
  "Prestazioni e tariffe",
  "Pagamenti e notifiche",
  "Riepilogo",
];

interface StepData {
  name: string;
  phone: string;
  specialization: string;
  studioName: string;
  studioAddress: string;
  service: string;
  rate: string;
  paymentMethod: string;
  reminders: boolean;
}

const initialData: StepData = {
  name: "",
  phone: "",
  specialization: "",
  studioName: "",
  studioAddress: "",
  service: "",
  rate: "",
  paymentMethod: "bonifico",
  reminders: true,
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<StepData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof StepData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!data.name) newErrors.name = "Campo obbligatorio";
      if (!data.phone) newErrors.phone = "Campo obbligatorio";
    } else if (step === 1) {
      if (!data.studioName) newErrors.studioName = "Campo obbligatorio";
    } else if (step === 2) {
      if (!data.service) newErrors.service = "Campo obbligatorio";
      if (!data.rate) newErrors.rate = "Campo obbligatorio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (step < 4 && validateStep()) setStep(step + 1);
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };
  const finish = () => {
    posthog.capture(
      "onboarding_completed",
      {
        specialization: data.specialization,
        payment_method: data.paymentMethod,
        reminders_enabled: data.reminders,
      },
      { send_instantly: true }
    );
    navigate("/preview");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Stepper */}
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="container max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors",
                    i < step && "bg-accent text-accent-foreground",
                    i === step && "bg-primary text-primary-foreground",
                    i > step && "bg-muted text-muted-foreground"
                  )}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("hidden sm:block w-8 h-0.5", i < step ? "bg-accent" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-foreground">{steps[step]}</p>
          <p className="text-xs text-muted-foreground">Passaggio {step + 1} di {steps.length}</p>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 container max-w-xl mx-auto px-4 py-6 animate-fade-in">
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Dott. Mario Rossi" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+39 333 1234567" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label>Specializzazione</Label>
              <Input value={data.specialization} onChange={(e) => update("specialization", e.target.value)} placeholder="Psicologia clinica" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome dello studio</Label>
              <Input value={data.studioName} onChange={(e) => update("studioName", e.target.value)} placeholder="Studio Rossi" />
              {errors.studioName && <p className="text-xs text-destructive">{errors.studioName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Indirizzo</Label>
              <Input value={data.studioAddress} onChange={(e) => update("studioAddress", e.target.value)} placeholder="Via Roma 1, Milano" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Prestazione principale</Label>
              <Input value={data.service} onChange={(e) => update("service", e.target.value)} placeholder="Colloquio individuale" />
              {errors.service && <p className="text-xs text-destructive">{errors.service}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tariffa (€)</Label>
              <Input value={data.rate} onChange={(e) => update("rate", e.target.value)} placeholder="80" type="number" />
              {errors.rate && <p className="text-xs text-destructive">{errors.rate}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Metodo di pagamento preferito</Label>
              <div className="flex gap-2">
                {["bonifico", "contanti", "carta"].map((m) => (
                  <button
                    key={m}
                    onClick={() => update("paymentMethod", m)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors",
                      data.paymentMethod === m
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Promemoria automatici</p>
                <p className="text-xs text-muted-foreground">Invia notifiche ai pazienti</p>
              </div>
              <button
                onClick={() => update("reminders", !data.reminders)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  data.reminders ? "bg-accent" : "bg-border"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full bg-card shadow-sm absolute top-0.5 transition-transform",
                  data.reminders ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
              <h3 className="font-display font-semibold text-foreground">Riepilogo</h3>
              <div className="space-y-2 text-sm">
                <Row label="Nome" value={data.name || "—"} />
                <Row label="Telefono" value={data.phone || "—"} />
                <Row label="Specializzazione" value={data.specialization || "—"} />
                <Row label="Studio" value={data.studioName || "—"} />
                <Row label="Indirizzo" value={data.studioAddress || "—"} />
                <Row label="Prestazione" value={data.service || "—"} />
                <Row label="Tariffa" value={data.rate ? `€${data.rate}` : "—"} />
                <Row label="Pagamento" value={data.paymentMethod} />
                <Row label="Promemoria" value={data.reminders ? "Attivi" : "Disattivi"} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-border bg-card px-4 py-4 safe-bottom">
        <div className="container max-w-xl mx-auto flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={prev} className="flex-1">
              <ChevronLeft size={16} /> Indietro
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={next} className="flex-1">
              Avanti <ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={finish} className="flex-1">
              Completa configurazione
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 items-baseline">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground capitalize text-right break-words min-w-0">{value}</span>
    </div>
  );
}
