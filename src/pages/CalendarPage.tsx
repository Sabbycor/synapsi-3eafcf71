import { useState, useMemo, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import {
  appointments, patients, getPatientName, getPatientInitials,
  getAppointmentsForDate, appointmentStatusLabels, type AppointmentStatus,
} from "@/data/mock";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const STATUSES: (AppointmentStatus | "all")[] = ["all", "scheduled", "confirmed", "completed", "cancelled", "no_show"];

// Helper to generate week dates around March 10
function getWeekDates(baseDate: string): { date: string; dayLabel: string; dayNum: number }[] {
  const d = new Date(baseDate);
  const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return {
      date: dd.toISOString().slice(0, 10),
      dayLabel: DAYS_SHORT[i],
      dayNum: dd.getDate(),
    };
  });
}

function getMonthDates(year: number, month: number): { date: string; dayNum: number; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const result: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];
  
  // Previous month padding
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    result.push({ date: d.toISOString().slice(0, 10), dayNum: d.getDate(), isCurrentMonth: false });
  }
  
  // Current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    result.push({ date: d.toISOString().slice(0, 10), dayNum: i, isCurrentMonth: true });
  }
  
  // Next month padding
  const remaining = 7 - (result.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      result.push({ date: d.toISOString().slice(0, 10), dayNum: i, isCurrentMonth: false });
    }
  }
  
  return result;
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState("2026-03-10");
  const [view, setView] = useState<ViewMode>("day");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const monthDates = useMemo(() => getMonthDates(2026, 2), []); // March = index 2

  const filteredAppointments = useMemo(() => {
    let list: typeof appointments;
    if (view === "day") {
      list = getAppointmentsForDate(selectedDate);
    } else if (view === "week") {
      const weekDateSet = new Set(weekDates.map(d => d.date));
      list = appointments.filter(a => weekDateSet.has(a.date)).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    } else {
      list = appointments.filter(a => a.date.startsWith("2026-03")).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    }
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    return list;
  }, [selectedDate, view, statusFilter, weekDates]);

  const navigate = (dir: number) => {
    const d = new Date(selectedDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const dateLabel = (() => {
    const d = new Date(selectedDate);
    if (view === "day") return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    if (view === "week") return `${weekDates[0].dayNum}–${weekDates[6].dayNum} Marzo 2026`;
    return d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  })();

  const appointmentsWithEvents = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach(a => map.set(a.date, (map.get(a.date) || 0) + 1));
    return map;
  }, []);

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Agenda"
          action={<Button size="sm" onClick={() => setDrawerOpen(true)}><Plus size={14} /> Nuovo</Button>}
        />

        {/* View toggle */}
        <div className="flex rounded-lg border border-border bg-card p-1">
          {([
            { key: "day" as ViewMode, icon: CalendarDays, label: "Giorno" },
            { key: "week" as ViewMode, icon: CalendarRange, label: "Settimana" },
            { key: "month" as ViewMode, icon: CalendarIcon, label: "Mese" },
          ]).map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors",
                view === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <v.icon size={14} />
              {v.label}
            </button>
          ))}
        </div>

        {/* Date nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ChevronLeft size={16} /></Button>
          <span className="font-display font-semibold text-foreground text-sm capitalize">{dateLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}><ChevronRight size={16} /></Button>
        </div>

        {/* Week strip (day/week view) */}
        {(view === "day" || view === "week") && (
          <div className="flex gap-1">
            {weekDates.map((d) => (
              <button
                key={d.date}
                onClick={() => { setSelectedDate(d.date); if (view === "week") setView("day"); }}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors",
                  d.date === selectedDate
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="font-medium">{d.dayLabel}</span>
                <span className="font-semibold text-sm">{d.dayNum}</span>
                {d.date !== selectedDate && appointmentsWithEvents.has(d.date) && (
                  <div className="w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Month grid */}
        {view === "month" && (
          <div className="grid grid-cols-7 gap-1">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {monthDates.map((d, i) => {
              const count = appointmentsWithEvents.get(d.date) || 0;
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedDate(d.date); setView("day"); }}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors relative",
                    d.date === selectedDate ? "bg-primary text-primary-foreground"
                      : d.isCurrentMonth ? "text-foreground hover:bg-muted" : "text-muted-foreground/40"
                  )}
                >
                  {d.dayNum}
                  {count > 0 && d.date !== selectedDate && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Status filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {s === "all" ? "Tutti" : appointmentStatusLabels[s]}
            </button>
          ))}
        </div>

        {/* Appointments list */}
        {loading ? (
          <SkeletonList count={3} />
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nessun appuntamento"
            description={view === "day" ? "Nessuna seduta prevista per questo giorno" : "Nessun appuntamento nel periodo selezionato"}
            action={<Button size="sm" onClick={() => setDrawerOpen(true)}><Plus size={14} /> Aggiungi</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filteredAppointments.map((a) => (
              <div key={a.id} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-xs font-semibold text-foreground">{a.startTime}</span>
                  <div className="w-px flex-1 bg-border my-1" />
                  <span className="text-xs text-muted-foreground">{a.endTime}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground truncate">{getPatientName(a.patientId)}</p>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{a.type}</p>
                  {view !== "day" && <p className="text-xs text-muted-foreground mt-0.5">{a.date}</p>}
                  {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">{a.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Appointment Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuovo appuntamento</DrawerTitle>
            <DrawerDescription>Compila i dettagli per creare un nuovo appuntamento</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Paziente</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Seleziona paziente" /></SelectTrigger>
                <SelectContent>
                  {patients.filter(p => p.status === "active").map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Data</Label>
                <Input type="date" defaultValue={selectedDate} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Ora</Label>
                <Input type="time" defaultValue="09:00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Tipo</Label>
              <Select defaultValue="colloquio">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="colloquio">Colloquio individuale</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="prima_visita">Prima visita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Note</Label>
              <Input placeholder="Note opzionali..." />
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full">Crea appuntamento</Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Annulla</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
}
