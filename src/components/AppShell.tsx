// Multi-practitioner: not in MVP scope — no practice switcher UI; single profile loaded via PracticeProfileProvider.
import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { PracticeProfileProvider } from "@/hooks/PracticeProfileContext";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { SubscriptionBanner } from "./SubscriptionBanner";

export function AppShell() {
  return (
    <PracticeProfileProvider>
      <SubscriptionProvider>
        <div className="min-h-screen bg-background flex">
          <DesktopSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <SubscriptionBanner />
            <div className="md:hidden">
              <TopBar />
            </div>
            <Outlet />
            <BottomNav />
          </div>
        </div>
      </SubscriptionProvider>
    </PracticeProfileProvider>
  );
}
