import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  email: z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError("Errore nell'invio. Riprova.");
        setLoading(false);
        return;
      }
      setSent(true);
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
          <h1 className="font-display text-xl font-bold text-foreground mb-1">Recupera password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Inserisci la tua email per ricevere un link di reset
          </p>

          {sent ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary">
                <CheckCircle2 size={24} className="text-accent" />
              </div>
              <p className="text-sm text-foreground text-center font-medium">
                Email inviata con successo
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Controlla la tua casella di posta e segui il link per reimpostare la password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@esempio.it"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "forgot-email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="forgot-email-error" role="alert" className="text-xs text-destructive">
                    {errors.email.message}
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
                {loading ? "Invio in corso…" : "Invia link di reset"}
              </Button>
            </form>
          )}

        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={14} />
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}
