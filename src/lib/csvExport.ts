import { supabase } from "@/integrations/supabase/client";
import { auditExportPerformed } from "@/lib/auditLog";

export async function exportInvoicesCsv(practiceProfileId: string): Promise<string> {
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number, issue_date, due_date, total_amount, subtotal, status, patients(first_name, last_name, tax_code)")
    .eq("practice_profile_id", practiceProfileId)
    .order("issue_date", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Nessuna fattura da esportare");

  const rows = (data as any[]).map(inv => ({
    "Numero Fattura": inv.invoice_number || "",
    "Data Emissione": inv.issue_date || "",
    "Scadenza": inv.due_date || "",
    "Paziente": inv.patients ? `${inv.patients.first_name} ${inv.patients.last_name}` : "",
    "Codice Fiscale": inv.patients?.tax_code || "",
    "Subtotale": inv.subtotal ?? "",
    "Totale": inv.total_amount ?? "",
    "Stato": inv.status || "",
  }));

  await auditExportPerformed("invoices_csv", rows.length);
  return toCsv(rows);
}

export async function exportPaymentsCsv(practiceProfileId: string): Promise<string> {
  // Get invoices for this practice first
  const { data: invoices } = await supabase
    .from("invoices").select("id, invoice_number").eq("practice_profile_id", practiceProfileId);
  const invoiceIds = (invoices || []).map(i => i.id);
  const invoiceMap = new Map((invoices || []).map(i => [i.id, i.invoice_number]));

  if (invoiceIds.length === 0) throw new Error("Nessun pagamento da esportare");

  const { data, error } = await supabase
    .from("payments")
    .select("payment_date, amount, method, status, notes, transaction_id, bank_reference, invoice_id, patients(first_name, last_name)")
    .in("invoice_id", invoiceIds)
    .order("payment_date", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Nessun pagamento da esportare");

  const rows = (data as any[]).map(p => ({
    "Data Pagamento": p.payment_date || "",
    "Paziente": p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : "",
    "Importo": p.amount ?? "",
    "Metodo": p.method || "",
    "Stato": p.status || "",
    "N. Fattura": invoiceMap.get(p.invoice_id) || "",
    "ID Transazione": p.transaction_id || "",
    "Rif. Bonifico": p.bank_reference || "",
    "Note": p.notes || "",
  }));

  await auditExportPerformed("payments_csv", rows.length);
  return toCsv(rows);
}

export async function exportTsReadyCsv(practiceProfileId: string): Promise<string> {
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number, issue_date, total_amount, status, patients(first_name, last_name, tax_code)")
    .eq("practice_profile_id", practiceProfileId)
    .in("status", ["issued", "sent", "paid"])
    .order("issue_date", { ascending: true });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Nessuna fattura emessa da esportare per TS");

  const rows = (data as any[]).map(inv => {
    const hasCF = !!inv.patients?.tax_code;
    return {
      "Numero Fattura": inv.invoice_number || "",
      "Data Emissione": inv.issue_date || "",
      "Paziente": inv.patients ? `${inv.patients.first_name} ${inv.patients.last_name}` : "",
      "Codice Fiscale": inv.patients?.tax_code || "⚠ MANCANTE",
      "Importo": inv.total_amount ?? "",
      "Stato": inv.status || "",
      "Pronto TS": hasCF ? "SÌ" : "NO — CF mancante",
    };
  });

  await auditExportPerformed("ts_ready_csv", rows.length);
  return toCsv(rows);
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(";"),
    ...rows.map(row => headers.map(h => {
      const val = String(row[h] ?? "");
      return val.includes(";") || val.includes('"') || val.includes("\n")
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(";")),
  ];
  return lines.join("\n");
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
