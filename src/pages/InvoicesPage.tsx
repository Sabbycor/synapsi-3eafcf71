import { useState, useMemo, useEffect, useCallback } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { InvoiceStatusBadge, invoiceStatusLabels } from "@/components/StatusBadge";
import type { InvoiceStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Search, FileText, ChevronRight, Download, Send, Loader2, CalendarDays } from "lucide-react";
import { downloadInvoicePdf } from "@/lib/generateInvoicePdf";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { toast } from "sonner";
import { capturePostHog } from "@/lib/posthogAnalytics";

const STATUS_FILTERS: (InvoiceStatus | "all")[] = ["all", "draft", "issued", "sent", "paid", "partially_paid", "overdue", "cancelled"];

const MONTH_LABELS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value, label });
  }
  return options;
}

function formatBillingMonth(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  patient_id: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  total_amount: number | null;
  status: string | null;
  billing_month: string | null;
  patient_name: string;
  service_count: number;
}

interface ServiceRecordRow {
  id: string;
  service_date: string | null;
  service_type: string | null;
  amount: number | null;
  duration_minutes: number | null;
}

export default function InvoicesPage() {
  const practiceProfileId = usePracticeProfileId();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [linkedRecords, setLinkedRecords] = useState<ServiceRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const monthOptions = useMemo(() => getMonthOptions(), []);
  const currentMonth = monthOptions[0].value;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Practice profile data for PDF
  const [practiceData, setPracticeData] = useState<any>(null);
  useEffect(() => {
    if (!practiceProfileId) return;
    supabase.from("practice_profiles").select("professional_name, practice_name, vat_number, tax_code").eq("id", practiceProfileId).maybeSingle()
      .then(({ data }) => setPracticeData(data));
  }, [practiceProfileId]);

  const fetchInvoices = useCallback(async () => {
    if (!practiceProfileId) return;
    setLoading(true);

    const monthStart = `${selectedMonth}-01`;
    const nextMonth = new Date(`${selectedMonth}-01T00:00:00Z`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    // Fetch invoices for the selected month (by billing_month or issue_date fallback)
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, patient_id, issue_date, due_date, subtotal, total_amount, status, billing_month, patients(first_name, last_name)")
      .eq("practice_profile_id", practiceProfileId)
      .or(`billing_month.eq.${monthStart},and(billing_month.is.null,issue_date.gte.${monthStart},issue_date.lt.${monthEnd})`)
      .order("issue_date", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Errore caricamento fatture");
    } else {
      // Count linked service_records per invoice
      const invoiceIds = (data || []).map((i: any) => i.id);
      let countMap: Record<string, number> = {};
      if (invoiceIds.length > 0) {
        const { data: counts } = await supabase
          .from("service_records")
          .select("invoice_id")
          .in("invoice_id", invoiceIds);
        if (counts) {
          for (const c of counts) {
            if (c.invoice_id) countMap[c.invoice_id] = (countMap[c.invoice_id] || 0) + 1;
          }
        }
      }

      setInvoices((data || []).map((i: any) => ({
        id: i.id,
        invoice_number: i.invoice_number,
        patient_id: i.patient_id,
        issue_date: i.issue_date,
        due_date: i.due_date,
        subtotal: i.subtotal,
        total_amount: i.total_amount,
        status: i.status,
        billing_month: i.billing_month,
        patient_name: i.patients ? `${i.patients.first_name} ${i.patients.last_name}` : "Sconosciuto",
        service_count: countMap[i.id] || 0,
      })));
    }
    setLoading(false);
  }, [practiceProfileId, selectedMonth]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Fetch linked service_records when invoice selected
  useEffect(() => {
    if (!selectedInvoice) { setLinkedRecords([]); return; }
    supabase
      .from("service_records")
      .select("id, service_date, service_type, amount, duration_minutes")
      .eq("invoice_id", selectedInvoice.id)
      .order("service_date", { ascending: true })
      .then(({ data }) => setLinkedRecords(data || []));
  }, [selectedInvoice]);

  const handleGenerateMonthly = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-monthly-invoices", {
        body: { target_month: selectedMonth },
      });
      if (error) throw error;
      const result = data as { created: number; updated: number; errors: string[] };
      capturePostHog(
        "invoice_generated",
        {
          billing_month: selectedMonth,
          invoices_count: (Number(result?.created) || 0) + (Number(result?.updated) || 0),
        },
        { send_instantly: true }
      );
      if (result.errors && result.errors.length > 0) {
        toast.error(`Errori: ${result.errors.join(", ")}`);
      }
      toast.success(`Fatture generate: ${result.created} nuove, ${result.updated} aggiornate`);
      fetchInvoices();
    } catch (err: any) {
      console.error(err);
      toast.error("Errore generazione fatture");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsSent = async (invoice: InvoiceRow) => {
    const { error } = await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice.id);
    if (error) toast.error("Errore");
    else {
      capturePostHog(
        "invoice_sent",
        {
          billing_month: invoice.billing_month,
          total_amount: invoice.total_amount,
        },
        { send_instantly: true }
      );
      toast.success("Fattura segnata come inviata");
      fetchInvoices();
      setSelectedInvoice(null);
    }
  };

  const handleGeneratePdf = async (inv: InvoiceRow) => {
    const { data: patient } = await supabase.from("patients").select("first_name, last_name, tax_code, address, city").eq("id", inv.patient_id).maybeSingle();
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
    draft: invoices.filter(i => i.status === "draft").length,
    total: invoices.reduce((s, i) => s + (i.total_amount || 0), 0),
  }), [invoices]);

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Fatture"
          subtitle={`${invoices.length} nel mese`}
          action={
            <Button size="sm" onClick={handleGenerateMonthly} disabled={generating}>
              {generating ? <><Loader2 size={14} className="animate-spin" /> Generazione…</> : <><CalendarDays size={14} /> Genera fatture mese</>}
            </Button>
          }
        />

        {/* Month selector */}
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-3 shadow-card text-center">
            <p className="font-display text-lg font-bold text-foreground">€{totals.total}</p>
            <p className="text-[11px] text-muted-foreground">Totale</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-card text-center">
            <p className="font-display text-lg font-bold text-foreground">€{totals.outstanding}</p>
            <p className="text-[11px] text-muted-foreground">In sospeso</p>
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
            description={search ? "Prova a modificare la ricerca" : "Genera le fatture del mese con il pulsante in alto"}
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
                  <p className="text-xs text-muted-foreground truncate">
                    {inv.patient_name} · €{inv.total_amount || 0} · {inv.service_count} {inv.service_count === 1 ? "seduta" : "sedute"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBillingMonth(inv.billing_month)}
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
              <DrawerDescription>{selectedInvoice.patient_name} · {formatBillingMonth(selectedInvoice.billing_month)}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-4 pb-2 max-h-[60vh] overflow-y-auto">
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
                  <span className="text-muted-foreground">Mese</span>
                  <span className="text-foreground">{formatBillingMonth(selectedInvoice.billing_month)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Importo totale</span>
                  <span className="font-medium text-foreground">€{selectedInvoice.total_amount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sedute incluse</span>
                  <span className="text-foreground">{linkedRecords.length}</span>
                </div>
              </div>

              {/* Linked service records */}
              {linkedRecords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Servizi inclusi</p>
                  <div className="space-y-1.5">
                    {linkedRecords.map(sr => (
                      <div key={sr.id} className="flex items-center justify-between text-sm rounded-lg bg-card border border-border p-3">
                        <div>
                          <p className="text-foreground font-medium">{sr.service_type || "Seduta"}</p>
                          <p className="text-xs text-muted-foreground">{sr.service_date || "—"} · {sr.duration_minutes || 0} min</p>
                        </div>
                        <span className="font-medium text-foreground">€{sr.amount || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DrawerFooter>
              <div className="flex flex-col gap-2 w-full">
                <Button size="sm" onClick={() => handleGeneratePdf(selectedInvoice)}>
                  <Download size={14} /> Genera PDF
                </Button>
                {selectedInvoice.status === "draft" && (
                  <Button variant="outline" size="sm" onClick={() => handleMarkAsSent(selectedInvoice)}>
                    <Send size={14} /> Segna come inviata
                  </Button>
                )}
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm">Chiudi</Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>
    </PageContainer>
  );
}
