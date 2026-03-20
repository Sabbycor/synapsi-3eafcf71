import { useState, useMemo, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { PaymentStatusBadge, paymentMethodLabels, paymentStatusLabels } from "@/components/StatusBadge";
import type { PaymentMethod, PaymentStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Plus, CreditCard, Search, TrendingUp, AlertTriangle, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfile } from "@/hooks/usePracticeProfile";
import { toast } from "sonner";

type MethodFilter = PaymentMethod | "all";
type StatusFilter = PaymentStatus | "all";

interface PaymentRow {
  id: string;
  invoice_id: string;
  patient_id: string;
  payment_date: string | null;
  amount: number | null;
  method: string | null;
  status: string | null;
  notes: string | null;
  patient_name: string;
  invoice_number: string;
}

interface InvoiceOption {
  id: string;
  invoice_number: string | null;
  patient_id: string;
  patient_name: string;
  total_amount: number | null;
}

export default function PaymentsPage() {
  const { practiceProfileId } = usePracticeProfile();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceOption[]>([]);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form
  const [newInvoiceId, setNewInvoiceId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newMethod, setNewMethod] = useState<PaymentMethod>("cash");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!practiceProfileId) return;
    setLoading(true);
    // Payments linked via invoices to this practice
    const { data, error } = await supabase
      .from("payments")
      .select("id, invoice_id, patient_id, payment_date, amount, method, status, notes, patients(first_name, last_name), invoices!inner(practice_profile_id, invoice_number)")
      .eq("invoices.practice_profile_id", practiceProfileId)
      .order("payment_date", { ascending: false });
    if (error) { console.error(error); toast.error("Errore caricamento pagamenti"); }
    else {
      setPayments((data || []).map((p: any) => ({
        ...p,
        patient_name: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : "Sconosciuto",
        invoice_number: p.invoices?.invoice_number || "—",
      })));
    }
    setLoading(false);
  }, [practiceProfileId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Fetch invoices for the create form
  useEffect(() => {
    if (!practiceProfileId) return;
    supabase.from("invoices")
      .select("id, invoice_number, patient_id, total_amount, patients(first_name, last_name)")
      .eq("practice_profile_id", practiceProfileId)
      .in("status", ["draft", "issued", "sent", "overdue", "partially_paid"])
      .then(({ data }) => {
        setInvoiceOptions((data || []).map((i: any) => ({
          ...i,
          patient_name: i.patients ? `${i.patients.first_name} ${i.patients.last_name}` : "Sconosciuto",
        })));
      });
  }, [practiceProfileId]);

  const filtered = useMemo(() => {
    let list = [...payments];
    if (methodFilter !== "all") list = list.filter(p => p.method === methodFilter);
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.patient_name.toLowerCase().includes(q));
    }
    return list;
  }, [payments, search, methodFilter, statusFilter]);

  const totalReceived = payments.filter(p => p.status === "completed").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + (p.amount || 0), 0);

  const handleCreate = async () => {
    if (!newInvoiceId || !newAmount || !practiceProfileId) return;
    const inv = invoiceOptions.find(i => i.id === newInvoiceId);
    if (!inv) return;
    setSaving(true);
    const { error } = await supabase.from("payments").insert({
      invoice_id: newInvoiceId,
      patient_id: inv.patient_id,
      amount: parseFloat(newAmount),
      payment_date: newDate,
      method: newMethod,
      status: "completed",
      notes: newNotes.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error("Errore registrazione pagamento"); console.error(error); }
    else {
      toast.success("Pagamento registrato");
      setDrawerOpen(false);
      setNewInvoiceId(""); setNewAmount(""); setNewNotes("");
      fetchPayments();
    }
  };

  const handleDelete = async (paymentId: string) => {
    const { error } = await supabase.from("payments").delete().eq("id", paymentId);
    if (error) toast.error("Errore eliminazione");
    else { toast.success("Pagamento eliminato"); fetchPayments(); }
  };

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
            <p className="font-display text-lg font-bold text-destructive">{payments.length}</p>
            <p className="text-[11px] text-muted-foreground">Totale</p>
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
              <button key={m} onClick={() => setMethodFilter(m)} className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                methodFilter === m ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}>
                {m === "all" ? "Tutti" : paymentMethodLabels[m]}
              </button>
            ))}
          </div>
          <div className="w-px bg-border shrink-0" />
          <div className="flex gap-1.5">
            {(["all", "completed", "pending", "refunded"] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}>
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
                    <PaymentStatusBadge status={(p.status as PaymentStatus) || "pending"} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{p.patient_name} · {paymentMethodLabels[(p.method || "cash") as PaymentMethod] || p.method}</p>
                  <p className="text-xs text-muted-foreground">{p.payment_date || "—"} · Fatt. {p.invoice_number}{p.notes ? ` · ${p.notes}` : ""}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 size={14} />
                </Button>
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
              <Label>Fattura *</Label>
              <Select value={newInvoiceId} onValueChange={setNewInvoiceId}>
                <SelectTrigger><SelectValue placeholder="Seleziona fattura" /></SelectTrigger>
                <SelectContent>
                  {invoiceOptions.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>{inv.invoice_number} — {inv.patient_name} — €{inv.total_amount}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Importo (€) *</Label>
                <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="80" />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Metodo</Label>
              <Select value={newMethod} onValueChange={v => setNewMethod(v as PaymentMethod)}>
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
              <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Note opzionali..." />
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full" onClick={handleCreate} disabled={saving || !newInvoiceId || !newAmount}>
              {saving ? "Salvataggio..." : "Registra pagamento"}
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
