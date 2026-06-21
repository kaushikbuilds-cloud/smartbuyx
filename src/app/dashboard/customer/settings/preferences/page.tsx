import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { PreferencesForm } from "@/components/dashboard/preferences-form";

export const metadata = { title: "Preferences" };

export default async function PreferencesSettingsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .single();

  const prefs = (profile?.preferences ?? {}) as { ui?: { language?: string; currency?: string; region?: string } };

  return (
    <SettingsSection title="Preferences" description="Make SmartBuyX feel like home.">
      <SettingsCard>
        <PreferencesForm initial={prefs.ui as never} />
      </SettingsCard>
    </SettingsSection>
  );
}
