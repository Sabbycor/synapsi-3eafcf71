import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { SkeletonList } from "@/components/SkeletonCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarCheck, Users, Receipt, AlertTriangle, ChevronRight,
  UserPlus, FileText, CreditCard, CheckCircle2, Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const practiceProfileId = usePracticeProfileId();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Dottore/Dottoressa");
  const [stats, setStats] = useState({ patients: 0, todayAppts: 0, pendingInvoices: 0, overdueInvoices: 0 });

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch user name
        const { data: userData, error: userErr } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("id", user!.id)
          .maybeSingle();

        if (userErr) {
          console.error("[Dashboard] users fetch error:", userErr);
          toast({ title: "Errore", description: userErr.message, variant: "destructive" });
        }

        if (userData?.full_name) {
          const firstName = userData.full_name.split(" ")[0];
          setGreeting(firstName || "Dottore/Dottoressa");
        } else if (userData?.email) {
          setGreeting(userData.email);
        }

        // Fetch stats in parallel
        const today = new Date().toISOString().slice(0, 10);
        const startOfDay = `${today}T00:00:00`;
        const endOfDay = `${today}T23:59:59`;

        const [patientsRes, apptsRes, pendingRes, overdueRes] = await Promise.all([
          supabase.from("patients").select("id", { count: "exact", head: true })
            .eq("practice_profile_id", practiceProfileId).eq("status", "active"),
          supabase.from("appointments").select("id", { count: "exact", head: true })
            .eq("practice_profile_id", practiceProfileId)
            .gte("starts_at", startOfDay).lte("starts_at", endOfDay),
          supabase.from("invoices").select("id", { count: "exact", head: true })
            .eq("practice_profile_id", practiceProfileId).in("status", ["draft", "sent", "issued"]),
          supabase.from("invoices").select("id", { count: "exact", head: true })
            .eq("practice_profile_id", practiceProfileId).eq("status", "overdue"),
        ]);

        // Log any errors
        [patientsRes, apptsRes, pendingRes, overdueRes].forEach((r, i) => {
          if (r.error) {
            const labels = ["patients", "appointments", "pending invoices", "overdue invoices"];
            console.error(`[Dashboard] ${labels[i]} error:`, r.error);
            toast({ title: "Errore", description: r.error.message, variant: "destructive" });
          }
        });

        setStats({
          patients: patientsRes.count ?? 0,
          todayAppts: apptsRes.count ?? 0,
          pendingInvoices: pendingRes.count ?? 0,
          overdueInvoices: overdueRes.count ?? 0,
        });
      } catch (err: any) {
        console.error("[Dashboard] unexpected error:", err);
        toast({ title: "Errore", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, practiceProfileId]);

  const statCards = [
    { icon: Users, label: "Pazienti attivi", value: stats.patients },
    { icon: CalendarCheck, label: "Oggi", value: stats.todayAppts },
    { icon: Receipt, label: "Da fatturare", value: stats.pendingInvoices },
    { icon: AlertTriangle, label: "Scadute", value: stats.overdueInvoices },
  ];

  const now = new Date();
  const dateLabel = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <div className="h-7 w-52 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
          </div>
          <SkeletonList count={3} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        {/* Greeting */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Buongiorno, {greeting} 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <s.icon size={18} className="text-accent" />
              <p className="font-display text-2xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <SectionHeader title="Azioni rapide" className="mb-3" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: UserPlus, label: "Nuovo paziente", to: "/patients" },
              { icon: CalendarCheck, label: "Appuntamento", to: "/calendar" },
              { icon: CheckCircle2, label: "Completa seduta" },
              { icon: FileText, label: "Genera fattura" },
              { icon: CreditCard, label: "Registra pagamento" },
            ].map((qa) => (
              <Button
                key={qa.label}
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => qa.to && navigate(qa.to)}
              >
                <qa.icon size={18} />
                <span className="text-xs">{qa.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
