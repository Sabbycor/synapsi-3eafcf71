import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Star } from "lucide-react";

interface MicroFeedbackProps {
  contextAction: string;
  onDismiss: () => void;
}

export function MicroFeedback({ contextAction, onDismiss }: MicroFeedbackProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (selectedRating: number) => {
    if (!user) return;
    setRating(selectedRating);
    await supabase.from("feedback").insert({
      user_id: user.id,
      category: "micro_feedback",
      rating: selectedRating,
      context_action: contextAction,
    });
    setSubmitted(true);
    setTimeout(onDismiss, 1800);
  };

  if (submitted) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="rounded-xl border border-success/20 bg-card shadow-elevated px-5 py-3 text-center">
          <p className="text-sm font-medium text-success">Grazie per il feedback ✓</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in max-w-sm w-[90vw]">
      <div className="rounded-xl border border-border bg-card shadow-elevated p-4 space-y-3">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-foreground">Questo flusso ti ha fatto risparmiare tempo?</p>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1">
            <X size={14} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => handleSubmit(n)}
              onMouseEnter={() => setHoveredRating(n)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={24}
                className={
                  n <= (hoveredRating || rating)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }
              />
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground text-center">1 = per niente · 5 = molto</p>
      </div>
    </div>
  );
}
