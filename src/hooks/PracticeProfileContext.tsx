// Multi-practitioner: not in MVP scope — context provides the single practiceProfileId.
import { createContext, useContext, ReactNode } from "react";
import { usePracticeProfile } from "./usePracticeProfile";
import { Loader2 } from "lucide-react";

interface PracticeProfileContextType {
  practiceProfileId: string;
}

const PracticeProfileContext = createContext<PracticeProfileContextType | undefined>(undefined);

export function PracticeProfileProvider({ children }: { children: ReactNode }) {
  const { practiceProfileId, loading, error } = usePracticeProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !practiceProfileId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive font-medium">Errore inizializzazione profilo</p>
          <p className="text-xs text-muted-foreground">{error ?? "Impossibile creare il profilo studio."}</p>
        </div>
      </div>
    );
  }

  return (
    <PracticeProfileContext.Provider value={{ practiceProfileId }}>
      {children}
    </PracticeProfileContext.Provider>
  );
}

export function usePracticeProfileId(): string {
  const ctx = useContext(PracticeProfileContext);
  if (!ctx) throw new Error("usePracticeProfileId must be used within PracticeProfileProvider");
  return ctx.practiceProfileId;
}
