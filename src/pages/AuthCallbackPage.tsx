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
    // Supabase automatically reads the URL hash if detectSessionInUrl: true
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          // Check if user has a practice profile
          const { data: profile } = await supabase
            .from("practice_profiles")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          navigate(profile ? "/dashboard" : "/onboarding", { replace: true });
        } catch {
          navigate("/dashboard", { replace: true });
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      } else {
        // Also fire off getSession just in case the event already happened before the listener was attached
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession && !session && event === 'INITIAL_SESSION') {
            // Only redirect to login if we explicitly know there's no session and it was the initial load
            // Otherwise wait for the hash to be processed
        }
      }
    });

    // Fallback: If after a short delay no event triggered the redirect and we have no session, go to login.
    const timeout = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setError("Sessione non trovata. Riprova ad accedere.");
            setTimeout(() => navigate("/login", { replace: true }), 2000);
        }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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
