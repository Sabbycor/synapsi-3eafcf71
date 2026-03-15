import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

// Multi-practitioner: not in MVP scope — no practice selector at login; single profile auto-resolved.
const schema = z.object({
  email: z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido"),
  password: z.string().min(1, "La password è obbligatoria").min(6, "La password deve avere almeno 6 caratteri"),
});

type FormData = z.infer<typeof schema>;

const magicLinkSchema = z.object({
  email: z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido"),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading, signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Magic link state
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const {
    register: registerMagic,
    handleSubmit: handleMagicSubmit,
    formState: { errors: magicErrors },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    mode: "onBlur",
  });

  // Show nothing while checking auth to prevent form flash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Redirect already-authenticated users
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    const trimmedEmail = data.email.trim().toLowerCase();
    try {
      const { error } = await signIn(trimmedEmail, data.password);
      if (error) {
        setError(mapAuthError(error.message));
        setLoading(false);
        return;
      }
      // signIn already sets session via onAuthStateChange; use returned session user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("practice_profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        navigate(profile ? "/dashboard" : "/onboarding", { replace: true });
      } else {
        // Fallback — session should exist after signInWithPassword
        navigate("/dashboard", { replace: true });
      }
    } catch {
      setError("Errore di rete. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  const onMagicLinkSubmit = async (data: MagicLinkFormData) => {
    setMagicLoading(true);
    setMagicError("");
    setMagicSent(false);
    const trimmedEmail = data.email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMagicError(mapMagicLinkError(error.message));
      } else {
        setMagicSent(true);
      }
    } catch {
      setMagicError("Errore di rete. Riprova più tardi.");
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
            <Sparkles size={20} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl text-foreground">Synapsi</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h1 className="font-display text-xl font-bold text-foreground mb-1">Bentornato</h1>
          <p className="text-sm text-muted-foreground mb-6">Accedi al tuo account per continuare</p>

          {/* ── Email + Password form ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="nome@esempio.it"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                disabled={loading}
                {...register("email")}
              />
              {errors.email && (
                <p id="login-email-error" role="alert" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                disabled={loading}
                {...register("password")}
              />
              {errors.password && (
                <p id="login-password-error" role="alert" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? "Accesso in corso…" : "Accedi"}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border text-center">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Password dimenticata?
            </Link>
          </div>

          {/* ── Magic Link section ── */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">oppure</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Accedi con Magic Link</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nessuna password necessaria — ti invieremo un link sicuro via email.
                </p>
              </div>

              {magicSent ? (
                <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 text-center space-y-1 animate-fade-in">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 mx-auto mb-2">
                    <Mail size={18} className="text-accent" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Controlla la tua email</p>
                  <p className="text-xs text-muted-foreground">
                    Ti abbiamo inviato un link di accesso. Clicca sul link per entrare.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMagicSent(false)}
                    className="text-xs text-primary hover:underline mt-2"
                  >
                    Invia di nuovo
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicSubmit(onMagicLinkSubmit)} noValidate className="space-y-3">
                  <div className="space-y-1.5">
                    <Input
                      id="magic-email"
                      type="email"
                      autoComplete="email"
                      placeholder="nome@esempio.it"
                      aria-invalid={!!magicErrors.email}
                      aria-describedby={magicErrors.email ? "magic-email-error" : undefined}
                      disabled={magicLoading}
                      {...registerMagic("email")}
                    />
                    {magicErrors.email && (
                      <p id="magic-email-error" role="alert" className="text-xs text-destructive">
                        {magicErrors.email.message}
                      </p>
                    )}
                  </div>

                  {magicError && (
                    <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                      {magicError}
                    </div>
                  )}

                  <Button type="submit" variant="outline" className="w-full gap-2" disabled={magicLoading}>
                    {magicLoading ? (
                      <><Loader2 className="animate-spin" size={16} /> Invio in corso…</>
                    ) : (
                      <><Mail size={16} /> Invia Magic Link</>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Non hai un account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}

function mapAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email o password non corretti.";
  if (msg.includes("Email not confirmed")) return "Conferma la tua email prima di accedere.";
  if (msg.includes("Too many requests")) return "Troppi tentativi. Riprova tra qualche minuto.";
  return "Errore di autenticazione. Riprova.";
}

function mapMagicLinkError(msg: string): string {
  if (msg.includes("Too many requests")) return "Troppi tentativi. Riprova tra qualche minuto.";
  if (msg.includes("Unable to validate email")) return "Indirizzo email non valido.";
  if (msg.includes("Email rate limit")) return "Troppi tentativi. Riprova tra qualche minuto.";
  return "Errore nell'invio del link. Riprova.";
}
