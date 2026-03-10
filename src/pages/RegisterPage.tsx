import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").min(2, "Inserisci almeno 2 caratteri"),
  email: z.string().min(1, "L'email è obbligatoria").email("Inserisci un indirizzo email valido"),
  password: z.string().min(1, "La password è obbligatoria").min(6, "La password deve avere almeno 6 caratteri"),
  confirmPassword: z.string().min(1, "Conferma la password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      const { error } = await signUp(data.email, data.password, data.name);
      if (error) {
        setError(mapAuthError(error.message));
        setLoading(false);
        return;
      }
      toast({
        title: "Account creato",
        description: "Controlla la tua email per confermare la registrazione.",
      });
      setTimeout(() => navigate("/onboarding"), 1500);
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

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Nome completo</Label>
              <Input
                id="reg-name"
                autoComplete="name"
                placeholder="Dott. Mario Rossi"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "reg-name-error" : undefined}
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
                {...register("email")}
              />
              {errors.email && (
                <p id="reg-email-error" role="alert" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "reg-password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="reg-password-error" role="alert" className="text-xs text-destructive">
                  {errors.password.message}
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
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p id="reg-confirm-error" role="alert" className="text-xs text-destructive">
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
              {loading ? "Creazione in corso…" : "Crea account"}
            </Button>
          </form>
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
  return "Errore durante la registrazione. Riprova.";
}
