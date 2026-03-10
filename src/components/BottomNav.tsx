import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Calendar, User, MoreHorizontal, Receipt, CreditCard, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/patients", icon: Users, label: "Pazienti" },
  { path: "/calendar", icon: Calendar, label: "Agenda" },
  { path: "/profile", icon: User, label: "Profilo" },
];

const moreItems = [
  { path: "/invoices", icon: Receipt, label: "Fatture" },
  { path: "/payments", icon: CreditCard, label: "Pagamenti" },
  { path: "/tasks", icon: ListTodo, label: "Attività" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some(i => location.pathname.startsWith(i.path));

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 left-0 right-0 safe-bottom">
            <div className="mx-4 mb-2 rounded-xl border border-border bg-card shadow-elevated overflow-hidden animate-slide-up">
              {moreItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(item.path);
                      setShowMore(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                      isActive ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === "/patients" && location.pathname.startsWith("/patients"));
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setShowMore(false); }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("font-medium", isActive && "font-semibold")}>{item.label}</span>
              </button>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors",
              isMoreActive || showMore ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal size={20} strokeWidth={isMoreActive ? 2.5 : 2} />
            <span className={cn("font-medium", isMoreActive && "font-semibold")}>Altro</span>
          </button>
        </div>
      </nav>
    </>
  );
}
