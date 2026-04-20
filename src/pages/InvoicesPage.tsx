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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, FileText, ChevronRight, Download, Send, Loader2, CalendarDays } from "lucide-react";
import { downloadInvoicePdf } from "@/lib/generateInvoicePdf";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  total_amount: number | null;
  status: string | null;
  billing_month: string | null;
  patient_name: string;
}

interface RawInvoice {
  id: string;
  invoice_number: string | null;
  patient_id: string;
  issue_date: string | null;
  total_amount: number | null;
  status: string | null;
  billing_month: string | null;
}

interface RawPracticeProfile {
  professional_name: string | null;
  practice_name: string | null;
  vat_number: string | null;
  tax_code: string | null;
  invoice_prefix: string | null;
  invoice_next_number: number | null;
}

interface RawUnbilled {
  id: string;
  patient_id: string;
  service_date: string | null;
  service_type: string | null;
  duration_minutes: number | null;
  appointment_id: string;
  practice_profile_id: string;
}

interface InvoiceWithPatient extends RawInvoice {
  patients: { first_name: string; last_name: string } | null;
}

export default function InvoicesPage() {
  const practiceProfileId = usePracticeProfileId();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [loading, setLoading] = useState(true);

  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  // Finalize dialog
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Practice data for PDF
  const [practiceData, setPracticeData] = useState<RawPracticeProfile | null>(null);
  useEffect(() => {
    if (!practiceProfileId) return;
    supabase.from("practice_profiles").select("professional_name, practice_name, vat_number, tax_code, invoice_prefix, invoice_next_number").eq("id", practiceProfileId).maybeSingle()
      .then(({ data }) => setPracticeData(data as RawPracticeProfile | null));
  }, [practiceProfileId]);

  const fetchInvoices = useCallback(async () => {
    if (!practiceProfileId) return;
    setLoading(true);
    const monthStart = `${selectedMonth}-01`;
    const nextMonth = new Date(`${selectedMonth}-01T00:00:00Z`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, patient_id, issue_date, total_amount, status, billing_month, patients(first_name, last_name)")
      .eq("practice_profile_id", practiceProfileId)
      .or(`billing_month.eq.${monthStart},and(billing_month.is.null,issue_date.gte.${monthStart},issue_date.lt.${monthEnd})`)
      .order("issue_date", { ascending: false });

    if (error) { console.error(error); toast.error("Errore caricamento sedute"); return; }
    else {
      setInvoices((data || []).map((i: unknown) => {
        const inv = i as InvoiceWithPatient;
        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          patient_id: inv.patient_id,
          issue_date: inv.issue_date,
          total_amount: inv.total_amount,
          status: inv.status,
          billing_month: inv.billing_month,
          patient_name: inv.patients ? `${inv.patients.first_name} ${inv.patients.last_name}` : "Sconosciuto",
        };
      }));
    }
    setLoading(false);
  }, [practiceProfileId, selectedMonth]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const drafts = useMemo(() => invoices.filter(i => i.status === "draft"), [invoices]);
  const draftsTotal = drafts.reduce((s, i) => s + (i.total_amount || 0), 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(i => (i.invoice_number || "").toLowerCase().includes(q) || i.patient_name.toLowerCase().includes(q));
  }, [invoices, search]);

  /* ── Finalize drafts ── */
  const handleFinalize = async () => {
    if (!practiceProfileId || !practiceData) return;
    setFinalizing(true);

    let nextNum = practiceData.invoice_next_number || 1;
    const prefix = practiceData.invoice_prefix || "SYN";

    for (const draft of drafts) {
      const invoiceNumber = `${prefix}-${String(nextNum).padStart(4, "0")}`;
      await supabase.from("invoices").update({
        status: "issued",
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString().slice(0, 10),
      }).eq("id", draft.id);
      nextNum++;
    }

    // Update next number on practice profile
    await supabase.from("practice_profiles").update({ invoice_next_number: nextNum }).eq("id", practiceProfileId);

    toast.success(`${drafts.length} fatture finalizzate`);
    setShowFinalizeDialog(false);
    setFinalizing(false);
    fetchInvoices();
    // Refresh practice data
    setPracticeData((prev) => prev ? { ...prev, invoice_next_number: nextNum } : prev);
  };

  const handleMarkAsSent = async (invoice: InvoiceRow) => {
    const { error } = await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice.id);
    if (error) toast.error("Errore");
    else { toast.success("Fattura segnata come inviata"); fetchInvoices(); setSelectedInvoice(null); }
  };

  const handleGeneratePdf = async (inv: InvoiceRow) => {
    const { data: patient } = await supabase.from("patients").select("first_name, last_name, tax_code, address, city").eq("id", inv.patient_id).maybeSingle();
    const { data: items } = await supabase.from("invoice_items").select("description, quantity, unit_amount, total_amount").eq("invoice_id", inv.id);

    downloadInvoicePdf({
      invoiceNumber: inv.invoice_number || "—",
      issueDate: inv.issue_date || "—",
      dueDate: null,
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
      subtotal: inv.total_amount || 0,
      totalAmount: inv.total_amount || 0,
      paymentMethod: null,
    });
    toast.success("PDF generato");
  };

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Fatture"
          subtitle={`${invoices.length} nel mese`}
          action={
            drafts.length > 0 ? (
              <Button size="sm" onClick={() => setShowFinalizeDialog(true)}>
                <CalendarDays size={14} /> Genera fatture mese
              </Button>
            ) : undefined
          }
        />

        {/* Month & Search */}
        <div className="space-y-4 bg-secondary/10 p-4 rounded-2xl border border-border/50">
           <div className="flex gap-2">
            <div className="flex-1">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-background border-none shadow-none font-bold text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthOptions.map(m => (
                    <SelectItem key={m.value} value={m.value} className="text-xs font-medium">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-[2]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Cerca fattura o paziente..." 
                className="pl-9 bg-background border-none shadow-none text-xs h-9" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Drafts Alert */}
        {drafts.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary">{drafts.length} fatture in bozza</p>
              <p className="text-xs text-primary/70">Totale stimato: €{draftsTotal}</p>
            </div>
            <Button size="sm" onClick={() => setShowFinalizeDialog(true)} className="shadow-sm">
              <CalendarDays size={14} className="mr-2" /> Finalizza mese
            </Button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={search ? "Nessun risultato" : "Nessuna fattura"}
            description={search ? "Prova a modificare la ricerca" : "Le fatture appariranno qui quando registri pagamenti"}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(inv => (
              <button 
                key={inv.id} 
                onClick={() => setSelectedInvoice(inv)} 
                className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                  inv.status === 'paid' ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                )}>
                  <FileText size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[15px] font-bold text-foreground truncate">{inv.patient_name}</p>
                    <InvoiceStatusBadge status={(inv.status as InvoiceStatus) || "draft"} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">€{inv.total_amount || 0}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {inv.invoice_number || "Bozza"} · {formatBillingMonth(inv.billing_month)}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight size={16} className="text-muted-foreground" />
                </div>
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
              <DrawerTitle>Fattura {selectedInvoice.invoice_number || "Bozza"}</DrawerTitle>
              <DrawerDescription>{selectedInvoice.patient_name} · {formatBillingMonth(selectedInvoice.billing_month)}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-3 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stato</span>
                <InvoiceStatusBadge status={(selectedInvoice.status as InvoiceStatus) || "draft"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Importo</span>
                <span className="text-sm font-medium text-foreground">€{selectedInvoice.total_amount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data emissione</span>
                <span className="text-sm text-foreground">{selectedInvoice.issue_date || "—"}</span>
              </div>
            </div>
            <DrawerFooter>
              <div className="flex flex-col gap-2 w-full">
                <Button size="sm" onClick={() => handleGeneratePdf(selectedInvoice)}>
                  <Download size={14} /> Genera PDF
                </Button>
                {(selectedInvoice.status === "draft" || selectedInvoice.status === "issued") && (
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

      {/* Finalize dialog */}
      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizzare fatture?</DialogTitle>
            <DialogDescription>
              {drafts.length} fatture in bozza per €{draftsTotal} — Verranno numerate e marcate come emesse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinalizeDialog(false)}>Annulla</Button>
            <Button onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? <><Loader2 size={14} className="animate-spin" /> Finalizzando...</> : "Finalizza"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
