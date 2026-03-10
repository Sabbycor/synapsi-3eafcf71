import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido"),
  password: z.string().min(1, "La password è obbligatoria").min(6, "La password deve avere almeno 6 caratteri"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading, signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
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

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="nome@esempio.it"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "login-email-error" : undefined}
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

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Password dimenticata?
            </Link>
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
