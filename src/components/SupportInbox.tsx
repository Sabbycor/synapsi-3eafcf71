import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "bug", label: "Bug / Errore tecnico" },
  { value: "confusione", label: "Confusione nell'interfaccia" },
  { value: "funzione_mancante", label: "Funzione mancante" },
  { value: "dato_fiscale", label: "Problema dato fiscale" },
  { value: "reminder_inutile", label: "Reminder inutile" },
];

interface SupportInboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportInbox({ open, onOpenChange }: SupportInboxProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!user || !category) return;
    setSaving(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      category,
      message: message.trim() || null,
      context_action: "support_inbox",
    });

    if (error) {
      toast.error("Errore invio feedback");
      console.error(error);
    } else {
      toast.success("Feedback inviato — grazie!");
      setCategory("");
      setMessage("");
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Segnala un problema</DrawerTitle>
          <DrawerDescription>Aiutaci a migliorare Synapsi</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 space-y-4">
          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Seleziona categoria" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrizione (opzionale)</Label>
            <Textarea
              placeholder="Descrivi il problema o suggerimento..."
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 500))}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
          </div>
        </div>
        <DrawerFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={saving || !category}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Invio...</> : "Invia segnalazione"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Annulla</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
