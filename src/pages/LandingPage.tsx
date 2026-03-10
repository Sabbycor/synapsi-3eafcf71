import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Users, Receipt, Bell, Shield, Sparkles } from "lucide-react";

const features = [
  { icon: Users, title: "Gestione pazienti", desc: "Anagrafica completa e sempre accessibile" },
  { icon: CalendarCheck, title: "Agenda intelligente", desc: "Appuntamenti organizzati con promemoria" },
  { icon: Receipt, title: "Fatturazione rapida", desc: "Crea e invia fatture in pochi tocchi" },
  { icon: Bell, title: "Promemoria automatici", desc: "Notifiche per te e per i tuoi pazienti" },
  { icon: Shield, title: "Dati al sicuro", desc: "Privacy e sicurezza sempre garantite" },
  { icon: Sparkles, title: "Semplicità totale", desc: "Progettato per chi vuole concentrarsi sul lavoro" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container max-w-xl md:max-w-4xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Sparkles size={16} className="text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Synapsi</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Accedi
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container max-w-xl md:max-w-4xl mx-auto px-4 pt-16 pb-12 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-6">
          <Sparkles size={12} />
          Per psicologi indipendenti
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-4">
          Gestisci pazienti, appuntamenti e fatture senza stress
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto mb-8">
          L'app semplice e professionale per avere il pieno controllo della tua attività, ogni giorno.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="hero" size="lg" onClick={() => navigate("/register")} className="w-full sm:w-auto">
            Inizia ora
          </Button>
          <Button variant="hero-outline" size="lg" onClick={() => navigate("/preview")} className="w-full sm:w-auto">
            Guarda anteprima
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-xl md:max-w-4xl mx-auto px-4 py-12">
        <h2 className="font-display text-xl font-bold text-foreground text-center mb-8">
          Tutto ciò che ti serve, in un'unica app
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-5 shadow-card animate-slide-up"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary mb-3">
                <f.icon size={20} className="text-accent" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container max-w-xl md:max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Synapsi · Progettato per psicologi indipendenti
          </p>
        </div>
      </footer>
    </div>
  );
}
