import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { NotificationsForm } from "@/components/dashboard/notifications-form";

export const metadata = { title: "Notifications" };

export default async function NotificationsSettingsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .single();

  const prefs = (profile?.preferences ?? {}) as { notifications?: Record<string, boolean> };

  return (
    <SettingsSection title="Notifications" description="Pick what we ping you about and where.">
      <SettingsCard>
        <NotificationsForm initial={prefs.notifications} />
      </SettingsCard>
    </SettingsSection>
  );
}
