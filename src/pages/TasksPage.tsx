import { useState, useMemo, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { PriorityBadge, TaskStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { tasks, getPatientName, taskCategoryLabels, type TaskPriority, type TaskStatus as TStatus } from "@/data/mock";
import { ListTodo, Check, Circle, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type PriorityFilter = TaskPriority | "all";
type StatusFilter = TStatus | "all";
type CategoryFilter = string | "all";

export default function TasksPage() {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (priorityFilter !== "all") list = list.filter(t => t.priority === priorityFilter);
    if (statusFilter !== "all") list = list.filter(t => t.status === statusFilter);
    if (categoryFilter !== "all") list = list.filter(t => t.category === categoryFilter);
    // Sort: incomplete first, then by priority, then by date
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return list.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [priorityFilter, statusFilter, categoryFilter]);

  const openCount = tasks.filter(t => !t.completed).length;
  const highCount = tasks.filter(t => !t.completed && t.priority === "high").length;

  const statusIcon = (status: TStatus) => {
    if (status === "done") return <Check size={14} className="text-success" />;
    if (status === "in_progress") return <Clock size={14} className="text-primary" />;
    return <Circle size={14} className="text-muted-foreground" />;
  };

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Attività"
          subtitle={`${openCount} da completare · ${highCount} priorità alta`}
          action={<Button size="sm"><Plus size={14} /> Nuova</Button>}
        />

        {/* Filter chips - Priority */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Priorità</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(["all", "high", "medium", "low"] as PriorityFilter[]).map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                  priorityFilter === p ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
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
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                  statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
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
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                  categoryFilter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
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
            action={<Button size="sm"><Plus size={14} /> Nuova attività</Button>}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(t => (
              <div
                key={t.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card transition-colors",
                  t.completed ? "border-border opacity-60" : "border-border"
                )}
              >
                <button className="mt-0.5 shrink-0">
                  {statusIcon(t.status)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-foreground", t.completed && "line-through text-muted-foreground")}>
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <PriorityBadge priority={t.priority} />
                    <TaskStatusBadge status={t.status} />
                    <span className="text-[11px] text-muted-foreground">Scad. {t.dueDate.slice(5)}</span>
                    {t.patientId && (
                      <span className="text-[11px] text-accent">{getPatientName(t.patientId)}</span>
                    )}
                  </div>
                </div>
                {!t.completed && (
                  <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs text-accent">
                    Completa
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
