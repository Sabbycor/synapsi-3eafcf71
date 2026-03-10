import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Users, Bell, Receipt, ArrowRight, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const mockReminders = [
  { time: "09:00", patient: "Marco B.", type: "Colloquio individuale" },
  { time: "11:30", patient: "Laura M.", type: "Prima visita" },
  { time: "15:00", patient: "Giulia R.", type: "Follow-up" },
];

const mockStats = [
  { icon: Users, label: "Pazienti attivi", value: "24" },
  { icon: CalendarCheck, label: "Appuntamenti oggi", value: "5" },
  { icon: Receipt, label: "Fatture da inviare", value: "3" },
  { icon: Bell, label: "Promemoria attivi", value: "8" },
];

export default function PreviewPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-primary px-4 py-8">
        <div className="container max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground text-xs font-medium mb-4">
            <CheckCircle2 size={12} />
            Configurazione completata
          </div>
          <h1 className="font-display text-2xl font-bold text-primary-foreground mb-2">
            Ecco come sarà la tua Synapsi
          </h1>
          <p className="text-primary-foreground/70 text-sm">
            Un'anteprima della tua dashboard e delle funzionalità principali
          </p>
        </div>
      </div>

      <div className="container max-w-xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {mockStats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary mb-2">
                <s.icon size={18} className="text-accent" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Reminders */}
        <div>
          <SectionHeader title="Promemoria di oggi" subtitle="I tuoi prossimi appuntamenti" className="mb-3" />
          <div className="space-y-2">
            {mockReminders.map((r) => (
              <div key={r.time} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                  <span className="text-xs font-semibold text-secondary-foreground">{r.time}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{r.patient}</p>
                  <p className="text-xs text-muted-foreground">{r.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center">
          <h3 className="font-display font-semibold text-foreground mb-2">Pronto per iniziare?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Accedi alla tua dashboard e inizia a gestire la tua attività
          </p>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Vai alla dashboard <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
