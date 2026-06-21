import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { AccountForm } from "@/components/dashboard/account-form";
import { ResetPasswordButton } from "@/components/dashboard/security-actions";

export const metadata = { title: "Account Settings" };

export default async function AccountSettingsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, phone, date_of_birth")
    .eq("id", user.id)
    .single();

  return (
    <SettingsSection title="Account" description="Update your profile and personal details.">
      <SettingsCard title="Profile">
        <AccountForm
          email={user.email ?? ""}
          initial={{
            full_name: profile?.full_name ?? null,
            username: profile?.username ?? null,
            phone: profile?.phone ?? null,
            date_of_birth: profile?.date_of_birth ?? null,
          }}
        />
      </SettingsCard>

      <SettingsCard title="Password" description="We'll email you a secure link to set a new password.">
        <ResetPasswordButton />
      </SettingsCard>

      <SettingsCard title="Two-Factor Authentication" description="Adds a second verification step at login.">
        <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          Coming soon. We&apos;ll support authenticator apps (TOTP) and SMS OTP.
        </p>
      </SettingsCard>
    </SettingsSection>
  );
}
