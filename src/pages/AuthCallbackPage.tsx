import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Handles Supabase auth redirects (magic link, email confirmation, password recovery).
 * Reads token from URL hash, exchanges it for a session, then redirects accordingly.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase automatically exchanges the hash fragment for a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Auth callback error:", sessionError);
          setError("Link non valido o scaduto. Riprova.");
          setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }

        if (!session) {
          setError("Sessione non trovata. Riprova ad accedere.");
          setTimeout(() => navigate("/login", { replace: true }), 3000);
          return;
        }

        // Check if user has a practice profile — if not, send to onboarding
        const { data: profile } = await supabase
          .from("practice_profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        navigate(profile ? "/dashboard" : "/onboarding", { replace: true });
      } catch {
        setError("Errore durante l'autenticazione. Riprova.");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      {error ? (
        <div className="text-center space-y-2 animate-fade-in">
          <p className="text-sm text-destructive font-medium">{error}</p>
          <p className="text-xs text-muted-foreground">Reindirizzamento al login…</p>
        </div>
      ) : (
        <>
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-muted-foreground">Autenticazione in corso…</p>
        </>
      )}
    </div>
  );
}
