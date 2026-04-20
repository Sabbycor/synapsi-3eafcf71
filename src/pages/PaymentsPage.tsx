import { useState, useMemo, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { PaymentStatusBadge, InvoiceStatusBadge, paymentMethodLabels } from "@/components/StatusBadge";
import type { PaymentMethod, PaymentStatus, InvoiceStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { CreditCard, Clock, CircleDollarSign, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { toast } from "sonner";

/* ── Types ─────────────────────────────────────────── */

interface RawUnbilled {
  id: string;
  patient_id: string;
  service_date: string | null;
  service_type: string | null;
  duration_minutes: number | null;
  appointment_id: string;
  practice_profile_id: string;
}

interface UnbilledRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  service_date: string | null;
  service_type: string | null;
  duration_minutes: number | null;
  appointment_id: string;
  practice_profile_id: string;
}

interface PaidPayment {
  id: string;
  patient_name: string;
  payment_date: string | null;
  amount: number | null;
  method: string | null;
  invoice_status: string | null;
}

interface UnbilledWithPatient extends RawUnbilled {
  patients: { first_name: string; last_name: string } | null;
}

interface PaymentWithPatient {
  id: string;
  patient_id: string;
  payment_date: string | null;
  amount: number | null;
  method: string | null;
  status: string | null;
  invoices: { status: string | null } | null;
  patients: { first_name: string; last_name: string } | null;
}

export default function PaymentsPage() {
  const practiceProfileId = usePracticeProfileId();

  // Data
  const [unbilled, setUnbilled] = useState<UnbilledRecord[]>([]);
  const [paid, setPaid] = useState<PaidPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [selectedRecord, setSelectedRecord] = useState<UnbilledRecord | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newMethod, setNewMethod] = useState<string>("cash");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Default price from practice profile
  const [defaultPrice, setDefaultPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!practiceProfileId) return;
    supabase
      .from("practice_profiles")
      .select("default_session_price")
      .eq("id", practiceProfileId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.default_session_price) setDefaultPrice(Number(data.default_session_price));
      });
  }, [practiceProfileId]);

  /* ── Fetch unbilled service_records ── */
  const fetchUnbilled = useCallback(async () => {
    if (!practiceProfileId) return;
    const { data, error } = await supabase
      .from("service_records")
      .select("id, patient_id, service_date, service_type, duration_minutes, appointment_id, practice_profile_id, patients(first_name, last_name)")
      .eq("practice_profile_id", practiceProfileId)
      .is("invoice_id", null)
      .order("service_date", { ascending: false });

    if (error) { console.error(error); toast.error("Errore caricamento sedute"); return; }
    setUnbilled((data || []).map((r) => {
      const row = r as UnbilledWithPatient;
      return {
        id: row.id,
        patient_id: row.patient_id,
        service_date: row.service_date,
        service_type: row.service_type,
        duration_minutes: row.duration_minutes,
        appointment_id: row.appointment_id,
        practice_profile_id: row.practice_profile_id,
        patient_name: row.patients ? `${row.patients.first_name} ${row.patients.last_name}` : "Sconosciuto",
      };
    }));
  }, [practiceProfileId]);

  /* ── Fetch paid payments ── */
  const fetchPaid = useCallback(async () => {
    if (!practiceProfileId) return;
    const { data, error } = await supabase
      .from("payments")
      .select("id, patient_id, payment_date, amount, method, status, invoices!inner(practice_profile_id, status), patients(first_name, last_name)")
      .eq("invoices.practice_profile_id", practiceProfileId)
      .eq("status", "completed")
      .order("payment_date", { ascending: false });

    if (error) { console.error(error); toast.error("Errore caricamento pagamenti"); return; }
    setPaid((data || []).map((p) => {
      const pay = p as PaymentWithPatient;
      return {
        id: pay.id,
        patient_name: pay.patients ? `${pay.patients.first_name} ${pay.patients.last_name}` : "Sconosciuto",
        payment_date: pay.payment_date,
        amount: pay.amount,
        method: pay.method,
        invoice_status: pay.invoices?.status || "draft",
      };
    }));
  }, [practiceProfileId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUnbilled(), fetchPaid()]).finally(() => setLoading(false));
  }, [fetchUnbilled, fetchPaid]);

  /* ── Handle payment creation (3-step cascade) ── */
  const handleCreate = async () => {
    if (!selectedRecord || !newAmount || !practiceProfileId) return;
    setSaving(true);

    const amount = parseFloat(newAmount);
    const now = new Date().toISOString();
    const billingMonth = newDate.slice(0, 7) + "-01"; // e.g. "2026-04-01"

    try {
      // 1. Create invoice (draft)
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          practice_profile_id: practiceProfileId,
          patient_id: selectedRecord.patient_id,
          status: "draft",
          billing_month: billingMonth,
          total_amount: amount,
          subtotal: amount,
          issue_date: newDate,
        })
        .select("id")
        .single();

      if (invErr || !invoice) throw invErr || new Error("Fattura non creata");

      // 2. Update service_record
      const { error: srErr } = await supabase
        .from("service_records")
        .update({
          invoice_id: invoice.id,
          amount,
          closed_at: now,
        })
        .eq("id", selectedRecord.id);

      if (srErr) throw srErr;

      // 3. Create payment
      const { error: payErr } = await supabase
        .from("payments")
        .insert({
          invoice_id: invoice.id,
          patient_id: selectedRecord.patient_id,
          amount,
          payment_date: newDate,
          method: newMethod,
          status: "completed",
          notes: newNotes.trim() || null,
        });

      if (payErr) throw payErr;

      // Mark invoice as paid
      await supabase.from("invoices").update({ status: "paid" }).eq("id", invoice.id);

      toast.success("Pagamento registrato");
      setSelectedRecord(null);
      resetForm();
      fetchUnbilled();
      fetchPaid();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewAmount("");
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewMethod("cash");
    setNewNotes("");
  };

  const openDrawer = (record: UnbilledRecord) => {
    setSelectedRecord(record);
    setNewAmount(defaultPrice ? String(defaultPrice) : "");
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewMethod("cash");
    setNewNotes("");
  };

  /* ── Summaries ── */
  const totalPaid = paid.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader title="Pagamenti" subtitle={`${unbilled.length} da incassare · ${paid.length} incassati`} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
              <Clock size={16} className="text-warning" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground tracking-tight">{unbilled.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Da incassare</p>
            <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-warning/5 rounded-full blur-xl" />
          </div>
          
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground tracking-tight">€{totalPaid}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Totale Incassati</p>
            <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-success/5 rounded-full blur-xl" />
          </div>

          <div className="relative overflow-hidden hidden md:block rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <CreditCard size={16} className="text-primary" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground tracking-tight">{paid.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Transazioni</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="unbilled" className="w-full">
          <TabsList className="w-full bg-secondary/20 p-1 rounded-xl h-11 border border-border/50">
            <TabsTrigger value="unbilled" className="flex-1 rounded-lg font-bold text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Da incassare ({unbilled.length})</TabsTrigger>
            <TabsTrigger value="paid" className="flex-1 rounded-lg font-bold text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Incassati ({paid.length})</TabsTrigger>
          </TabsList>

          {/* Tab 1 — Unbilled */}
          <TabsContent value="unbilled">
            {loading ? (
              <SkeletonList count={4} />
            ) : unbilled.length === 0 ? (
              <EmptyState
                icon={CircleDollarSign}
                title="Tutto incassato!"
                description="Non ci sono sedute in attesa di pagamento"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {unbilled.map(r => (
                  <button
                    key={r.id}
                    onClick={() => openDrawer(r)}
                    className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning/10 shrink-0 transition-transform group-hover:scale-105">
                      <Clock size={20} className="text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[15px] font-bold text-foreground">{r.patient_name}</p>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-warning/5 text-warning border-warning/20">
                          In attesa
                        </Badge>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {r.service_date} · {r.service_type || "Seduta"} · {r.duration_minutes || 0} min
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 2 — Paid */}
          <TabsContent value="paid">
            {loading ? (
              <SkeletonList count={4} />
            ) : paid.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Nessun pagamento"
                description="I pagamenti registrati appariranno qui"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {paid.map(p => (
                  <div key={p.id} className="relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:bg-muted/30">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success/10 shrink-0">
                      <CheckCircle2 size={20} className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[15px] font-bold text-foreground">€{p.amount}</p>
                        <InvoiceStatusBadge status={(p.invoice_status as InvoiceStatus) || "draft"} />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {p.patient_name} · {paymentMethodLabels[(p.method || "cash") as PaymentMethod] || p.method}
                      </p>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-1">{p.payment_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment drawer */}
      <Drawer open={!!selectedRecord} onOpenChange={open => { if (!open) setSelectedRecord(null); }}>
        {selectedRecord && (
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Registra pagamento</DrawerTitle>
              <DrawerDescription>
                {selectedRecord.patient_name} · {selectedRecord.service_date || "—"} · {selectedRecord.service_type || "Seduta"}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-4">
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
                <Label>Metodo *</Label>
                <Select value={newMethod} onValueChange={setNewMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Contanti</SelectItem>
                    <SelectItem value="card">Carta / POS</SelectItem>
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
              <Button className="w-full" onClick={handleCreate} disabled={saving || !newAmount}>
                {saving ? "Salvataggio..." : "Registra pagamento"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">Annulla</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>
    </PageContainer>
  );
}
