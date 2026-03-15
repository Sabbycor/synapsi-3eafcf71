import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { useToast } from "@/hooks/use-toast";
import { appointmentStatusLabels, type AppointmentStatus } from "@/data/mock";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const STATUSES: (AppointmentStatus | "all")[] = ["all", "scheduled", "confirmed", "completed", "cancelled", "no_show"];

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getWeekDates(baseDate: string) {
  const d = parseLocalDate(baseDate);
  const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return { date: dd.toISOString().slice(0, 10), dayLabel: DAYS_SHORT[i], dayNum: dd.getDate() };
  });
}

function getMonthDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const result: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    result.push({ date: d.toISOString().slice(0, 10), dayNum: d.getDate(), isCurrentMonth: false });
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    result.push({ date: d.toISOString().slice(0, 10), dayNum: i, isCurrentMonth: true });
  }
  const remaining = 7 - (result.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      result.push({ date: d.toISOString().slice(0, 10), dayNum: i, isCurrentMonth: false });
    }
  }
  return result;
}

interface DbAppointment {
  id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  status: string | null;
  location_type: string | null;
  cancellation_reason: string | null;
  patients: { first_name: string; last_name: string } | null;
}

interface PatientOption {
  id: string;
  first_name: string;
  last_name: string;
}

export default function CalendarPage() {
  const practiceProfileId = usePracticeProfileId();
  const navigate = useNavigate();
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<ViewMode>("day");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [patientsList, setPatientsList] = useState<PatientOption[]>([]);
  const [creating, setCreating] = useState(false);

  // New appointment form state
  const [newPatientId, setNewPatientId] = useState("");
  const [newDate, setNewDate] = useState(today);
  const [newTime, setNewTime] = useState("09:00");
  const [newType, setNewType] = useState("colloquio");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, patient_id, starts_at, ends_at, status, location_type, cancellation_reason, patients(first_name, last_name)")
      .eq("practice_profile_id", practiceProfileId)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("[Calendar] appointments fetch error:", error);
      toast({ title: "Errore caricamento appuntamenti", description: error.message, variant: "destructive" });
    }
    setAppointments((data as DbAppointment[] | null) ?? []);
    setLoading(false);
  }, [practiceProfileId]);

  const fetchPatients = useCallback(async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .eq("practice_profile_id", practiceProfileId)
      .eq("status", "active")
      .order("last_name");

    if (error) {
      console.error("[Calendar] patients fetch error:", error);
      toast({ title: "Errore caricamento pazienti", description: error.message, variant: "destructive" });
    }
    setPatientsList(data ?? []);
  }, [practiceProfileId]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  // Helpers
  const getDateFromAppt = (a: DbAppointment) => a.starts_at.slice(0, 10);
  const getTimeFromAppt = (a: DbAppointment) => a.starts_at.slice(11, 16);
  const getEndTimeFromAppt = (a: DbAppointment) => a.ends_at.slice(11, 16);
  const getPatientNameFromAppt = (a: DbAppointment) =>
    a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "Sconosciuto";

  const selectedParsed = parseLocalDate(selectedDate);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const monthDates = useMemo(() => getMonthDates(selectedParsed.getFullYear(), selectedParsed.getMonth()), [selectedDate]);

  const appointmentsWithEvents = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach(a => {
      const d = getDateFromAppt(a);
      map.set(d, (map.get(d) || 0) + 1);
    });
    return map;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    let list: DbAppointment[];
    if (view === "day") {
      list = appointments.filter(a => getDateFromAppt(a) === selectedDate);
    } else if (view === "week") {
      const weekDateSet = new Set(weekDates.map(d => d.date));
      list = appointments.filter(a => weekDateSet.has(getDateFromAppt(a)));
    } else {
      const ym = `${selectedParsed.getFullYear()}-${String(selectedParsed.getMonth() + 1).padStart(2, "0")}`;
      list = appointments.filter(a => getDateFromAppt(a).startsWith(ym));
    }
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    return list;
  }, [appointments, selectedDate, view, statusFilter, weekDates]);

  const navigateDate = (dir: number) => {
    const d = parseLocalDate(selectedDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const dateLabel = (() => {
    const d = parseLocalDate(selectedDate);
    if (view === "day") return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    if (view === "week") {
      const monthName = d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
      return `${weekDates[0].dayNum}–${weekDates[6].dayNum} ${monthName}`;
    }
    return d.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  })();

  const handleCreateAppointment = async () => {
    if (!newPatientId) {
      toast({ title: "Seleziona un paziente", variant: "destructive" });
      return;
    }
    setCreating(true);
    const startsAt = `${newDate}T${newTime}:00`;
    const endDate = new Date(`${newDate}T${newTime}:00`);
    endDate.setMinutes(endDate.getMinutes() + 50);
    const endsAt = endDate.toISOString();

    const { data, error } = await supabase.from("appointments").insert({
      practice_profile_id: practiceProfileId,
      patient_id: newPatientId,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "scheduled",
      location_type: "in_person",
    }).select();

    console.log("[Calendar] create appointment response:", { data, error });

    if (error) {
      toast({ title: "Errore creazione appuntamento", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Appuntamento creato" });
      setDrawerOpen(false);
      setNewPatientId("");
      fetchAppointments();
    }
    setCreating(false);
  };

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Agenda"
          action={<Button size="sm" onClick={() => { setNewDate(selectedDate); setDrawerOpen(true); }}><Plus size={14} /> Nuovo</Button>}
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
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}><ChevronLeft size={16} /></Button>
          <span className="font-display font-semibold text-foreground text-sm capitalize">{dateLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}><ChevronRight size={16} /></Button>
        </div>

        {/* Week strip */}
        {(view === "day" || view === "week") && (
          <div className="flex gap-1">
            {weekDates.map((d) => (
              <button
                key={d.date}
                onClick={() => { setSelectedDate(d.date); if (view === "week") setView("day"); }}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors",
                  d.date === selectedDate ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
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
        <div className="flex flex-wrap gap-1.5 pb-1">
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
                  <span className="text-xs font-semibold text-foreground">{getTimeFromAppt(a)}</span>
                  <div className="w-px flex-1 bg-border my-1" />
                  <span className="text-xs text-muted-foreground">{getEndTimeFromAppt(a)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground truncate">{getPatientNameFromAppt(a)}</p>
                    <AppointmentStatusBadge status={(a.status as AppointmentStatus) ?? "scheduled"} />
                  </div>
                  <p className="text-xs text-muted-foreground">{a.location_type === "online" ? "Online" : "In studio"}</p>
                  {view !== "day" && <p className="text-xs text-muted-foreground mt-0.5">{getDateFromAppt(a)}</p>}
                  {a.status !== "completed" && a.status !== "cancelled" && a.status !== "no_show" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1.5 h-7 text-xs text-primary px-2"
                      onClick={() => navigate(`/appointments/${a.id}/close`)}
                    >
                      Segna come completato
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Appointment Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuovo appuntamento</DrawerTitle>
            <DrawerDescription>Compila i dettagli per creare un nuovo appuntamento</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Paziente</Label>
              <Select value={newPatientId} onValueChange={setNewPatientId}>
                <SelectTrigger><SelectValue placeholder="Seleziona paziente" /></SelectTrigger>
                <SelectContent>
                  {patientsList.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Nessun paziente attivo</div>
                  ) : (
                    patientsList.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Data</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Ora</Label>
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Tipo</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="colloquio">Colloquio individuale</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="prima_visita">Prima visita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full" onClick={handleCreateAppointment} disabled={creating}>
              {creating ? "Creazione..." : "Crea appuntamento"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Annulla</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
}
