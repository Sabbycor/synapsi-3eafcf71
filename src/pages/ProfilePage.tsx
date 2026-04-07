import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, Check, Loader2, User, AlertCircle, Shield, MessageSquare, Download, CreditCard, ExternalLink } from "lucide-react";
import { SupportInbox } from "@/components/SupportInbox";
import { ExportDrawer } from "@/components/ExportDrawer";
import { useSubscription } from "@/hooks/useSubscription";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [originalName, setOriginalName] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [nameError, setNameError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { isPremium } = useSubscription();

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(false);
    setProfileMissing(false);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setFetchError(true);
        setFullName(user.user_metadata?.full_name || "");
        setOriginalName(user.user_metadata?.full_name || "");
      } else if (!data) {
        setProfileMissing(true);
        setFullName(user.user_metadata?.full_name || "");
        setOriginalName(user.user_metadata?.full_name || "");
      } else {
        setFullName(data.full_name || "");
        setOriginalName(data.full_name || "");
        setRole(data.role || "");
      }
    } catch {
      setFetchError(true);
      setFullName(user.user_metadata?.full_name || "");
      setOriginalName(user.user_metadata?.full_name || "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleNameChange = (value: string) => {
    setFullName(value);
    setDirty(value !== originalName);
    setSaved(false);
    setNameError("");
  };

  const handleSave = async () => {
    if (!user || !dirty) return;
    const trimmed = fullName.trim();
    if (trimmed.length < 2) {
      setNameError("Il nome deve avere almeno 2 caratteri.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ full_name: trimmed })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Errore", description: "Impossibile salvare le modifiche. Riprova.", variant: "destructive" });
    } else {
      setFullName(trimmed);
      setOriginalName(trimmed);
      setDirty(false);
      setSaved(true);
      toast({ title: "Profilo aggiornato", description: "Le modifiche sono state salvate." });
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      toast({ title: "Errore", description: "Impossibile effettuare il logout. Riprova.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
        {fetchError && (
          <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>Impossibile caricare il profilo.</span>
              <button onClick={fetchProfile} className="ml-1 underline font-medium hover:no-underline">Riprova</button>
            </div>
          </div>
        )}
        {profileMissing && !fetchError && (
          <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Il profilo utente non è stato trovato nel database. Contatta l'assistenza se il problema persiste.</span>
          </div>
        )}

        {/* Profile card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shrink-0" aria-hidden="true">
            <User size={24} className="text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-foreground truncate">{fullName || "Utente"}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            {role && <p className="text-xs text-muted-foreground capitalize mt-0.5">{role}</p>}
          </div>
        </div>

        {/* Edit form */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nome completo</Label>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              autoComplete="name"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "profile-name-error" : undefined}
              disabled={profileMissing || saving}
            />
            {nameError && (
              <p id="profile-name-error" role="alert" className="text-xs text-destructive">{nameError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user?.email || ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">L'email non può essere modificata da qui.</p>
          </div>
          {role && (
            <div className="space-y-1.5">
              <Label htmlFor="profile-role">Ruolo</Label>
              <Input id="profile-role" value={role} disabled className="opacity-60 capitalize" />
            </div>
          )}

          <Button className="w-full gap-2" onClick={handleSave} disabled={saving || !dirty || profileMissing}>
            {saving ? (
              <><Loader2 className="animate-spin" size={14} /> Salvataggio…</>
            ) : saved ? (
              <><Check size={14} /> Salvato</>
            ) : (
              <><Save size={14} /> Salva modifiche</>
            )}
          </Button>
        </div>

        {/* Quick links */}
        <div className="rounded-xl border border-border bg-card shadow-card divide-y divide-border">
          <button onClick={() => setExportOpen(true)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors">
            <Download size={16} className="text-accent shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Esporta dati</p>
              <p className="text-xs text-muted-foreground">CSV per commercialista e Sistema TS</p>
            </div>
          </button>
          <button onClick={() => navigate("/audit-log")} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors">
            <Shield size={16} className="text-accent shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Audit & Log accessi</p>
              <p className="text-xs text-muted-foreground">Registro operazioni per compliance</p>
            </div>
          </button>
          <button onClick={() => setSupportOpen(true)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors">
            <MessageSquare size={16} className="text-accent shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Segnala un problema</p>
              <p className="text-xs text-muted-foreground">Bug, suggerimenti, feedback</p>
            </div>
          </button>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/5"
          onClick={handleLogout}
        >
          <LogOut size={16} /> Esci dall'account
        </Button>

        <p className="text-xs text-center text-muted-foreground">Synapsi v1.0</p>

        <SupportInbox open={supportOpen} onOpenChange={setSupportOpen} />
        <ExportDrawer open={exportOpen} onOpenChange={setExportOpen} />
      </div>
    </PageContainer>
  );
}
