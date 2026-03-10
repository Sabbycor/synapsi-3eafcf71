import { useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { psychologist, practice } from "@/data/mock";
import {
  LogOut, ChevronRight, User, Building2, Receipt, Bell, Shield, Settings,
  Save, ArrowLeft, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Section = "menu" | "account" | "practice" | "invoicing" | "notifications";

export default function ProfilePage() {
  const [section, setSection] = useState<Section>("menu");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const menuItems: { key: Section; icon: typeof User; label: string; desc: string }[] = [
    { key: "account", icon: User, label: "Dati personali", desc: "Nome, email, telefono, albo" },
    { key: "practice", icon: Building2, label: "Studio", desc: "Indirizzo e impostazioni" },
    { key: "invoicing", icon: Receipt, label: "Fatturazione", desc: "Prefissi, termini, IVA" },
    { key: "notifications", icon: Bell, label: "Notifiche", desc: "Promemoria e avvisi" },
  ];

  if (section === "menu") {
    return (
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          {/* Profile card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shrink-0">
              <span className="text-lg font-bold text-primary-foreground">
                {psychologist.firstName[0]}{psychologist.lastName[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-foreground">Dott.ssa {psychologist.firstName} {psychologist.lastName}</p>
              <p className="text-sm text-muted-foreground truncate">{psychologist.email}</p>
              <p className="text-xs text-muted-foreground">Albo {psychologist.alboProv} n. {psychologist.alboNumber}</p>
            </div>
          </div>

          {/* Menu */}
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
              >
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

          <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/5">
            <LogOut size={16} /> Esci dall'account
          </Button>

          <p className="text-xs text-center text-muted-foreground">Synapsi v1.0 · Frontend Preview</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-5 animate-fade-in">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSection("menu")}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="font-display text-lg font-bold text-foreground">
            {menuItems.find(m => m.key === section)?.label}
          </h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          {section === "account" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input defaultValue={psychologist.firstName} />
                </div>
                <div className="space-y-2">
                  <Label>Cognome</Label>
                  <Input defaultValue={psychologist.lastName} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" defaultValue={psychologist.email} />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input defaultValue={psychologist.phone} />
              </div>
              <div className="space-y-2">
                <Label>Codice fiscale</Label>
                <Input defaultValue={psychologist.fiscalCode} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>P. IVA</Label>
                <Input defaultValue={psychologist.vatNumber} className="font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Albo provincia</Label>
                  <Input defaultValue={psychologist.alboProv} />
                </div>
                <div className="space-y-2">
                  <Label>Numero iscrizione</Label>
                  <Input defaultValue={psychologist.alboNumber} />
                </div>
              </div>
            </>
          )}

          {section === "practice" && (
            <>
              <div className="space-y-2">
                <Label>Nome studio</Label>
                <Input defaultValue={practice.name} />
              </div>
              <div className="space-y-2">
                <Label>Indirizzo</Label>
                <Input defaultValue={practice.address} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Città</Label>
                  <Input defaultValue={practice.city} />
                </div>
                <div className="space-y-2">
                  <Label>Prov.</Label>
                  <Input defaultValue={practice.province} />
                </div>
                <div className="space-y-2">
                  <Label>CAP</Label>
                  <Input defaultValue={practice.zip} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Durata seduta (min)</Label>
                  <Input type="number" defaultValue={practice.defaultDuration} />
                </div>
                <div className="space-y-2">
                  <Label>Tariffa base (€)</Label>
                  <Input type="number" defaultValue={practice.defaultRate} />
                </div>
              </div>
            </>
          )}

          {section === "invoicing" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Prefisso fattura</Label>
                  <Input defaultValue={practice.invoicePrefix} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Prossimo numero</Label>
                  <Input type="number" defaultValue={practice.invoiceNextNumber} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Termini di pagamento (giorni)</Label>
                <Input type="number" defaultValue={practice.paymentTermsDays} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Regime forfettario</p>
                  <p className="text-xs text-muted-foreground">Esente IVA ex art. 1 c.54-89 L.190/2014</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Bollo €2 automatico</p>
                  <p className="text-xs text-muted-foreground">Aggiungi per importi superiori a €77,47</p>
                </div>
                <Switch defaultChecked />
              </div>
            </>
          )}

          {section === "notifications" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Promemoria appuntamento</p>
                  <p className="text-xs text-muted-foreground">Invia al paziente {practice.notifyAppointmentHours}h prima</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Ore di anticipo</Label>
                <Input type="number" defaultValue={practice.notifyAppointmentHours} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Avviso fattura in scadenza</p>
                  <p className="text-xs text-muted-foreground">Notifica {practice.notifyInvoiceDays} giorni prima della scadenza</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Giorni di anticipo</Label>
                <Input type="number" defaultValue={practice.notifyInvoiceDays} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Riepilogo giornaliero</p>
                  <p className="text-xs text-muted-foreground">Ricevi un riepilogo ogni mattina</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Suggerimenti AI Coach</p>
                  <p className="text-xs text-muted-foreground">Ricevi suggerimenti personalizzati</p>
                </div>
                <Switch defaultChecked />
              </div>
            </>
          )}
        </div>

        <Button className="w-full" onClick={handleSave}>
          {saved ? <><Check size={14} /> Salvato</> : <><Save size={14} /> Salva modifiche</>}
        </Button>
      </div>
    </PageContainer>
  );
}
