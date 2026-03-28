import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import {
  TrendingUp, CalendarCheck, UserX, FileText, Clock,
} from "lucide-react";

interface MonthlyStats {
  revenue: number;
  sessions: number;
  noShows: number;
  openInvoicesAmount: number;
  onTimePaymentRate: number;
}

export function MonthlyReports() {
  const practiceProfileId = usePracticeProfileId();
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const monthLabel = now.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!practiceProfileId) return;
    async function fetch() {
      setLoading(true);

      const [paymentsRes, sessionsRes, noShowRes, openInvRes, totalInvRes] = await Promise.all([
        // Revenue: completed payments this month
        supabase.from("payments").select("amount")
          .eq("status", "completed")
          .gte("payment_date", monthStart).lt("payment_date", monthEnd)
          .in("invoice_id", (await supabase.from("invoices").select("id").eq("practice_profile_id", practiceProfileId)).data?.map(i => i.id) || []),
        // Sessions this month
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "completed")
          .gte("starts_at", `${monthStart}T00:00:00`).lt("starts_at", `${monthEnd}T00:00:00`),
        // No-shows this month
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "no_show")
          .gte("starts_at", `${monthStart}T00:00:00`).lt("starts_at", `${monthEnd}T00:00:00`),
        // Open invoices amount
        supabase.from("invoices").select("total_amount")
          .eq("practice_profile_id", practiceProfileId)
          .in("status", ["draft", "issued", "sent", "overdue"]),
        // Total invoices paid this month (for on-time rate)
        supabase.from("invoices").select("id, due_date, status")
          .eq("practice_profile_id", practiceProfileId)
          .eq("status", "paid")
          .gte("issue_date", monthStart).lt("issue_date", monthEnd),
      ]);

      const revenue = (paymentsRes.data || []).reduce((s, p) => s + (p.amount || 0), 0);
      const openAmount = (openInvRes.data || []).reduce((s, i) => s + (i.total_amount || 0), 0);

      // On-time rate: paid invoices where we assume they were paid before due_date
      const paidInvoices = totalInvRes.data || [];
      const onTimeRate = paidInvoices.length > 0 ? 100 : 0; // simplified — no overdue ones in paid

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
  }, [practiceProfileId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
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
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 capitalize">{monthLabel}</p>
      <div className="grid grid-cols-2 gap-2">
        {cards.map(c => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3 shadow-card">
            <c.icon size={14} className={c.color} />
            <p className="font-display text-lg font-bold text-foreground mt-1">{c.value}</p>
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
