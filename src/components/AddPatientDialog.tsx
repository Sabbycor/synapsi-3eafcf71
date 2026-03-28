import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { auditPatientCreated } from "@/lib/auditLog";
import { usePracticeProfileId } from "@/hooks/PracticeProfileContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const initialForm = {
  first_name: "",
  last_name: "",
  tax_code: "",
  email: "",
  phone: "",
  birth_date: "",
  address: "",
  city: "",
  notes_admin: "",
  status: "active",
};

export function AddPatientDialog({ open, onOpenChange, onSuccess }: AddPatientDialogProps) {
  const practiceProfileId = usePracticeProfileId();
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast({ title: "Campi obbligatori", description: "Nome e cognome sono richiesti.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      practice_profile_id: practiceProfileId,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      tax_code: form.tax_code.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      phone: form.phone.trim() || null,
      birth_date: form.birth_date || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      notes_admin: form.notes_admin.trim() || null,
      status: form.status,
    };

    console.log("[AddPatient] Inserting:", payload);
    const { data, error } = await supabase.from("patients").insert(payload).select();
    console.log("[AddPatient] Response:", { data, error });

    setSaving(false);

    if (error) {
      toast({ title: "Errore creazione paziente", description: error.message, variant: "destructive" });
      return;
    }

    if (data?.[0]) await auditPatientCreated(data[0].id, `${form.first_name} ${form.last_name}`);
    toast({ title: "Paziente aggiunto", description: `${form.first_name} ${form.last_name} è stato creato.` });
    setForm(initialForm);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Nuovo paziente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-first">Nome *</Label>
              <Input id="ap-first" autoFocus value={form.first_name} onChange={e => set("first_name", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-last">Cognome *</Label>
              <Input id="ap-last" value={form.last_name} onChange={e => set("last_name", e.target.value)} disabled={saving} />
            </div>
          </div>

          {/* Tax code */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-tax">Codice fiscale</Label>
            <Input id="ap-tax" value={form.tax_code} onChange={e => set("tax_code", e.target.value.toUpperCase())} maxLength={16} disabled={saving} />
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-email">Email</Label>
              <Input id="ap-email" type="email" value={form.email} onChange={e => set("email", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-phone">Telefono</Label>
              <Input id="ap-phone" type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} disabled={saving} />
            </div>
          </div>

          {/* Birth date */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-birth">Data di nascita</Label>
            <Input id="ap-birth" type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} disabled={saving} />
          </div>

          {/* Address row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ap-address">Indirizzo</Label>
              <Input id="ap-address" value={form.address} onChange={e => set("address", e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-city">Città</Label>
              <Input id="ap-city" value={form.city} onChange={e => set("city", e.target.value)} disabled={saving} />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Stato</Label>
            <Select value={form.status} onValueChange={v => set("status", v)} disabled={saving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Attivo</SelectItem>
                <SelectItem value="inactive">Inattivo</SelectItem>
                <SelectItem value="archived">Archiviato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="ap-notes">Note amministrative</Label>
            <Textarea id="ap-notes" rows={3} value={form.notes_admin} onChange={e => set("notes_admin", e.target.value)} disabled={saving} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annulla</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin mr-1" />}
              Salva paziente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
