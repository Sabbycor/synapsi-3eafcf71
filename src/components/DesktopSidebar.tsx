import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNavItems, profileNavItem } from "./navConfig";

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === "/patients" && location.pathname.startsWith("/patients")) ||
    (path === "/appointments" && location.pathname.startsWith("/appointments"));

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Sparkles size={16} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">AURA</span>
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile at bottom */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <button
          onClick={() => navigate(profileNavItem.path)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive(profileNavItem.path)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <profileNavItem.icon size={18} />
          <span>{profileNavItem.label}</span>
        </button>
      </div>
    </aside>
  );
}
