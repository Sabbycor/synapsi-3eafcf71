import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronRight, User, Building2, CreditCard, Bell, Shield } from "lucide-react";

const menuItems = [
  { icon: User, label: "Dati personali", desc: "Nome, email, telefono" },
  { icon: Building2, label: "Studio", desc: "Indirizzo e impostazioni" },
  { icon: CreditCard, label: "Fatturazione", desc: "Metodi di pagamento" },
  { icon: Bell, label: "Notifiche", desc: "Gestisci promemoria" },
  { icon: Shield, label: "Privacy e sicurezza", desc: "Password e dati" },
];

export default function ProfilePage() {
  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in">
        {/* Profile card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shrink-0">
            <span className="text-lg font-bold text-primary-foreground">MR</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-foreground">Dott. Mario Rossi</p>
            <p className="text-sm text-muted-foreground truncate">mario.rossi@email.it</p>
          </div>
        </div>

        {/* Menu */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
          {menuItems.map((item) => (
            <button key={item.label} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary shrink-0">
                <item.icon size={16} className="text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>

        <Button variant="outline" className="w-full text-destructive hover:text-destructive">
          <LogOut size={16} /> Esci dall'account
        </Button>
      </div>
    </PageContainer>
  );
}
