import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { AddPatientDialog } from "@/components/AddPatientDialog";
import { Plus, Search, ChevronRight, Users, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | "inactive";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Tutti" },
  { key: "active", label: "Attivi" },
  { key: "inactive", label: "Inattivi" },
];

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  status: string | null;
  email: string | null;
  phone: string | null;
  created_at: string | null;
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const practiceProfileId = usePracticeProfileId();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("id, first_name, last_name, status, email, phone, created_at")
      .eq("practice_profile_id", practiceProfileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PatientsPage] fetch error:", error);
    }
    setPatients(data ?? []);
    setLoading(false);
  }, [practiceProfileId]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const filtered = useMemo(() => {
    let list = [...patients];
    if (filter === "active") list = list.filter(p => p.status === "active");
    if (filter === "inactive") list = list.filter(p => p.status === "inactive" || p.status === "archived");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(q));
    }
    return list;
  }, [patients, search, filter]);

  const activeCount = patients.filter(p => p.status === "active").length;

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Pazienti"
          subtitle={`${activeCount} pazienti attivi`}
          action={
            <Button size="sm" onClick={() => setDialogOpen(true)} className="shadow-md hover:shadow-lg transition-all">
              <Plus size={16} className="mr-2" /> Nuovo Paziente
            </Button>
          }
        />

        {/* Search & Filters */}
        <div className="space-y-4 bg-secondary/20 p-4 rounded-2xl border border-border/50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Cerca per nome o cognome..." 
              className="pl-9 bg-background border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 h-10" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all border",
                  filter === f.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={search ? UserX : Users}
            title={search ? "Nessun risultato" : "Nessun paziente"}
            description={search ? "Prova a modificare la ricerca" : "Aggiungi il tuo primo paziente per iniziare"}
            action={!search ? <Button size="sm" onClick={() => setDialogOpen(true)}><Plus size={14} /> Aggiungi paziente</Button> : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                  p.status === 'active' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <span className="text-sm font-bold">
                    {p.first_name[0]}{p.last_name[0]}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-0">
                    <p className="text-[15px] font-bold text-foreground truncate">{p.first_name} {p.last_name}</p>
                    {p.status === "inactive" && (
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 bg-muted/50 text-muted-foreground border-none">
                        Inattivo
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground truncate leading-tight">
                    {p.email || "Nessuna email"}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <AddPatientDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchPatients} />
    </PageContainer>
  );
}
