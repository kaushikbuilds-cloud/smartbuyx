import { getSession } from "@/lib/auth/guards";
import { getMode } from "@/features/preferences/mode";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

// Renders the right chrome based on auth: dashboard sidebar+header when
// logged in, marketing navbar+footer when logged out. Used by every
// app-facing route group so the shell stays consistent.
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    );
  }

  const mode = await getMode();
  const isAdminTier = session.role === "admin" || session.role === "superadmin";
  return (
    <div className="flex min-h-screen bg-muted/30">
      <DashboardSidebar mode={mode} isAdminTier={isAdminTier} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader mode={mode} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
