import { useState, useMemo, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { InvoiceStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { invoices, getPatientName, invoiceStatusLabels, getPaymentsForInvoice, type InvoiceStatus, type Invoice } from "@/data/mock";
import { Plus, Search, FileText, Download, ChevronRight, Send, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: (InvoiceStatus | "all")[] = ["all", "draft", "issued", "sent", "paid", "partially_paid", "overdue", "cancelled"];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.number.toLowerCase().includes(q) || getPatientName(i.patientId).toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [search, statusFilter]);

  const totals = useMemo(() => ({
    outstanding: invoices.filter(i => ["sent", "issued", "overdue", "partially_paid"].includes(i.status)).reduce((s, i) => s + i.total - i.paidAmount, 0),
    overdue: invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total - i.paidAmount, 0),
    draft: invoices.filter(i => i.status === "draft").length,
  }), []);

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <SectionHeader
          title="Fatture"
          subtitle={`${invoices.length} totali`}
          action={<Button size="sm"><Plus size={14} /> Nuova</Button>}
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
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
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
            action={!search ? <Button size="sm"><Plus size={14} /> Nuova fattura</Button> : undefined}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map(inv => (
              <button
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                  <FileText size={16} className="text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{inv.number}</p>
                    <InvoiceStatusBadge status={inv.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{getPatientName(inv.patientId)} · €{inv.total}</p>
                  <p className="text-xs text-muted-foreground">{inv.date} · Scad. {inv.dueDate}</p>
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
              <DrawerTitle>Fattura {selectedInvoice.number}</DrawerTitle>
              <DrawerDescription>{getPatientName(selectedInvoice.patientId)}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stato</span>
                <InvoiceStatusBadge status={selectedInvoice.status} />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data emissione</span>
                  <span className="text-foreground">{selectedInvoice.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scadenza</span>
                  <span className="text-foreground">{selectedInvoice.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Importo</span>
                  <span className="font-medium text-foreground">€{selectedInvoice.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagato</span>
                  <span className="font-medium text-foreground">€{selectedInvoice.paidAmount}</span>
                </div>
                {selectedInvoice.total - selectedInvoice.paidAmount > 0 && (
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground font-medium">Residuo</span>
                    <span className="font-bold text-destructive">€{selectedInvoice.total - selectedInvoice.paidAmount}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrizione</p>
                <p className="text-sm text-foreground">{selectedInvoice.description}</p>
              </div>
              {/* Payments */}
              {(() => {
                const invPayments = getPaymentsForInvoice(selectedInvoice.id);
                if (invPayments.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Pagamenti registrati</p>
                    {invPayments.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm py-1">
                        <span className="text-muted-foreground">{p.date}</span>
                        <span className="text-foreground">€{p.amount} · {p.method === "bank_transfer" ? "Bonifico" : p.method === "cash" ? "Contanti" : "Carta"}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <DrawerFooter>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Download size={14} /> Scarica PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Send size={14} /> Invia
                </Button>
              </div>
              {selectedInvoice.total - selectedInvoice.paidAmount > 0 && (
                <Button size="sm">
                  <CreditCard size={14} /> Registra pagamento
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="sm">Chiudi</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>
    </PageContainer>
  );
}
