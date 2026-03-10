import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ChevronRight } from "lucide-react";

const mockPatients = [
  { id: 1, name: "Marco Bianchi", lastVisit: "5 Mar 2026", sessions: 12 },
  { id: 2, name: "Laura Martini", lastVisit: "3 Mar 2026", sessions: 8 },
  { id: 3, name: "Giulia Russo", lastVisit: "28 Feb 2026", sessions: 22 },
  { id: 4, name: "Andrea Colombo", lastVisit: "1 Mar 2026", sessions: 5 },
  { id: 5, name: "Francesca Verdi", lastVisit: "26 Feb 2026", sessions: 15 },
];

export default function PatientsPage() {
  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Pazienti"
          subtitle={`${mockPatients.length} pazienti attivi`}
          action={<Button size="sm"><Plus size={14} /> Aggiungi</Button>}
        />

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cerca paziente..." className="pl-9" />
        </div>

        <div className="space-y-2">
          {mockPatients.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary shrink-0">
                <span className="text-sm font-semibold text-secondary-foreground">
                  {p.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.sessions} sedute · Ultima: {p.lastVisit}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
