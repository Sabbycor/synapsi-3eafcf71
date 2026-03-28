import { supabase } from "@/integrations/supabase/client";

/**
 * Log a critical action to the audit_logs table.
 * Call this after patient creation, invoice generation, payment changes, consent updates.
 */
export async function logAuditEvent(params: {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.error("[AuditLog] Failed to write:", error.message);
  }
}

// Convenience wrappers
export const auditPatientCreated = (patientId: string, name: string) =>
  logAuditEvent({ action: "patient.created", entityType: "patient", entityId: patientId, metadata: { name } });

export const auditInvoiceGenerated = (invoiceId: string, invoiceNumber: string) =>
  logAuditEvent({ action: "invoice.generated", entityType: "invoice", entityId: invoiceId, metadata: { invoiceNumber } });

export const auditPaymentStatusChanged = (paymentId: string, oldStatus: string, newStatus: string) =>
  logAuditEvent({ action: "payment.status_changed", entityType: "payment", entityId: paymentId, metadata: { oldStatus, newStatus } });

export const auditConsentUpdated = (consentId: string, consentType: string) =>
  logAuditEvent({ action: "consent.updated", entityType: "patient_consent", entityId: consentId, metadata: { consentType } });

export const auditSessionClosed = (appointmentId: string, invoiceNumber: string) =>
  logAuditEvent({ action: "session.closed", entityType: "appointment", entityId: appointmentId, metadata: { invoiceNumber } });

export const auditExportPerformed = (exportType: string, recordCount: number) =>
  logAuditEvent({ action: "export.performed", entityType: "export", entityId: exportType, metadata: { recordCount } });
