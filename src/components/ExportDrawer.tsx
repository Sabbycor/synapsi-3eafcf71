import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { exportInvoicesCsv, exportPaymentsCsv, exportTsReadyCsv, downloadCsv } from "@/lib/csvExport";
import { toast } from "sonner";

interface ExportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDrawer({ open, onOpenChange }: ExportDrawerProps) {
  const practiceProfileId = usePracticeProfileId();
  const [exporting, setExporting] = useState<string | null>(null);

  const doExport = async (type: "invoices" | "payments" | "ts") => {
    setExporting(type);
    try {
      let csv: string;
      let filename: string;
      const date = new Date().toISOString().slice(0, 10);

      if (type === "invoices") {
        csv = await exportInvoicesCsv(practiceProfileId);
        filename = `Fatture_${date}.csv`;
      } else if (type === "payments") {
        csv = await exportPaymentsCsv(practiceProfileId);
        filename = `Pagamenti_${date}.csv`;
      } else {
        csv = await exportTsReadyCsv(practiceProfileId);
        filename = `Export_TS_${date}.csv`;
      }

      downloadCsv(csv, filename);
      toast.success(`Export completato: ${filename}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Errore durante l'export";
      toast.error(errorMessage);
    } finally {
      setExporting(null);
    }
  };

  const exports = [
    {
      id: "invoices" as const,
      icon: FileText,
      title: "Fatture (Commercialista)",
      description: "Esporta tutte le fatture con dati paziente, importi e stato",
    },
    {
      id: "payments" as const,
      icon: FileSpreadsheet,
      title: "Pagamenti ricevuti",
      description: "Registro pagamenti con metodo, riferimenti e note",
    },
    {
      id: "ts" as const,
      icon: Download,
      title: "Export Sistema TS",
      description: "Fatture sanitarie con verifica C.F. e idoneità TS",
    },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Esporta dati</DrawerTitle>
          <DrawerDescription>Scarica CSV per il commercialista o il Sistema TS</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 space-y-3 pb-2">
          {exports.map(exp => (
            <button
              key={exp.id}
              onClick={() => doExport(exp.id)}
              disabled={!!exporting}
              className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                {exporting === exp.id
                  ? <Loader2 size={16} className="animate-spin text-primary" />
                  : <exp.icon size={16} className="text-secondary-foreground" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{exp.title}</p>
                <p className="text-xs text-muted-foreground">{exp.description}</p>
              </div>
            </button>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Chiudi</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
