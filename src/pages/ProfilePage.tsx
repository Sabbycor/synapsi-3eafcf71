import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Save, Check, Loader2, User } from "lucide-react";

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

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name || "");
        setOriginalName(data.full_name || "");
        setRole(data.role || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleNameChange = (value: string) => {
    setFullName(value);
    setDirty(value !== originalName);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user || !dirty) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Errore", description: "Impossibile salvare le modifiche. Riprova.", variant: "destructive" });
    } else {
      setOriginalName(fullName);
      setDirty(false);
      setSaved(true);
      toast({ title: "Profilo aggiornato", description: "Le modifiche sono state salvate." });
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
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
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user?.email || ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">L'email non può essere modificata da qui.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-role">Ruolo</Label>
            <Input id="profile-role" value={role || "—"} disabled className="opacity-60 capitalize" />
            <p className="text-[11px] text-muted-foreground/60 italic">Il ruolo è gestito dal sistema.</p>
          </div>

          <Button className="w-full gap-2" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? (
              <><Loader2 className="animate-spin" size={14} /> Salvataggio…</>
            ) : saved ? (
              <><Check size={14} /> Salvato</>
            ) : (
              <><Save size={14} /> Salva modifiche</>
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/5"
          onClick={handleLogout}
        >
          <LogOut size={16} /> Esci dall'account
        </Button>

        <p className="text-xs text-center text-muted-foreground">Synapsi v1.0</p>
      </div>
    </PageContainer>
  );
}
