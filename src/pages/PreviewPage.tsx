import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Users, Bell, Receipt, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { cn } from "@/lib/utils";

const mockReminders = [
  { time: "09:00", patient: "Marco B.", type: "Colloquio individuale", color: "bg-primary" },
  { time: "11:30", patient: "Laura M.", type: "Prima visita", color: "bg-accent" },
  { time: "15:00", patient: "Giulia R.", type: "Follow-up", color: "bg-success" },
];

const mockStats = [
  { icon: Users, label: "Pazienti attivi", value: "24", color: "text-primary", bg: "bg-primary/10" },
  { icon: CalendarCheck, label: "Appuntamenti oggi", value: "5", color: "text-accent", bg: "bg-accent/10" },
  { icon: Receipt, label: "Fatture da inviare", value: "3", color: "text-success", bg: "bg-success/10" },
  { icon: Bell, label: "Promemoria attivi", value: "8", color: "text-warning", bg: "bg-warning/10" },
];

export default function PreviewPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Premium Gradient */}
      <div className="relative overflow-hidden bg-primary px-4 py-12 md:py-16 text-center">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-success rounded-full blur-[100px]" />
        </div>

        <div className="container max-w-xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-6 border border-white/10 animate-fade-in">
            <Sparkles size={14} className="text-accent-foreground" />
            Configurazione completata
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-tight">
            Il futuro del tuo studio <br /><span className="text-accent-foreground">inizia oggi</span>
          </h1>
          <p className="text-white/70 text-[15px] max-w-md mx-auto leading-relaxed">
            Esplora un'anteprima delle potenti funzionalità che Synapsi mette a tua disposizione per gestire la tua professione.
          </p>
        </div>
      </div>

      <div className="container max-w-xl mx-auto px-4 -mt-8 pb-12 space-y-8 relative z-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {mockStats.map((s) => (
            <div key={s.label} className="relative overflow-hidden group rounded-2xl border border-border bg-card p-5 shadow-lg shadow-black/5 transition-all hover:shadow-xl hover:-translate-y-0.5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", s.bg)}>
                <s.icon size={22} className={s.color} />
              </div>
              <p className="font-display text-3xl font-bold text-foreground tracking-tight mb-0.5">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              
              {/* Subtle background blur */}
              <div className={cn("absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-20", s.bg)} />
            </div>
          ))}
        </div>

        {/* Reminders Section */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <SectionHeader 
            title="Agenda di esempio" 
            subtitle="I tuoi prossimi appuntamenti" 
            className="mb-4" 
          />
          <div className="space-y-3">
            {mockReminders.map((r) => (
              <div key={r.time} className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
                <div className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 font-bold text-xs text-white shadow-md", r.color)}>
                  {r.time}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{r.patient}</p>
                  <p className="text-xs font-medium text-muted-foreground">{r.type}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Card */}
        <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-8 shadow-card text-center relative overflow-hidden animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-3">Tutto è pronto!</h3>
            <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">
              Il tuo studio digitale è stato configurato con successo. Accedi ora alla tua dashboard reale.
            </p>
            <Button 
                onClick={() => navigate("/dashboard")} 
                size="lg"
                className="w-full h-12 text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95"
            >
              Inizia a usare Synapsi <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
          
          {/* Decorative background blurs */}
          <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[140%] bg-primary/5 rounded-full blur-[80px]" />
        </div>
      </div>
    </div>
  );
}
