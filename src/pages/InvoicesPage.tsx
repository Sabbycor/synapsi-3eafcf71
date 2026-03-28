import { useState, useMemo, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { InvoiceStatusBadge, invoiceStatusLabels, paymentMethodLabels } from "@/components/StatusBadge";
import type { InvoiceStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Plus, Search, FileText, ChevronRight, Trash2, Download, Send, CheckCircle2 } from "lucide-react";
import { downloadInvoicePdf } from "@/lib/generateInvoicePdf";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { toast } from "sonner";

const STATUS_FILTERS: (InvoiceStatus | "all")[] = ["all", "draft", "issued", "sent", "paid", "partially_paid", "overdue", "cancelled"];

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  patient_id: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  total_amount: number | null;
  status: string | null;
  service_record_id: string | null;
  patient_name: string;
  service_date: string | null;
}

interface PaymentRow {
  id: string;
  amount: number | null;
  payment_date: string | null;
  method: string | null;
}

export default function InvoicesPage() {
  const practiceProfileId = usePracticeProfileId();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  // Create form
  const [newPatientId, setNewPatientId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newIssueDate, setNewIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [newDueDate, setNewDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!practiceProfileId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, patient_id, issue_date, due_date, subtotal, total_amount, status, service_record_id, patients(first_name, last_name), service_records(service_date)")
      .eq("practice_profile_id", practiceProfileId)
      .order("issue_date", { ascending: false });
    if (error) { console.error(error); toast.error("Errore caricamento fatture"); }
    else {
      setInvoices((data || []).map((i: any) => ({
        ...i,
        patient_name: i.patients ? `${i.patients.first_name} ${i.patients.last_name}` : "Sconosciuto",
        service_date: i.service_records?.service_date || null,
      })));
    }
    setLoading(false);
  }, [practiceProfileId]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  useEffect(() => {
    if (!practiceProfileId) return;
    supabase.from("patients").select("id, first_name, last_name").eq("practice_profile_id", practiceProfileId)
      .then(({ data }) => setPatients((data || []).map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }))));
  }, [practiceProfileId]);

  // Practice profile data for PDF
  const [practiceData, setPracticeData] = useState<any>(null);
  useEffect(() => {
    if (!practiceProfileId) return;
    supabase.from("practice_profiles").select("professional_name, practice_name, vat_number, tax_code").eq("id", practiceProfileId).maybeSingle()
      .then(({ data }) => setPracticeData(data));
  }, [practiceProfileId]);

  // Fetch payments when invoice selected
  useEffect(() => {
    if (!selectedInvoice) { setInvoicePayments([]); return; }
    supabase.from("payments").select("id, amount, payment_date, method").eq("invoice_id", selectedInvoice.id)
      .then(({ data }) => setInvoicePayments(data || []));
  }, [selectedInvoice]);

  // Generate PDF for an invoice
  const handleGeneratePdf = async (inv: InvoiceRow) => {
    // Fetch patient details
    const { data: patient } = await supabase.from("patients").select("first_name, last_name, tax_code, address, city").eq("id", inv.patient_id).maybeSingle();
    // Fetch invoice items
    const { data: items } = await supabase.from("invoice_items").select("description, quantity, unit_amount, total_amount").eq("invoice_id", inv.id);

    downloadInvoicePdf({
      invoiceNumber: inv.invoice_number || "—",
      issueDate: inv.issue_date || "—",
      dueDate: inv.due_date,
      professionalName: practiceData?.professional_name || "Professionista",
      practiceName: practiceData?.practice_name,
      vatNumber: practiceData?.vat_number,
      taxCode: practiceData?.tax_code,
      patientName: patient ? `${patient.first_name} ${patient.last_name}` : inv.patient_name,
      patientTaxCode: patient?.tax_code,
      patientAddress: patient?.address,
      patientCity: patient?.city,
      items: (items && items.length > 0) ? items.map(it => ({
        description: it.description || "Prestazione",
        quantity: it.quantity || 1,
        unitAmount: it.unit_amount || 0,
        totalAmount: it.total_amount || 0,
      })) : [{
        description: "Seduta psicologica",
        quantity: 1,
        unitAmount: inv.total_amount || 0,
        totalAmount: inv.total_amount || 0,
      }],
      subtotal: inv.subtotal || inv.total_amount || 0,
      totalAmount: inv.total_amount || 0,
      paymentMethod: null,
    });
    toast.success("PDF generato");
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    const { error } = await supabase.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
    if (error) toast.error("Errore");
    else { toast.success("Fattura segnata come pagata"); fetchInvoices(); setSelectedInvoice(null); }
  };

  const handleMarkAsSent = async (invoiceId: string) => {
    const { error } = await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoiceId);
    if (error) toast.error("Errore");
    else { toast.success("Fattura segnata come inviata"); fetchInvoices(); setSelectedInvoice(null); }
  };

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => (i.invoice_number || "").toLowerCase().includes(q) || i.patient_name.toLowerCase().includes(q));
    }
    return list;
  }, [invoices, search, statusFilter]);

  const totals = useMemo(() => ({
    outstanding: invoices.filter(i => ["sent", "issued", "overdue", "partially_paid"].includes(i.status || "")).reduce((s, i) => s + (i.total_amount || 0), 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((s, i) => s + (i.total_amount || 0), 0),
    draft: invoices.filter(i => i.status === "draft").length,
  }), [invoices]);

  const paidAmount = invoicePayments.reduce((s, p) => s + (p.amount || 0), 0);

  const handleCreate = async () => {
    if (!newPatientId || !newAmount || !practiceProfileId) return;
    setSaving(true);
    const { data: pp } = await supabase.from("practice_profiles").select("invoice_prefix, invoice_next_number").eq("id", practiceProfileId).maybeSingle();
    const prefix = pp?.invoice_prefix || "SYN";
    const nextNum = pp?.invoice_next_number || 1;
    const invoiceNumber = `${prefix}${String(nextNum).padStart(3, "0")}`;
    const amount = parseFloat(newAmount);

    const { error } = await supabase.from("invoices").insert({
      practice_profile_id: practiceProfileId,
      patient_id: newPatientId,
      invoice_number: invoiceNumber,
      issue_date: newIssueDate,
      due_date: newDueDate || null,
      subtotal: amount,
      total_amount: amount,
      status: "draft",
    });
    if (!error) {
      await supabase.from("practice_profiles").update({ invoice_next_number: nextNum + 1 }).eq("id", practiceProfileId);
      toast.success(`Fattura ${invoiceNumber} creata`);
      setCreateDrawerOpen(false);
      setNewPatientId(""); setNewAmount(""); setNewDueDate("");
      fetchInvoices();
    } else { toast.error("Errore creazione fattura"); }
    setSaving(false);
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    const { error } = await supabase.from("invoices").update({ status: newStatus }).eq("id", invoiceId);
    if (error) toast.error("Errore aggiornamento stato");
    else { toast.success("Stato aggiornato"); fetchInvoices(); setSelectedInvoice(null); }
  };

  const handleDelete = async (invoiceId: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
    if (error) toast.error("Errore eliminazione fattura");
    else { toast.success("Fattura eliminata"); setSelectedInvoice(null); fetchInvoices(); }
  };

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Fatture"
          subtitle={`${invoices.length} totali`}
          action={<Button size="sm" onClick={() => setCreateDrawerOpen(true)}><Plus size={14} /> Nuova</Button>}
        />

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 shadow-card text-center">
            <p className="font-display text-lg font-bold text-foreground">€{totals.outstanding}</p>
            <p className="text-[11px] text-muted-foreground">In sospeso</p>
          </div>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center">
            <p className="font-display text-lg font-bold text-destructive">€{totals.overdue}</p>
            <p className="text-[11px] text-muted-foreground">Scadute</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-card text-center">
            <p className="font-display text-lg font-bold text-foreground">{totals.draft}</p>
            <p className="text-[11px] text-muted-foreground">Bozze</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cerca fattura..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Status chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn(
              "shrink-0 rounded-full px-3 py-2 text-[11px] font-medium border transition-colors min-h-[44px] flex items-center",
              statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}>
              {s === "all" ? "Tutte" : invoiceStatusLabels[s]}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={search ? "Nessun risultato" : "Nessuna fattura"}
            description={search ? "Prova a modificare la ricerca" : "Crea la tua prima fattura"}
            action={!search ? <Button size="sm" onClick={() => setCreateDrawerOpen(true)}><Plus size={14} /> Nuova fattura</Button> : undefined}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(inv => (
              <button key={inv.id} onClick={() => setSelectedInvoice(inv)} className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card text-left transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                  <FileText size={16} className="text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{inv.invoice_number || "—"}</p>
                    <InvoiceStatusBadge status={(inv.status as InvoiceStatus) || "draft"} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{inv.patient_name} · €{inv.total_amount || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.issue_date || "—"}{inv.due_date ? ` · Scad. ${inv.due_date}` : ""}
                    {inv.service_date ? ` · Seduta ${inv.service_date}` : ""}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Invoice detail drawer */}
      <Drawer open={!!selectedInvoice} onOpenChange={open => !open && setSelectedInvoice(null)}>
        {selectedInvoice && (
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Fattura {selectedInvoice.invoice_number}</DrawerTitle>
              <DrawerDescription>{selectedInvoice.patient_name}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stato</span>
                <InvoiceStatusBadge status={(selectedInvoice.status as InvoiceStatus) || "draft"} />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data emissione</span>
                  <span className="text-foreground">{selectedInvoice.issue_date || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scadenza</span>
                  <span className="text-foreground">{selectedInvoice.due_date || "—"}</span>
                </div>
                {selectedInvoice.service_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data seduta</span>
                    <span className="text-foreground">{selectedInvoice.service_date}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Importo</span>
                  <span className="font-medium text-foreground">€{selectedInvoice.total_amount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagato</span>
                  <span className="font-medium text-foreground">€{paidAmount}</span>
                </div>
                {(selectedInvoice.total_amount || 0) - paidAmount > 0 && (
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground font-medium">Residuo</span>
                    <span className="font-bold text-destructive">€{(selectedInvoice.total_amount || 0) - paidAmount}</span>
                  </div>
                )}
              </div>
              {invoicePayments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Pagamenti registrati</p>
                  {invoicePayments.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-muted-foreground">{p.payment_date || "—"}</span>
                      <span className="text-foreground">€{p.amount} · {paymentMethodLabels[(p.method || "cash") as keyof typeof paymentMethodLabels] || p.method}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Status change */}
              <div className="space-y-2">
                <Label className="text-xs">Cambia stato</Label>
                <Select value={selectedInvoice.status || "draft"} onValueChange={v => handleStatusChange(selectedInvoice.id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["draft", "issued", "sent", "paid", "partially_paid", "overdue", "cancelled"] as InvoiceStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{invoiceStatusLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DrawerFooter>
              <div className="flex flex-col gap-2 w-full">
                <Button size="sm" onClick={() => handleGeneratePdf(selectedInvoice)}>
                  <Download size={14} /> Genera PDF
                </Button>
                {selectedInvoice.status === "draft" && (
                  <Button variant="outline" size="sm" onClick={() => handleMarkAsSent(selectedInvoice.id)}>
                    <Send size={14} /> Segna come inviata
                  </Button>
                )}
                {["draft", "issued", "sent", "overdue"].includes(selectedInvoice.status || "") && (
                  <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(selectedInvoice.id)}>
                    <CheckCircle2 size={14} /> Segna come pagata
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedInvoice.id)}>
                  <Trash2 size={14} /> Elimina fattura
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm">Chiudi</Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>

      {/* Create invoice drawer */}
      <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nuova fattura</DrawerTitle>
            <DrawerDescription>Crea una nuova fattura</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <div className="space-y-2">
              <Label>Paziente *</Label>
              <Select value={newPatientId} onValueChange={setNewPatientId}>
                <SelectTrigger><SelectValue placeholder="Seleziona paziente" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Importo (€) *</Label>
                <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="80" />
              </div>
              <div className="space-y-2">
                <Label>Data emissione</Label>
                <Input type="date" value={newIssueDate} onChange={e => setNewIssueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scadenza</Label>
              <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
          </div>
          <DrawerFooter>
            <Button className="w-full" onClick={handleCreate} disabled={saving || !newPatientId || !newAmount}>
              {saving ? "Salvataggio..." : "Crea fattura"}
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
