
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TestReminderPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  const runTest = async () => {
    setLoading(true);
    setLogs([]);
    addLog("Inizio test promemoria...");

    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non loggato");
      addLog(`Utente rilevato: ${user.email}`);

      // 2. Get practice profile
      const { data: profile } = await supabase
        .from('practice_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) throw new Error("Profilo professionale non trovato");
      addLog(`Profilo trovato: ${profile.id}`);

      // 3. Get or create a test patient
      // Let's just find the first patient
      const { data: patients } = await supabase
        .from('patients')
        .select('id, email, first_name')
        .eq('practice_profile_id', profile.id)
        .limit(1);
      
      let patientId = patients?.[0]?.id;
      if (!patientId) {
        addLog("Nessun paziente trovato. Ne creo uno di test...");
        const { data: newPatient, error: pError } = await supabase
          .from('patients')
          .insert({
            practice_profile_id: profile.id,
            first_name: "Test",
            last_name: "User",
            email: user.email // Send to yourself
          })
          .select()
          .single();
        if (pError) throw pError;
        patientId = newPatient.id;
      }
      addLog(`Paziente test: ${patientId}`);

      // 4. Create appointment in the window (exact 60 mins from now)
      const now = new Date();
      const startsAt = new Date(now.getTime() + 61 * 60_000); // 61 mins to be safe in the 55-65 range
      const endsAt = new Date(startsAt.getTime() + 30 * 60_000);

      addLog(`Creo appuntamento test alle ${startsAt.toLocaleTimeString()}...`);
      const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .insert({
          practice_profile_id: profile.id,
          patient_id: patientId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: 'confirmed',
          reminder_sent: false
        })
        .select()
        .single();
      
      if (apptError) throw apptError;
      addLog(`Appuntamento creato: ${appt.id}`);

      // 5. Trigger function
      addLog("Chiamata alla Edge Function send-appointment-reminders...");
      const { data: result, error: funcError } = await supabase.functions.invoke('send-appointment-reminders');
      
      if (funcError) throw funcError;
      
      addLog(`Risultato funzione: ${JSON.stringify(result)}`);
      
      if (result.sent > 0) {
        toast({
          title: "Test Riuscito!",
          description: "La funzione ha inviato il promemoria.",
        });
      } else {
        addLog("ATTENZIONE: La funzione ha restituito 0 invii. Verifica se l'appuntamento rientra nel range 55-65 minuti.");
      }

      // 6. Cleanup
      addLog("Pulizia dati di test...");
      await supabase.from('appointments').delete().eq('id', appt.id);
      addLog("Test completato.");

    } catch (err: any) {
      console.error(err);
      addLog(`ERRORE: ${err.message}`);
      toast({
        variant: "destructive",
        title: "Test Fallito",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Verifica Promemoria Appuntamenti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Questo test creerà un appuntamento fittizio tra circa 60 minuti e forzerà l'esecuzione della funzione di invio email.
          </p>
          
          <Button onClick={runTest} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Esecuzione test...</> : "Avvia Test"}
          </Button>

          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-semibold">Log di esecuzione:</h4>
            <div className="bg-muted p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <span className="text-muted-foreground">Nessun log disponibile. Premere "Avvia Test".</span>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
