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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Multi-practitioner: not in MVP scope — no role selector at signup; role locked to solo practitioner.
const schema = z.object({
  name: z.string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "Il nome è obbligatorio").min(2, "Inserisci almeno 2 caratteri")),
  email: z.string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido")),
  password: z.string().min(1, "La password è obbligatoria").min(6, "La password deve avere almeno 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma la password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

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
    try {
      const { error, fakeSignup } = await signUp(data.email, data.password, data.name);
      if (error) {
        setError(mapAuthError(error.message));
        setLoading(false);
        return;
      }

      // Detect fake signup (email already registered, Supabase hides the error)
      if (fakeSignup) {
        setError("Questa email è già registrata. Prova ad accedere.");
        setLoading(false);
        return;
      }

      // Check if a session was created (auto-confirm enabled) or email confirmation is needed
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        toast({
          title: "Account creato",
          description: "Benvenuto in Synapsi!",
        });
        navigate("/onboarding", { replace: true });
      } else {
        setEmailSent(true);
        toast({
          title: "Account creato",
          description: "Controlla la tua email per confermare la registrazione.",
        });
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
          <h1 className="font-display text-xl font-bold text-foreground mb-1">Crea il tuo account</h1>
          <p className="text-sm text-muted-foreground mb-6">Inizia a usare Synapsi in pochi minuti</p>

          {emailSent ? (
            <div className="space-y-4 text-center py-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary mx-auto">
                <Sparkles size={24} className="text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">Controlla la tua email</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ti abbiamo inviato un link di conferma. Clicca sul link per attivare il tuo account.
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full gap-2 mt-2">
                  Torna al login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Nome completo</Label>
                <Input
                  id="reg-name"
                  autoComplete="name"
                  autoFocus
                  placeholder="Dott. Mario Rossi"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "reg-name-error" : undefined}
                  disabled={loading}
                  {...register("name")}
                />
                {errors.name && (
                  <p id="reg-name-error" role="alert" className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@esempio.it"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "reg-email-error" : undefined}
                  disabled={loading}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="reg-email-error" role="alert" className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "reg-password-error" : "reg-password-hint"}
                    disabled={loading}
                    {...register("password")}
                  />
                  {errors.password ? (
                    <p id="reg-password-error" role="alert" className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  ) : (
                    <p id="reg-password-hint" className="text-xs text-muted-foreground">
                      Almeno 6 caratteri
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-confirm">Conferma password</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "reg-confirm-error" : undefined}
                    disabled={loading}
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p id="reg-confirm-error" role="alert" className="text-xs text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="animate-spin" size={16} />}
                {loading ? "Creazione in corso…" : "Crea account"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Hai già un account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}

function mapAuthError(msg: string): string {
  if (msg.includes("User already registered")) return "Questa email è già registrata.";
  if (msg.includes("Password should be at least")) return "La password deve avere almeno 6 caratteri.";
  if (msg.includes("Unable to validate email")) return "Indirizzo email non valido.";
  if (msg.includes("Too many requests")) return "Troppi tentativi. Riprova tra qualche minuto.";
  if (msg.includes("Signups not allowed")) return "Le registrazioni non sono attive al momento.";
  return "Errore durante la registrazione. Riprova.";
}
