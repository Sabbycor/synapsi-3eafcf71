// ============================================================
// AURA AI — Centralized Mock Data
// ============================================================

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
export type InvoiceStatus = "draft" | "issued" | "sent" | "paid" | "partially_paid" | "overdue" | "cancelled";
export type PaymentMethod = "bank_transfer" | "cash" | "card";
export type PaymentStatus = "completed" | "pending" | "refunded";
export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "done";
export type ConsentStatus = "signed" | "pending" | "expired";

export interface Psychologist {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fiscalCode: string;
  vatNumber: string;
  alboProv: string;
  alboNumber: string;
}

export interface Practice {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  defaultDuration: number;
  defaultRate: number;
  invoicePrefix: string;
  invoiceNextNumber: number;
  paymentTermsDays: number;
  notifyAppointmentHours: number;
  notifyInvoiceDays: number;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fiscalCode: string;
  dateOfBirth: string;
  gender: "M" | "F" | "other";
  status: "active" | "inactive" | "archived";
  consentStatus: ConsentStatus;
  consentDate?: string;
  notes: string;
  createdAt: string;
  totalSessions: number;
  lastVisit?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: string;
  notes: string;
  rate: number;
  duration: number; // minutes
}

export interface Invoice {
  id: string;
  number: string;
  patientId: string;
  appointmentIds: string[];
  date: string;
  dueDate: string;
  amount: number;
  vat: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  description: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  patientId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  patientId?: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: "patient" | "billing" | "admin" | "setup";
  completed: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  patientId?: string;
  date: string;
  read: boolean;
}

export interface AiCoachSuggestion {
  id: string;
  icon: string;
  title: string;
  description: string;
  action?: string;
}

// ──────────────────────────────────────────────────
// DATA
// ──────────────────────────────────────────────────

export const psychologist: Psychologist = {
  id: "psy-1",
  firstName: "Elena",
  lastName: "Ferretti",
  email: "elena.ferretti@studio.it",
  phone: "+39 333 1234567",
  fiscalCode: "FRRLNE85M41H501Q",
  vatNumber: "IT12345678901",
  alboProv: "Roma",
  alboNumber: "12345",
};

export const practice: Practice = {
  id: "pra-1",
  name: "Studio Ferretti",
  address: "Via Roma 42",
  city: "Roma",
  province: "RM",
  zip: "00184",
  defaultDuration: 50,
  defaultRate: 80,
  invoicePrefix: "2026/",
  invoiceNextNumber: 7,
  paymentTermsDays: 30,
  notifyAppointmentHours: 24,
  notifyInvoiceDays: 7,
};

export const patients: Patient[] = [
  { id: "pat-1", firstName: "Marco", lastName: "Bianchi", email: "marco.b@email.it", phone: "+39 340 1111111", fiscalCode: "BNCMRC90A01H501Z", dateOfBirth: "1990-01-15", gender: "M", status: "active", consentStatus: "signed", consentDate: "2025-09-01", notes: "", createdAt: "2025-09-01", totalSessions: 14, lastVisit: "2026-03-07" },
  { id: "pat-2", firstName: "Laura", lastName: "Martini", email: "laura.m@email.it", phone: "+39 340 2222222", fiscalCode: "MRTLRA88B45H501Y", dateOfBirth: "1988-02-05", gender: "F", status: "active", consentStatus: "signed", consentDate: "2025-10-15", notes: "", createdAt: "2025-10-15", totalSessions: 9, lastVisit: "2026-03-05" },
  { id: "pat-3", firstName: "Giulia", lastName: "Russo", email: "giulia.r@email.it", phone: "+39 340 3333333", fiscalCode: "RSSGLI85C50H501X", dateOfBirth: "1985-03-10", gender: "F", status: "active", consentStatus: "signed", consentDate: "2025-06-01", notes: "", createdAt: "2025-06-01", totalSessions: 24, lastVisit: "2026-03-03" },
  { id: "pat-4", firstName: "Andrea", lastName: "Colombo", email: "andrea.c@email.it", phone: "+39 340 4444444", fiscalCode: "CLMNDR92D15H501W", dateOfBirth: "1992-04-15", gender: "M", status: "active", consentStatus: "pending", notes: "Consenso da rinnovare", createdAt: "2026-01-10", totalSessions: 6, lastVisit: "2026-03-01" },
  { id: "pat-5", firstName: "Francesca", lastName: "Verdi", email: "francesca.v@email.it", phone: "+39 340 5555555", fiscalCode: "VRDFNC95E20H501V", dateOfBirth: "1995-05-20", gender: "F", status: "active", consentStatus: "signed", consentDate: "2025-11-01", notes: "", createdAt: "2025-11-01", totalSessions: 16, lastVisit: "2026-02-26" },
  { id: "pat-6", firstName: "Luca", lastName: "Moretti", email: "luca.m@email.it", phone: "+39 340 6666666", fiscalCode: "MRTLCU87F10H501U", dateOfBirth: "1987-06-10", gender: "M", status: "active", consentStatus: "signed", consentDate: "2025-12-01", notes: "", createdAt: "2025-12-01", totalSessions: 10, lastVisit: "2026-03-08" },
  { id: "pat-7", firstName: "Sofia", lastName: "Conti", email: "sofia.c@email.it", phone: "+39 340 7777777", fiscalCode: "CNTSFO93G25H501T", dateOfBirth: "1993-07-25", gender: "F", status: "inactive", consentStatus: "expired", notes: "In pausa dal 2026-01", createdAt: "2025-04-01", totalSessions: 20, lastVisit: "2026-01-15" },
  { id: "pat-8", firstName: "Davide", lastName: "Romano", email: "davide.r@email.it", phone: "+39 340 8888888", fiscalCode: "RMNDVD91H05H501S", dateOfBirth: "1991-08-05", gender: "M", status: "active", consentStatus: "signed", consentDate: "2026-02-01", notes: "", createdAt: "2026-02-01", totalSessions: 3, lastVisit: "2026-03-06" },
];

export const appointments: Appointment[] = [
  { id: "apt-1", patientId: "pat-1", date: "2026-03-10", startTime: "09:00", endTime: "09:50", status: "confirmed", type: "Colloquio individuale", notes: "", rate: 80, duration: 50 },
  { id: "apt-2", patientId: "pat-2", date: "2026-03-10", startTime: "10:00", endTime: "10:50", status: "scheduled", type: "Follow-up", notes: "", rate: 80, duration: 50 },
  { id: "apt-3", patientId: "pat-6", date: "2026-03-10", startTime: "14:00", endTime: "14:50", status: "confirmed", type: "Colloquio individuale", notes: "", rate: 80, duration: 50 },
  { id: "apt-4", patientId: "pat-8", date: "2026-03-10", startTime: "16:00", endTime: "16:50", status: "scheduled", type: "Follow-up", notes: "", rate: 80, duration: 50 },
  { id: "apt-5", patientId: "pat-3", date: "2026-03-11", startTime: "09:00", endTime: "09:50", status: "scheduled", type: "Colloquio individuale", notes: "", rate: 80, duration: 50 },
  { id: "apt-6", patientId: "pat-5", date: "2026-03-11", startTime: "11:00", endTime: "11:50", status: "scheduled", type: "Prima visita", notes: "", rate: 90, duration: 50 },
  { id: "apt-7", patientId: "pat-4", date: "2026-03-12", startTime: "10:00", endTime: "10:50", status: "scheduled", type: "Follow-up", notes: "", rate: 80, duration: 50 },
  { id: "apt-8", patientId: "pat-1", date: "2026-03-07", startTime: "09:00", endTime: "09:50", status: "completed", type: "Colloquio individuale", notes: "", rate: 80, duration: 50 },
  { id: "apt-9", patientId: "pat-2", date: "2026-03-05", startTime: "10:00", endTime: "10:50", status: "completed", type: "Follow-up", notes: "", rate: 80, duration: 50 },
  { id: "apt-10", patientId: "pat-6", date: "2026-03-06", startTime: "14:00", endTime: "14:50", status: "no_show", type: "Colloquio individuale", notes: "Paziente non presentato", rate: 80, duration: 50 },
  { id: "apt-11", patientId: "pat-4", date: "2026-03-04", startTime: "11:00", endTime: "11:50", status: "cancelled", type: "Follow-up", notes: "Annullato dal paziente", rate: 80, duration: 50 },
  { id: "apt-12", patientId: "pat-3", date: "2026-03-08", startTime: "09:00", endTime: "09:50", status: "completed", type: "Colloquio individuale", notes: "", rate: 80, duration: 50 },
];

export const invoices: Invoice[] = [
  { id: "inv-1", number: "2026/001", patientId: "pat-1", appointmentIds: ["apt-8"], date: "2026-03-07", dueDate: "2026-04-06", amount: 80, vat: 0, total: 80, paidAmount: 0, status: "sent", description: "Colloquio individuale — 07/03/2026" },
  { id: "inv-2", number: "2026/002", patientId: "pat-2", appointmentIds: ["apt-9"], date: "2026-03-05", dueDate: "2026-04-04", amount: 80, vat: 0, total: 80, paidAmount: 80, status: "paid", description: "Follow-up — 05/03/2026" },
  { id: "inv-3", number: "2026/003", patientId: "pat-3", appointmentIds: ["apt-12"], date: "2026-03-08", dueDate: "2026-04-07", amount: 80, vat: 0, total: 80, paidAmount: 0, status: "issued", description: "Colloquio individuale — 08/03/2026" },
  { id: "inv-4", number: "2026/004", patientId: "pat-6", appointmentIds: [], date: "2026-02-15", dueDate: "2026-03-01", amount: 160, vat: 0, total: 160, paidAmount: 80, status: "partially_paid", description: "2 sedute — Febbraio 2026" },
  { id: "inv-5", number: "2026/005", patientId: "pat-5", appointmentIds: [], date: "2026-02-20", dueDate: "2026-03-05", amount: 240, vat: 0, total: 240, paidAmount: 0, status: "overdue", description: "3 sedute — Febbraio 2026" },
  { id: "inv-6", number: "2025/048", patientId: "pat-4", appointmentIds: [], date: "2025-12-15", dueDate: "2026-01-15", amount: 80, vat: 0, total: 80, paidAmount: 80, status: "paid", description: "Colloquio — Dicembre 2025" },
  { id: "inv-7", number: "2026/006", patientId: "pat-8", appointmentIds: [], date: "2026-03-06", dueDate: "2026-04-05", amount: 80, vat: 0, total: 80, paidAmount: 0, status: "draft", description: "Follow-up — 06/03/2026" },
  { id: "inv-8", number: "2026/007", patientId: "pat-7", appointmentIds: [], date: "2026-01-10", dueDate: "2026-02-10", amount: 160, vat: 0, total: 160, paidAmount: 0, status: "cancelled", description: "Sedute annullate — Gennaio 2026" },
];

export const payments: Payment[] = [
  { id: "pay-1", invoiceId: "inv-2", patientId: "pat-2", date: "2026-03-06", amount: 80, method: "bank_transfer", status: "completed", notes: "" },
  { id: "pay-2", invoiceId: "inv-6", patientId: "pat-4", date: "2026-01-10", amount: 80, method: "cash", status: "completed", notes: "" },
  { id: "pay-3", invoiceId: "inv-4", patientId: "pat-6", date: "2026-03-09", amount: 80, method: "card", status: "completed", notes: "Acconto parziale" },
  { id: "pay-4", invoiceId: "inv-1", patientId: "pat-1", date: "2026-03-08", amount: 80, method: "bank_transfer", status: "pending", notes: "In attesa di conferma bancaria" },
  { id: "pay-5", invoiceId: "inv-3", patientId: "pat-3", date: "2026-03-09", amount: 80, method: "cash", status: "completed", notes: "" },
];

export const tasks: Task[] = [
  { id: "tsk-1", title: "Inviare fattura a Marco Bianchi", description: "Fattura 2026/001 da inviare via email", patientId: "pat-1", dueDate: "2026-03-10", status: "todo", completed: false, priority: "high", category: "billing" },
  { id: "tsk-2", title: "Rinnovare consenso Andrea Colombo", description: "Il consenso informato è in stato 'in attesa'", patientId: "pat-4", dueDate: "2026-03-11", status: "todo", completed: false, priority: "high", category: "patient" },
  { id: "tsk-3", title: "Aggiornare tariffa prima visita", description: "Rivedere la tariffa da €90 a €100", dueDate: "2026-03-12", status: "todo", completed: false, priority: "medium", category: "admin" },
  { id: "tsk-4", title: "Verificare pagamento Luca Moretti", description: "Fattura 2026/004 parzialmente pagata — verificare saldo", patientId: "pat-6", dueDate: "2026-03-10", status: "in_progress", completed: false, priority: "medium", category: "billing" },
  { id: "tsk-5", title: "Archiviare cartella Sofia Conti", description: "Paziente inattiva da 2 mesi", patientId: "pat-7", dueDate: "2026-03-15", status: "todo", completed: false, priority: "low", category: "patient" },
  { id: "tsk-6", title: "Controllare scadenze fiscali Q1", description: "Verificare adempimenti fiscali primo trimestre 2026", dueDate: "2026-03-31", status: "todo", completed: false, priority: "high", category: "admin" },
  { id: "tsk-7", title: "Confermare appuntamento Davide Romano", description: "Follow-up del 10/03 da confermare", patientId: "pat-8", dueDate: "2026-03-10", status: "done", completed: true, priority: "medium", category: "patient" },
  { id: "tsk-8", title: "Raccogliere codice fiscale mancante", description: "Completare anagrafica paziente", patientId: "pat-8", dueDate: "2026-03-12", status: "todo", completed: false, priority: "medium", category: "patient" },
  { id: "tsk-9", title: "Caricare consenso firmato", description: "Scansione consenso firmato di Laura Martini", patientId: "pat-2", dueDate: "2026-03-14", status: "todo", completed: false, priority: "low", category: "patient" },
  { id: "tsk-10", title: "Revisione fattura scaduta", description: "Fattura 2026/005 di Francesca Verdi — €240 scaduta", patientId: "pat-5", dueDate: "2026-03-10", status: "todo", completed: false, priority: "high", category: "billing" },
  { id: "tsk-11", title: "Completare setup studio", description: "Configurazione iniziale dello studio completata al 80%", dueDate: "2026-03-15", status: "in_progress", completed: false, priority: "low", category: "setup" },
];

export const reminders: Reminder[] = [
  { id: "rem-1", title: "Appuntamento domani", description: "Giulia Russo — Colloquio individuale ore 09:00", patientId: "pat-3", date: "2026-03-10", read: false },
  { id: "rem-2", title: "Fattura scaduta", description: "Fattura 2026/004 di Luca Moretti — €160 scaduta il 01/03", patientId: "pat-6", date: "2026-03-10", read: false },
  { id: "rem-3", title: "Consenso in scadenza", description: "Il consenso di Andrea Colombo è in attesa di firma", patientId: "pat-4", date: "2026-03-10", read: false },
  { id: "rem-4", title: "Fine trimestre fiscale", description: "Controllare le scadenze fiscali entro il 31 marzo", date: "2026-03-25", read: true },
  { id: "rem-5", title: "Follow-up paziente inattivo", description: "Sofia Conti inattiva da 2 mesi — considerare follow-up", patientId: "pat-7", date: "2026-03-12", read: false },
];

export const aiCoachSuggestions: AiCoachSuggestion[] = [
  { id: "ai-1", icon: "💡", title: "Fatture in ritardo", description: "Hai 2 fatture scadute per un totale di €400. Vuoi inviare un promemoria?", action: "Invia promemoria" },
  { id: "ai-2", icon: "📋", title: "Consenso da rinnovare", description: "Andrea Colombo non ha ancora firmato il consenso aggiornato.", action: "Gestisci consenso" },
  { id: "ai-3", icon: "📊", title: "Riepilogo settimanale", description: "Questa settimana hai 8 appuntamenti programmati e 3 fatture da emettere.", action: "Vedi dettagli" },
  { id: "ai-4", icon: "⚡", title: "Ottimizza l'agenda", description: "Mercoledì hai un gap di 3 ore tra gli appuntamenti. Vuoi riorganizzare?", action: "Riorganizza" },
];

export const dashboardStats = {
  patientsActive: patients.filter(p => p.status === "active").length,
  appointmentsToday: appointments.filter(a => a.date === "2026-03-10").length,
  pendingInvoices: invoices.filter(i => i.status === "sent" || i.status === "draft" || i.status === "issued").length,
  overduePayments: invoices.filter(i => i.status === "overdue" || i.status === "partially_paid").length,
  monthlyRevenue: 1920,
  completedThisWeek: appointments.filter(a => a.status === "completed").length,
  totalOutstanding: invoices.filter(i => ["sent", "issued", "overdue", "partially_paid"].includes(i.status)).reduce((s, i) => s + i.total - i.paidAmount, 0),
  totalOverdue: invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total - i.paidAmount, 0),
};

// ──────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────

export function getPatient(id: string): Patient | undefined {
  return patients.find(p => p.id === id);
}

export function getPatientName(id: string): string {
  const p = getPatient(id);
  return p ? `${p.firstName} ${p.lastName}` : "Sconosciuto";
}

export function getPatientInitials(id: string): string {
  const p = getPatient(id);
  return p ? `${p.firstName[0]}${p.lastName[0]}` : "??";
}

export function getAppointment(id: string): Appointment | undefined {
  return appointments.find(a => a.id === id);
}

export function getInvoice(id: string): Invoice | undefined {
  return invoices.find(i => i.id === id);
}

export function getAppointmentsForPatient(patientId: string): Appointment[] {
  return appointments.filter(a => a.patientId === patientId);
}

export function getInvoicesForPatient(patientId: string): Invoice[] {
  return invoices.filter(i => i.patientId === patientId);
}

export function getPaymentsForPatient(patientId: string): Payment[] {
  return payments.filter(p => p.patientId === patientId);
}

export function getPaymentsForInvoice(invoiceId: string): Payment[] {
  return payments.filter(p => p.invoiceId === invoiceId);
}

export function getTasksForPatient(patientId: string): Task[] {
  return tasks.filter(t => t.patientId === patientId);
}

export function getRemindersForPatient(patientId: string): Reminder[] {
  return reminders.filter(r => r.patientId === patientId);
}

export function getAppointmentsForDate(date: string): Appointment[] {
  return appointments.filter(a => a.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Programmato",
  confirmed: "Confermato",
  completed: "Completato",
  cancelled: "Annullato",
  no_show: "Assente",
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Bozza",
  issued: "Emessa",
  sent: "Inviata",
  paid: "Pagata",
  partially_paid: "Parz. pagata",
  overdue: "Scaduta",
  cancelled: "Annullata",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  bank_transfer: "Bonifico",
  cash: "Contanti",
  card: "Carta",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  completed: "Completato",
  pending: "In attesa",
  refunded: "Rimborsato",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "Da fare",
  in_progress: "In corso",
  done: "Completato",
};

export const taskCategoryLabels: Record<string, string> = {
  patient: "Paziente",
  billing: "Fatturazione",
  admin: "Amministrazione",
  setup: "Configurazione",
};

export const consentStatusLabels: Record<ConsentStatus, string> = {
  signed: "Firmato",
  pending: "In attesa",
  expired: "Scaduto",
};
