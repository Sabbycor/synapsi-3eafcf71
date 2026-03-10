import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, InvoiceStatus, ConsentStatus, PaymentStatus, TaskPriority, TaskStatus } from "@/data/mock";
import { appointmentStatusLabels, invoiceStatusLabels, consentStatusLabels, paymentStatusLabels, taskStatusLabels } from "@/data/mock";

const appointmentColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-warning/10 text-warning border-warning/20",
};

const invoiceColors: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  issued: "bg-secondary text-secondary-foreground border-secondary",
  sent: "bg-primary/10 text-primary border-primary/20",
  paid: "bg-success/10 text-success border-success/20",
  partially_paid: "bg-warning/10 text-warning border-warning/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground line-through",
};

const consentColors: Record<ConsentStatus, string> = {
  signed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  expired: "bg-destructive/10 text-destructive border-destructive/20",
};

const paymentColors: Record<PaymentStatus, string> = {
  completed: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  refunded: "bg-muted text-muted-foreground",
};

const priorityColors: Record<TaskPriority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground",
};

const priorityLabels: Record<TaskPriority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Bassa",
};

const taskStatusColors: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  done: "bg-success/10 text-success border-success/20",
};

export const AppointmentStatusBadge = React.forwardRef<HTMLDivElement, { status: AppointmentStatus }>(
  ({ status }, ref) => (
    <Badge ref={ref} variant="outline" className={cn("text-[11px] font-medium", appointmentColors[status])}>{appointmentStatusLabels[status]}</Badge>
  )
);
AppointmentStatusBadge.displayName = "AppointmentStatusBadge";

export const InvoiceStatusBadge = React.forwardRef<HTMLDivElement, { status: InvoiceStatus }>(
  ({ status }, ref) => (
    <Badge ref={ref} variant="outline" className={cn("text-[11px] font-medium", invoiceColors[status])}>{invoiceStatusLabels[status]}</Badge>
  )
);
InvoiceStatusBadge.displayName = "InvoiceStatusBadge";

export const ConsentStatusBadge = React.forwardRef<HTMLDivElement, { status: ConsentStatus }>(
  ({ status }, ref) => (
    <Badge ref={ref} variant="outline" className={cn("text-[11px] font-medium", consentColors[status])}>{consentStatusLabels[status]}</Badge>
  )
);
ConsentStatusBadge.displayName = "ConsentStatusBadge";

export const PaymentStatusBadge = React.forwardRef<HTMLDivElement, { status: PaymentStatus }>(
  ({ status }, ref) => (
    <Badge ref={ref} variant="outline" className={cn("text-[11px] font-medium", paymentColors[status])}>{paymentStatusLabels[status]}</Badge>
  )
);
PaymentStatusBadge.displayName = "PaymentStatusBadge";

export const PriorityBadge = React.forwardRef<HTMLDivElement, { priority: TaskPriority }>(
  ({ priority }, ref) => (
    <Badge ref={ref} variant="outline" className={cn("text-[11px] font-medium", priorityColors[priority])}>{priorityLabels[priority]}</Badge>
  )
);
PriorityBadge.displayName = "PriorityBadge";

export const TaskStatusBadge = React.forwardRef<HTMLDivElement, { status: TaskStatus }>(
  ({ status }, ref) => (
    <Badge ref={ref} variant="outline" className={cn("text-[11px] font-medium", taskStatusColors[status])}>{taskStatusLabels[status]}</Badge>
  )
);
TaskStatusBadge.displayName = "TaskStatusBadge";
