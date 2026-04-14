import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  // Professional
  professionalName: string;
  practiceName: string | null;
  vatNumber: string | null;
  taxCode: string | null;
  // Patient
  patientName: string;
  patientTaxCode: string | null;
  patientAddress: string | null;
  patientCity: string | null;
  // Items
  items: { description: string; quantity: number; unitAmount: number; totalAmount: number }[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: string | null;
}

export function generateInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("FATTURA", margin, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`N. ${data.invoiceNumber}`, margin, 32);
  doc.text(`Data: ${data.issueDate}`, margin, 37);
  if (data.dueDate) doc.text(`Scadenza: ${data.dueDate}`, margin, 42);

  // Professional info (right-aligned)
  const rightX = pageWidth - margin;
  let yRight = 25;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.professionalName, rightX, yRight, { align: "right" });
  yRight += 5;
  doc.setFont("helvetica", "normal");
  if (data.practiceName) { doc.text(data.practiceName, rightX, yRight, { align: "right" }); yRight += 5; }
  if (data.vatNumber) { doc.text(`P.IVA: ${data.vatNumber}`, rightX, yRight, { align: "right" }); yRight += 5; }
  if (data.taxCode) { doc.text(`C.F.: ${data.taxCode}`, rightX, yRight, { align: "right" }); yRight += 5; }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 52, pageWidth - margin, 52);

  // Patient info
  let yPatient = 60;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINATARIO", margin, yPatient);
  yPatient += 6;
  doc.setFont("helvetica", "normal");
  doc.text(data.patientName, margin, yPatient); yPatient += 5;
  if (data.patientTaxCode) { doc.text(`C.F.: ${data.patientTaxCode}`, margin, yPatient); yPatient += 5; }
  if (data.patientAddress) { doc.text(data.patientAddress, margin, yPatient); yPatient += 5; }
  if (data.patientCity) { doc.text(data.patientCity, margin, yPatient); yPatient += 5; }

  // Items table
  const tableStartY = Math.max(yPatient, yRight) + 10;
  autoTable(doc, {
    startY: tableStartY,
    head: [["Descrizione", "Qtà", "Prezzo unitario", "Totale"]],
    body: data.items.map(item => [
      item.description,
      String(item.quantity),
      `€ ${item.unitAmount.toFixed(2)}`,
      `€ ${item.totalAmount.toFixed(2)}`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 58, 95], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // Totals
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStartY + 30;
  let yTotals = finalY + 10;

  doc.setFontSize(10);
  doc.text("Subtotale:", pageWidth - margin - 60, yTotals);
  doc.text(`€ ${data.subtotal.toFixed(2)}`, pageWidth - margin, yTotals, { align: "right" });
  yTotals += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTALE:", pageWidth - margin - 60, yTotals);
  doc.text(`€ ${data.totalAmount.toFixed(2)}`, pageWidth - margin, yTotals, { align: "right" });

  // Payment method
  if (data.paymentMethod) {
    yTotals += 12;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Metodo di pagamento: ${data.paymentMethod}`, margin, yTotals);
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Documento non valido ai fini fiscali — fattura per prestazione sanitaria privata",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 15,
    { align: "center" }
  );

  return doc;
}

export function downloadInvoicePdf(data: InvoicePdfData) {
  const doc = generateInvoicePdf(data);
  doc.save(`Fattura_${data.invoiceNumber}.pdf`);
}
