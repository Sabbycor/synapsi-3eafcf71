import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  password: z.string().min(1, "La password è obbligatoria").min(6, "La password deve avere almeno 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma la password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const recoveryDetected = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryDetected.current = true;
        setValidToken(true);
      }
    });

    // Give the SDK time to process the hash fragment and fire PASSWORD_RECOVERY
    const timeout = setTimeout(() => {
      if (!recoveryDetected.current) {
        setValidToken(false);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) {
        setError(error.message.includes("same_password")
          ? "La nuova password deve essere diversa dalla precedente."
          : "Errore nell'aggiornamento. Riprova.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
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
          <h1 className="font-display text-xl font-bold text-foreground mb-1">Nuova password</h1>
          <p className="text-sm text-muted-foreground mb-6">Scegli una nuova password per il tuo account</p>

          {validToken === null && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {validToken === false && (
            <div className="space-y-4">
              <div role="alert" className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                Il link di reset è scaduto o non è valido. Richiedi un nuovo link.
              </div>
              <Link to="/forgot-password">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft size={14} /> Richiedi nuovo link
                </Button>
              </Link>
            </div>
          )}

          {validToken === true && !success && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-password">Nuova password</Label>
                <Input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "reset-pw-error" : undefined}
                  disabled={loading}
                  {...register("password")}
                />
                {errors.password && (
                  <p id="reset-pw-error" role="alert" className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm">Conferma password</Label>
                <Input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "reset-confirm-error" : undefined}
                  disabled={loading}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p id="reset-confirm-error" role="alert" className="text-xs text-destructive">
                    {errors.confirmPassword.message}
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
                {loading ? "Aggiornamento…" : "Aggiorna password"}
              </Button>
            </form>
          )}

          {success && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary">
                <CheckCircle2 size={24} className="text-accent" />
              </div>
              <p className="text-sm text-foreground text-center font-medium">Password aggiornata</p>
              <p className="text-xs text-muted-foreground text-center">
                Verrai reindirizzato alla dashboard tra pochi secondi.
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={14} /> Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}
