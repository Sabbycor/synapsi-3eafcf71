import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import posthog from "posthog-js";
import { supabase } from "@/integrations/supabase/client";
import { capturePostHog, identifyPostHog, resetPostHog } from "@/lib/posthogAnalytics";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; fakeSignup?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
<<<<<<< HEAD
          identifyPostHog(session.user.id, {
=======
          posthog.identify(session.user.id, {
>>>>>>> cursor/posthog-synapsi-e4253
            email: session.user.email,
            subscription_status: session.user.user_metadata?.subscription_status ?? "trial",
            trial_end_date: session.user.user_metadata?.trial_end_date ?? null,
          });
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        identifyPostHog(session.user.id, {
          email: session.user.email,
          subscription_status: session.user.user_metadata?.subscription_status ?? "trial",
          trial_end_date: session.user.user_metadata?.trial_end_date ?? null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    // Supabase returns a fake user with empty identities when email is already registered
    // and email confirmation is enabled (to prevent email enumeration)
    const fakeSignup = !error && data?.user?.identities?.length === 0;
    return { error: error as Error | null, fakeSignup };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
<<<<<<< HEAD
    capturePostHog("user_logged_out");
    resetPostHog();
=======
    posthog.capture("user_logged_out");
    posthog.reset();
>>>>>>> cursor/posthog-synapsi-e4253
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
