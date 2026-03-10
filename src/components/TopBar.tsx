import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container max-w-xl md:max-w-4xl mx-auto flex items-center justify-between h-14 px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Sparkles size={16} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">Synapsi</span>
        </button>
      </div>
    </header>
  );
}
