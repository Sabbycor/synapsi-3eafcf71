import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Users, Receipt, Bell, Plus, ChevronRight } from "lucide-react";

const mockToday = [
  { time: "09:00", patient: "Marco Bianchi", type: "Colloquio" },
  { time: "11:30", patient: "Laura Martini", type: "Prima visita" },
  { time: "14:00", patient: "Giulia Russo", type: "Follow-up" },
  { time: "16:30", patient: "Andrea Colombo", type: "Colloquio" },
];

const quickStats = [
  { icon: Users, label: "Pazienti", value: "24", color: "text-accent" },
  { icon: CalendarCheck, label: "Oggi", value: "4", color: "text-accent" },
  { icon: Receipt, label: "Da fatturare", value: "3", color: "text-accent" },
  { icon: Bell, label: "Promemoria", value: "2", color: "text-accent" },
];

export default function DashboardPage() {
  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        {/* Greeting */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Buongiorno, Dottore 👋</h1>
          <p className="text-sm text-muted-foreground">Ecco il riepilogo della tua giornata</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <s.icon size={18} className={s.color} />
              <p className="font-display text-2xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Today's schedule */}
        <div>
          <SectionHeader
            title="Agenda di oggi"
            action={<Button variant="ghost" size="sm">Vedi tutto <ChevronRight size={14} /></Button>}
            className="mb-3"
          />
          <div className="space-y-2">
            {mockToday.map((a) => (
              <div key={a.time} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                  <span className="text-xs font-semibold text-secondary-foreground">{a.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.patient}</p>
                  <p className="text-xs text-muted-foreground">{a.type}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-3 flex-col gap-1">
            <Plus size={18} />
            <span className="text-xs">Nuovo paziente</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1">
            <CalendarCheck size={18} />
            <span className="text-xs">Nuovo appuntamento</span>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
