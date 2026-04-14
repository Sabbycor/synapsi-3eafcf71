import { useState, useMemo, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { PriorityBadge, TaskStatusBadge } from "@/components/StatusBadge";
import { taskCategoryLabels, taskStatusLabels } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { ListTodo, Check, Circle, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { toast } from "sonner";

type TaskPriority = "high" | "medium" | "low";
type TaskStatusType = "todo" | "in_progress" | "done";
type PriorityFilter = TaskPriority | "all";
type StatusFilter = TaskStatusType | "all";
type CategoryFilter = string | "all";

interface TaskRow {
  id: string;
  title: string | null;
  description: string | null;
  patient_id: string | null;
  due_at: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  completed_at: string | null;
  patient_name?: string;
}

interface TaskWithPatient extends TaskRow {
  patients: { first_name: string; last_name: string } | null;
}

export default function TasksPage() {
  const practiceProfileId = usePracticeProfileId();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New task form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newCategory, setNewCategory] = useState("admin");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPatientId, setNewPatientId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!practiceProfileId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, description, patient_id, due_at, status, priority, category, completed_at, patients(first_name, last_name)")
      .eq("practice_profile_id", practiceProfileId)
      .order("due_at", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Errore nel caricamento delle attività");
    } else {
      setTasks((data || []).map((t: unknown) => {
        const task = t as TaskWithPatient;
        return {
          ...task,
          patient_name: task.patients ? `${task.patients.first_name} ${task.patients.last_name}` : undefined,
        } as TaskRow;
      }));
    }
    setLoading(false);
  }, [practiceProfileId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!practiceProfileId) return;
    supabase.from("patients").select("id, first_name, last_name").eq("practice_profile_id", practiceProfileId)
      .then(({ data }) => setPatients((data || []).map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }))));
  }, [practiceProfileId]);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (priorityFilter !== "all") list = list.filter(t => t.priority === priorityFilter);
    if (statusFilter !== "all") list = list.filter(t => t.status === statusFilter);
    if (categoryFilter !== "all") list = list.filter(t => t.category === categoryFilter);
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return list.sort((a, b) => {
      const aComplete = !!a.completed_at;
      const bComplete = !!b.completed_at;
      if (aComplete !== bComplete) return aComplete ? 1 : -1;
      if (a.priority !== b.priority) return (priorityOrder[a.priority || "medium"] || 1) - (priorityOrder[b.priority || "medium"] || 1);
      return (a.due_at || "").localeCompare(b.due_at || "");
    });
  }, [tasks, priorityFilter, statusFilter, categoryFilter]);

  const openCount = tasks.filter(t => !t.completed_at).length;
  const highCount = tasks.filter(t => !t.completed_at && t.priority === "high").length;

  const statusIcon = (status: string | null) => {
    if (status === "done") return <Check size={14} className="text-success" />;
    if (status === "in_progress") return <Clock size={14} className="text-primary" />;
    return <Circle size={14} className="text-muted-foreground" />;
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !practiceProfileId) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      practice_profile_id: practiceProfileId,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      priority: newPriority,
      category: newCategory,
      status: "todo",
      due_at: newDueDate ? new Date(newDueDate).toISOString() : null,
      patient_id: newPatientId || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Errore nella creazione dell'attività");
    } else {
      toast.success("Attività creata");
      setDrawerOpen(false);
      setNewTitle(""); setNewDesc(""); setNewPriority("medium"); setNewCategory("admin"); setNewDueDate(""); setNewPatientId("");
      fetchTasks();
    }
  };

  const handleComplete = async (taskId: string) => {
    const { error } = await supabase.from("tasks").update({
      status: "done",
      completed_at: new Date().toISOString(),
    }).eq("id", taskId);
    if (error) toast.error("Errore"); else { toast.success("Attività completata"); fetchTasks(); }
  };

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Attività"
          subtitle={`${openCount} da completare · ${highCount} priorità alta`}
          action={<Button size="sm" onClick={() => setDrawerOpen(true)}><Plus size={14} /> Nuova</Button>}
        />

        {/* Filter chips - Priority */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Priorità</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(["all", "high", "medium", "low"] as PriorityFilter[]).map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)} className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                priorityFilter === p ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}>
                {p === "all" ? "Tutte" : p === "high" ? "Alta" : p === "medium" ? "Media" : "Bassa"}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips - Status */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Stato</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(["all", "todo", "in_progress", "done"] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}>
                {s === "all" ? "Tutti" : s === "todo" ? "Da fare" : s === "in_progress" ? "In corso" : "Completati"}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips - Category */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Categoria</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(["all", "patient", "billing", "admin", "setup"] as CategoryFilter[]).map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                categoryFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}>
                {c === "all" ? "Tutte" : taskCategoryLabels[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {loading ? (
          <SkeletonList count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="Nessuna attività"
            description="Non ci sono attività per i filtri selezionati"
            action={<Button size="sm" onClick={() => setDrawerOpen(true)}><Plus size={14} /> Nuova attività</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <div key={t.id} className={cn(
                "flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card transition-colors",
                t.completed_at ? "border-border opacity-60" : "border-border"
              )}>
                <button className="mt-0.5 shrink-0">{statusIcon(t.status)}</button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-foreground", t.completed_at && "line-through text-muted-foreground")}>
                    {t.title || "Senza titolo"}
                  </p>
                  {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <PriorityBadge priority={(t.priority as TaskPriority) || "medium"} />
                    <TaskStatusBadge status={(t.status as TaskStatusType) || "todo"} />
                    {t.due_at && <span className="text-[11px] text-muted-foreground">Scad. {new Date(t.due_at).toLocaleDateString("it-IT", { month: "2-digit", day: "2-digit" })}</span>}
                    {t.patient_name && <span className="text-[11px] text-accent">{t.patient_name}</span>}
                  </div>
                </div>
                {!t.completed_at && (
                  <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs text-accent" onClick={() => handleComplete(t.id)}>
                    Completa
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New task drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuova attività</DrawerTitle>
            <DrawerDescription>Crea una nuova attività da completare</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <div className="space-y-2">
              <Label>Titolo *</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Es. Inviare fattura a Marco" />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Dettagli opzionali..." maxLength={300} className="resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priorità</Label>
                <Select value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Bassa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newCategory} onValueChange={v => setNewCategory(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Paziente</SelectItem>
                    <SelectItem value="billing">Fatturazione</SelectItem>
                    <SelectItem value="admin">Amministrazione</SelectItem>
                    <SelectItem value="setup">Configurazione</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Scadenza</Label>
                <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Paziente</Label>
                <Select value={newPatientId} onValueChange={v => setNewPatientId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Nessuno" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuno</SelectItem>
                    {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full" onClick={handleCreate} disabled={saving || !newTitle.trim()}>
              {saving ? "Salvataggio..." : "Crea attività"}
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
