import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function WeeklyBriefingCard() {
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isMonday = new Date().getDay() === 1;

  async function fetchBriefing() {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("weekly-briefing");
      if (fnError) throw fnError;
      if (data?.briefing) {
        setBriefingText(data.briefing);
        setLastUpdated(new Date());
      } else {
        throw new Error("Risposta vuota");
      }
    } catch (err: any) {
      console.error("[WeeklyBriefing]", err);
      setError("Impossibile generare il briefing. Riprova.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isMonday) {
      fetchBriefing();
    }
  }, []);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Brain size={18} className="text-accent" />
          Briefing della settimana
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBriefing}
          disabled={isLoading}
          className="text-xs h-8"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Aggiorna
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchBriefing} className="text-xs ml-2">
                Riprova
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && briefingText && (
          <div>
            <p className="text-[15px] leading-relaxed text-foreground">{briefingText}</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground text-right mt-3">
                Aggiornato: {lastUpdated.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })},{" "}
                {lastUpdated.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        )}

        {!isLoading && !error && !briefingText && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Il briefing viene generato automaticamente ogni lunedì. Clicca <strong>Aggiorna</strong> per generarne uno ora.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
