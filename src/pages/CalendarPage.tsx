import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const dates = Array.from({ length: 7 }, (_, i) => ({ day: days[i], date: 9 + i, hasEvent: i < 5 }));

const mockEvents = [
  { time: "09:00", end: "10:00", patient: "Marco Bianchi", type: "Colloquio individuale" },
  { time: "11:30", end: "12:30", patient: "Laura Martini", type: "Prima visita" },
  { time: "14:00", end: "15:00", patient: "Giulia Russo", type: "Follow-up" },
  { time: "16:30", end: "17:30", patient: "Andrea Colombo", type: "Colloquio individuale" },
];

export default function CalendarPage() {
  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Agenda"
          action={<Button size="sm"><Plus size={14} /> Nuovo</Button>}
        />

        {/* Month header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon"><ChevronLeft size={16} /></Button>
          <span className="font-display font-semibold text-foreground">Marzo 2026</span>
          <Button variant="ghost" size="icon"><ChevronRight size={16} /></Button>
        </div>

        {/* Week strip */}
        <div className="flex gap-1">
          {dates.map((d) => (
            <button
              key={d.day}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors",
                d.date === 10
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="font-medium">{d.day}</span>
              <span className="font-semibold text-sm">{d.date}</span>
              {d.hasEvent && d.date !== 10 && <div className="w-1 h-1 rounded-full bg-accent" />}
            </button>
          ))}
        </div>

        {/* Events */}
        <div className="space-y-2">
          {mockEvents.map((e) => (
            <div key={e.time} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex flex-col items-center shrink-0">
                <span className="text-xs font-semibold text-foreground">{e.time}</span>
                <div className="w-px flex-1 bg-border my-1" />
                <span className="text-xs text-muted-foreground">{e.end}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{e.patient}</p>
                <p className="text-xs text-muted-foreground">{e.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
