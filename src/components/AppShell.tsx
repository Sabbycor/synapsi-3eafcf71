import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar only on mobile */}
        <div className="md:hidden">
          <TopBar />
        </div>
        <Outlet />
        <BottomNav />
      </div>
    </div>
  );
}
