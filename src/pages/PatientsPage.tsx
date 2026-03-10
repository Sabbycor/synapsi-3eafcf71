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
          subtitle={`${activeCount} attivi`}
          action={<Button size="sm" onClick={() => setDialogOpen(true)}><Plus size={14} /> Aggiungi</Button>}
        />

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cerca paziente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
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
          <div className="space-y-2">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary shrink-0">
                  <span className="text-sm font-semibold text-secondary-foreground">
                    {p.first_name[0]}{p.last_name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{p.first_name} {p.last_name}</p>
                    {p.status === "inactive" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Inattivo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.email ?? p.phone ?? "—"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <AddPatientDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchPatients} />
    </PageContainer>
  );
}
