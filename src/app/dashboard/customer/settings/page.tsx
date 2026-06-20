import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/dashboard/page-shell";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  return (
    <PageShell title="Account Settings" description="Manage your profile and preferences.">
      <Card>
        <CardContent className="p-6">
          <ProfileForm initial={profile ?? { full_name: null, phone: null }} email={user.email ?? ""} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
