import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { PracticeProfileProvider } from "@/hooks/PracticeProfileContext";

export function AppShell() {
  return (
    <PracticeProfileProvider>
      <div className="min-h-screen bg-background flex">
        <DesktopSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="md:hidden">
            <TopBar />
          </div>
          <Outlet />
          <BottomNav />
        </div>
      </div>
    </PracticeProfileProvider>
  );
}
