import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PracticeProfile {
  id: string;
  user_id: string;
  practice_name: string | null;
  professional_name: string | null;
}

export function usePracticeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PracticeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function ensureProfile() {
      setLoading(true);
      setError(null);

      try {
        // 1. Try to fetch existing profile
        const { data: existing, error: fetchErr } = await supabase
          .from("practice_profiles")
          .select("id, user_id, practice_name, professional_name")
          .eq("user_id", user!.id)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (existing) {
          if (!cancelled) setProfile(existing);
          return;
        }

        // 2. None found — create one
        const { data: created, error: insertErr } = await supabase
          .from("practice_profiles")
          .insert({
            user_id: user!.id,
            practice_name: "Il mio studio",
            professional_name: user!.user_metadata?.full_name || "",
          })
          .select("id, user_id, practice_name, professional_name")
          .single();

        if (insertErr) throw insertErr;

        if (!cancelled) setProfile(created);
      } catch (err: any) {
        console.error("usePracticeProfile error:", err);
        if (!cancelled) setError(err.message ?? "Errore caricamento profilo studio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    ensureProfile();
    return () => { cancelled = true; };
  }, [user]);

  return { profile, practiceProfileId: profile?.id ?? null, loading, error };
}
