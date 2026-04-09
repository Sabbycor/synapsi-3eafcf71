import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AtRiskPatient {
  id: string;
  first_name: string;
  last_name: string;
  days_since_last: number;
  total_appointments: number;
  last_appointment_date: string;
  last_contacted_at: string | null;
  suggested_message: string;
}

export function useAtRiskPatients() {
  const [patients, setPatients] = useState<AtRiskPatient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAtRiskPatients() {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("at-risk-patients");
      if (fnError) throw fnError;
      setPatients(data?.patients ?? []);
    } catch (err: any) {
      console.error("[useAtRiskPatients]", err);
      setError(err.message || "Errore nel caricamento");
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsContacted(patientId: string) {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("patients")
      .update({ last_contacted_at: now } as any)
      .eq("id", patientId);

    if (updateError) throw updateError;

    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, last_contacted_at: now } : p))
    );
  }

  return { patients, isLoading, error, fetchAtRiskPatients, markAsContacted };
}
