import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, InvoiceStatus, ConsentStatus } from "@/data/mock";
import { appointmentStatusLabels, invoiceStatusLabels, consentStatusLabels } from "@/data/mock";

const appointmentColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-warning/10 text-warning border-warning/20",
};

const invoiceColors: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary border-primary/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const consentColors: Record<ConsentStatus, string> = {
  signed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant="outline" className={cn("text-[11px] font-medium", appointmentColors[status])}>{appointmentStatusLabels[status]}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant="outline" className={cn("text-[11px] font-medium", invoiceColors[status])}>{invoiceStatusLabels[status]}</Badge>;
}

export function ConsentStatusBadge({ status }: { status: ConsentStatus }) {
  return <Badge variant="outline" className={cn("text-[11px] font-medium", consentColors[status])}>{consentStatusLabels[status]}</Badge>;
}
