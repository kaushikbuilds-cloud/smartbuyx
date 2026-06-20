import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/guards";
import { getMode } from "@/features/preferences/mode";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerDashboardHome } from "@/components/dashboard/customer-dashboard-home";
import { BuildDashboardHome } from "@/components/dashboard/build-dashboard-home";
import { MarketingLanding } from "@/components/marketing/landing";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    return (
      <AppShell>
        <MarketingLanding />
      </AppShell>
    );
  }

  const [supabase, mode] = await Promise.all([createClient(), getMode()]);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .single();
  const firstName = (profile?.full_name ?? session.user.email ?? "there").split(" ")[0];

  return (
    <AppShell>
      {mode === "build" ? (
        <BuildDashboardHome userId={session.user.id} firstName={firstName} />
      ) : (
        <CustomerDashboardHome userId={session.user.id} firstName={firstName} />
      )}
    </AppShell>
  );
}
