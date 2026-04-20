import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, CalendarCheck, UserX, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyStats {
  revenue: number;
  sessions: number;
  noShows: number;
  openInvoicesAmount: number;
  onTimePaymentRate: number;
}

interface MonthlyReportsProps {
  /** The date (any day within the month) to show reports for. */
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthlyReports({ selectedDate, onDateChange }: MonthlyReportsProps) {
  const practiceProfileId = usePracticeProfileId();
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  useEffect(() => {
    if (!practiceProfileId) return;
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const next = new Date(year, month + 1, 1);
    const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

    async function fetch() {
      setLoading(true);

      const [paymentsRes, sessionsRes, noShowRes, openInvRes, totalInvRes] = await Promise.all([
        // Revenue: completed payments this month
        supabase.from("payments").select("amount")
          .eq("status", "completed")
          .gte("payment_date", start).lt("payment_date", end)
          .in("invoice_id", (await supabase.from("invoices").select("id").eq("practice_profile_id", practiceProfileId)).data?.map(i => i.id) || []),
        // Sessions this month
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "completed")
          .gte("starts_at", `${start}T00:00:00`).lt("starts_at", `${end}T00:00:00`),
        // No-shows this month
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "no_show")
          .gte("starts_at", `${start}T00:00:00`).lt("starts_at", `${end}T00:00:00`),
        // Open invoices amount
        supabase.from("invoices").select("total_amount")
          .eq("practice_profile_id", practiceProfileId)
          .in("status", ["draft", "issued", "sent", "overdue"]),
        // Total invoices paid this month (for on-time rate)
        supabase.from("invoices").select("id, due_date, status")
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "paid")
          .gte("issue_date", start).lt("issue_date", end),
      ]);

      const revenue = (paymentsRes.data || []).reduce((s, p) => s + (p.amount || 0), 0);
      const openAmount = (openInvRes.data || []).reduce((s, i) => s + (i.total_amount || 0), 0);

      const paidInvoices = totalInvRes.data || [];
      const onTimeRate = paidInvoices.length > 0 ? 100 : 0;

      setStats({
        revenue,
        sessions: sessionsRes.count ?? 0,
        noShows: noShowRes.count ?? 0,
        openInvoicesAmount: openAmount,
        onTimePaymentRate: onTimeRate,
      });
      setLoading(false);
    }
    fetch();
  }, [practiceProfileId, selectedDate]);

  // Helper for generating month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
        options.push({
            value: date.toISOString(),
            label: date.toLocaleString('it-IT', { month: 'long', year: 'numeric' })
        });
    }
    return options;
  }, []);

  const currentLabel = selectedDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted animate-pulse rounded-md" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { icon: TrendingUp, label: "Incassi", value: `€${stats.revenue.toFixed(0)}`, color: "text-success" },
    { icon: CalendarCheck, label: "Sedute", value: String(stats.sessions), color: "text-primary" },
    { icon: UserX, label: "Assenze", value: String(stats.noShows), color: stats.noShows > 0 ? "text-destructive" : "text-muted-foreground" },
    { icon: FileText, label: "Da incassare", value: `€${stats.openInvoicesAmount.toFixed(0)}`, color: stats.openInvoicesAmount > 0 ? "text-warning" : "text-muted-foreground" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select 
          value={selectedDate.toISOString()} 
          onValueChange={(val) => onDateChange(new Date(val))}
        >
          <SelectTrigger className="w-fit min-w-[140px] h-8 text-xs font-bold bg-secondary/30 border-none shadow-none focus:ring-0 capitalize">
             <CalendarCheck className="w-3.5 h-3.5 mr-2 text-primary" />
             <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="capitalize text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <div key={c.label} className="group relative overflow-hidden rounded-2xl border border-border bg-background/50 p-4 transition-all hover:bg-background hover:shadow-sm">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center mb-3",
              c.color.includes("success") ? "bg-success/10" : 
              c.color.includes("primary") ? "bg-primary/10" : 
              c.color.includes("destructive") ? "bg-destructive/10" : 
              c.color.includes("warning") ? "bg-warning/10" : "bg-muted"
            )}>
              <c.icon size={16} className={c.color} />
            </div>
            <p className="font-display text-2xl font-bold text-foreground tracking-tight">{c.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
