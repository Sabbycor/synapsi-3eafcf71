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
import { ListTodo, Check, Circle, Clock, Plus, AlertTriangle, CheckCircle2, TrendingUp, Calendar as CalendarIcon, Tag, User, Filter } from "lucide-react";
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
    <PageContainer>      <div className="space-y-8 animate-fade-in pb-10">
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Attività"
            subtitle="Gestisci i tuoi impegni e le scadenze cliniche"
          />
          <Button 
            onClick={() => setDrawerOpen(true)} 
            className="shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuovo Task
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <ListTodo size={18} className="text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">{openCount}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Da fare</span>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center mb-2">
              <AlertTriangle size={18} className="text-destructive" />
            </div>
            <span className="text-2xl font-bold text-foreground">{highCount}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Priorità Alta</span>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-2">
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <span className="text-2xl font-bold text-foreground">{tasks.length - openCount}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Completate</span>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
              <TrendingUp size={18} className="text-accent" />
            </div>
            <span className="text-2xl font-bold text-foreground">{Math.round(((tasks.length - openCount) / (tasks.length || 1)) * 100)}%</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Efficienza</span>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={14} className="text-muted-foreground" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Filtri Rapidi</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter Group - Priority */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Priorità</p>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "high", "medium", "low"] as PriorityFilter[]).map(p => (
                  <button key={p} onClick={() => setPriorityFilter(p)} className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all",
                    priorityFilter === p ? "bg-foreground text-background border-foreground shadow-md" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  )}>
                    {p === "all" ? "Tutte" : p === "high" ? "Alta" : p === "medium" ? "Media" : "Bassa"}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Group - Status */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Stato</p>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "todo", "in_progress", "done"] as StatusFilter[]).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all",
                    statusFilter === s ? "bg-foreground text-background border-foreground shadow-md" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  )}>
                    {s === "all" ? "Tutti" : s === "todo" ? "Da fare" : s === "in_progress" ? "In corso" : "Completati"}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Group - Category */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Categoria</p>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "patient", "billing", "admin", "setup"] as CategoryFilter[]).map(c => (
                  <button key={c} onClick={() => setCategoryFilter(c)} className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all",
                    categoryFilter === c ? "bg-foreground text-background border-foreground shadow-md" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                  )}>
                    {c === "all" ? "Tutte" : taskCategoryLabels[c]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
              <ListTodo size={16} /> 
              Elenco Attività 
              <span className="bg-secondary px-2 py-0.5 rounded-full text-[10px] text-secondary-foreground">{filtered.length}</span>
            </h3>
          </div>

          {loading ? (
            <SkeletonList count={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="Tutto sotto controllo"
              description="Non ci sono attività che corrispondono ai filtri selezionati"
              action={<Button variant="outline" size="sm" onClick={() => { setPriorityFilter("all"); setStatusFilter("all"); setCategoryFilter("all"); }}>Ripristina filtri</Button>}
            />
          ) : (
            <div className="grid gap-3">
              {filtered.map(t => (
                <div key={t.id} className={cn(
                  "group relative overflow-hidden flex items-start gap-4 rounded-2xl border p-4 transition-all hover:shadow-md",
                  t.completed_at 
                    ? "bg-muted/30 border-border/50 opacity-60" 
                    : "bg-card border-border hover:border-primary/30"
                )}>
                  {/* Priority border strip */}
                  {!t.completed_at && (
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      t.priority === "high" ? "bg-destructive" : t.priority === "medium" ? "bg-primary" : "bg-muted"
                    )} />
                  )}

                  <button 
                    onClick={() => !t.completed_at && handleComplete(t.id)}
                    className={cn(
                      "mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      t.completed_at 
                        ? "bg-success border-success text-white" 
                        : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5 active:scale-90"
                    )}
                  >
                    {t.completed_at ? <Check size={14} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-primary/20" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={cn(
                          "text-[15px] font-bold text-foreground leading-tight tracking-tight", 
                          t.completed_at && "line-through text-muted-foreground font-medium"
                        )}>
                          {t.title || "Senza titolo"}
                        </p>
                        {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{t.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <div className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">
                        <Tag size={10} />
                        {taskCategoryLabels[t.category || "admin"]}
                      </div>
                      
                      {t.due_at && (
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          new Date(t.due_at) < new Date() && !t.completed_at ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                        )}>
                          <CalendarIcon size={10} />
                          {new Date(t.due_at).toLocaleDateString("it-IT", { month: "short", day: "2-digit" })}
                        </div>
                      )}

                      {t.patient_name && (
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md text-[10px] font-bold text-primary uppercase tracking-wider">
                          <User size={10} />
                          {t.patient_name}
                        </div>
                      )}
                      
                      <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <PriorityBadge priority={(t.priority as TaskPriority) || "medium"} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New task drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuovo Task</DrawerTitle>
            <DrawerDescription>Crea un nuovo task da completare</DrawerDescription>
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
              {saving ? "Salvataggio..." : "Crea Task"}
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
