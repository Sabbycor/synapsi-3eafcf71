import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Outlet />
      <BottomNav />
    </div>
  );
}
