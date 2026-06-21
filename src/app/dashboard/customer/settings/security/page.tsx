import { Smartphone, Download, Shield } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { ResetPasswordButton, DeleteAccountButton } from "@/components/dashboard/security-actions";

export const metadata = { title: "Security" };

export default async function SecuritySettingsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: devices } = await supabase
    .from("user_devices")
    .select("id, device_id, platform, last_seen_at, created_at")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false })
    .limit(10);

  return (
    <SettingsSection title="Privacy &amp; Security" description="Sign-in activity, sessions and account controls.">
      <SettingsCard title="Login activity">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Current session</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Active now
          </span>
        </div>
      </SettingsCard>

      <SettingsCard title="Active devices">
        {(devices ?? []).length === 0 ? (
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            No devices registered yet. We&apos;ll list mobile and web sessions here once you sign in from the apps.
          </p>
        ) : (
          <ul className="space-y-2">
            {(devices ?? []).map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">{d.platform ?? "Web"}</p>
                  <p className="text-xs text-muted-foreground">
                    Last seen {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString("en-IN") : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard title="Change password" description="Sends a secure reset link to your email.">
        <ResetPasswordButton />
      </SettingsCard>

      <SettingsCard title="Two-Factor Authentication">
        <div className="flex items-start gap-3 rounded-lg border p-3">
          <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Not enabled</p>
            <p className="text-xs text-muted-foreground">
              Authenticator-app and SMS OTP support is rolling out next month.
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Download my data" description="Get a JSON export of your orders, addresses, reviews and wishlist.">
        <Button variant="outline" disabled>
          <Download className="h-4 w-4" /> Request export (DPDP-ready, coming soon)
        </Button>
      </SettingsCard>

      <SettingsCard title="Danger zone" description="Permanent and irreversible.">
        <DeleteAccountButton />
      </SettingsCard>
    </SettingsSection>
  );
}
