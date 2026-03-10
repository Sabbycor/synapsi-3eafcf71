import { useState, useMemo, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { PaymentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import {
  payments, invoices, dashboardStats, getPatientName,
  paymentMethodLabels, paymentStatusLabels,
  type PaymentMethod, type PaymentStatus,
} from "@/data/mock";
import { Plus, CreditCard, Search, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type MethodFilter = PaymentMethod | "all";
type StatusFilter = PaymentStatus | "all";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = [...payments];
    if (methodFilter !== "all") list = list.filter(p => p.method === methodFilter);
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => getPatientName(p.patientId).toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [search, methodFilter, statusFilter]);

  const totalReceived = payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Pagamenti"
          subtitle={`${payments.length} registrati`}
          action={<Button size="sm" onClick={() => setDrawerOpen(true)}><Plus size={14} /> Registra</Button>}
        />

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 shadow-card text-center">
            <TrendingUp size={14} className="text-success mx-auto mb-1" />
            <p className="font-display text-lg font-bold text-foreground">€{totalReceived}</p>
            <p className="text-[11px] text-muted-foreground">Incassati</p>
          </div>
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-center">
            <Clock size={14} className="text-warning mx-auto mb-1" />
            <p className="font-display text-lg font-bold text-foreground">€{totalPending}</p>
            <p className="text-[11px] text-muted-foreground">In attesa</p>
          </div>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center">
            <AlertTriangle size={14} className="text-destructive mx-auto mb-1" />
            <p className="font-display text-lg font-bold text-destructive">€{dashboardStats.totalOverdue}</p>
            <p className="text-[11px] text-muted-foreground">Scaduti</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cerca pagamento..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Filter row */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="flex gap-1.5">
            {(["all", "bank_transfer", "cash", "card"] as MethodFilter[]).map(m => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                  methodFilter === m ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {m === "all" ? "Tutti" : paymentMethodLabels[m]}
              </button>
            ))}
          </div>
          <div className="w-px bg-border shrink-0" />
          <div className="flex gap-1.5">
            {(["all", "completed", "pending", "refunded"] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                  statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {s === "all" ? "Tutti" : paymentStatusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={search ? "Nessun risultato" : "Nessun pagamento"}
            description={search ? "Prova a modificare la ricerca" : "Registra il primo pagamento ricevuto"}
            action={!search ? <Button size="sm" onClick={() => setDrawerOpen(true)}><Plus size={14} /> Registra</Button> : undefined}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                  <CreditCard size={16} className="text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">€{p.amount}</p>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{getPatientName(p.patientId)} · {paymentMethodLabels[p.method]}</p>
                  <p className="text-xs text-muted-foreground">{p.date}{p.notes ? ` · ${p.notes}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record payment drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Registra pagamento</DrawerTitle>
            <DrawerDescription>Inserisci i dettagli del pagamento ricevuto</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <div className="space-y-2">
              <Label>Fattura</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Seleziona fattura" /></SelectTrigger>
                <SelectContent>
                  {invoices.filter(i => ["sent", "issued", "overdue", "partially_paid"].includes(i.status)).map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>{inv.number} — {getPatientName(inv.patientId)} — €{inv.total - inv.paidAmount}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Importo (€)</Label>
                <Input type="number" placeholder="80" />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" defaultValue="2026-03-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Metodo</Label>
              <Select defaultValue="cash">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Contanti</SelectItem>
                  <SelectItem value="card">Carta</SelectItem>
                  <SelectItem value="bank_transfer">Bonifico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Input placeholder="Note opzionali..." />
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full">Registra pagamento</Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Annulla</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
}
