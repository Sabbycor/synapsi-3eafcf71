import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Shield, FileText, CreditCard, UserPlus, FileCheck, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACTION_LABELS: Record<string, string> = {
  "patient.created": "Paziente creato",
  "invoice.generated": "Fattura generata",
  "payment.status_changed": "Stato pagamento aggiornato",
  "consent.updated": "Consenso aggiornato",
  "session.closed": "Seduta chiusa",
  "export.performed": "Export dati eseguito",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  "patient.created": UserPlus,
  "invoice.generated": FileText,
  "payment.status_changed": CreditCard,
  "consent.updated": FileCheck,
  "session.closed": FileText,
  "export.performed": Download,
};

interface AuditEntry {
  id: string;
  action: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export default function AuditLogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, metadata, created_at")
        .eq("actor_user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) console.error("[AuditLog]", error);
      setLogs((data || []) as AuditEntry[]);
      setLoading(false);
    }
    fetch();
  }, [user]);

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function getMetaSummary(meta: Record<string, unknown> | null): string {
    if (!meta) return "";
    const parts: string[] = [];
    if (meta.name) parts.push(String(meta.name));
    if (meta.invoiceNumber) parts.push(`Fatt. ${meta.invoiceNumber}`);
    if (meta.oldStatus && meta.newStatus) parts.push(`${meta.oldStatus} → ${meta.newStatus}`);
    if (meta.recordCount) parts.push(`${meta.recordCount} record`);
    return parts.join(" · ");
  }

  return (
    <PageContainer>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Audit & Log Accessi</h1>
            <p className="text-xs text-muted-foreground">Registro operazioni per compliance GDPR</p>
          </div>
        </div>

        {loading ? (
          <SkeletonList count={5} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Nessuna attività registrata"
            description="Le operazioni critiche verranno tracciate automaticamente qui"
          />
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const Icon = ACTION_ICONS[log.action || ""] || Shield;
              const label = ACTION_LABELS[log.action || ""] || log.action || "Azione";
              const meta = getMetaSummary(log.metadata as Record<string, unknown> | null);

              return (
                <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={14} className="text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                        {log.entity_type}
                      </Badge>
                    </div>
                    {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground pt-2">
          Ultime 100 operazioni · I log sono conservati per conformità normativa
        </p>
      </div>
    </PageContainer>
  );
}
