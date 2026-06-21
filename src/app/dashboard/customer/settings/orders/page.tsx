import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { listAddresses } from "@/features/account/address-queries";
import { Button } from "@/components/ui/button";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { OrderPrefsForm } from "@/components/dashboard/order-prefs-form";

export const metadata = { title: "Order Preferences" };

export default async function OrderPrefsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, addresses] = await Promise.all([
    supabase.from("profiles").select("preferences").eq("id", user.id).single(),
    listAddresses(user.id),
  ]);

  const prefs = (profile?.preferences ?? {}) as { orders?: { delivery_window?: "anytime"; default_address_id?: string | null } };

  return (
    <SettingsSection title="Order Preferences" description="Delivery, defaults and returns.">
      <SettingsCard>
        <OrderPrefsForm
          initial={prefs.orders as never}
          addresses={addresses.map((a) => ({ id: a.id, line1: a.line1, city: a.city }))}
        />
      </SettingsCard>

      <SettingsCard title="Return preferences" description="Default return window and refund destination.">
        <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          We allow returns within <strong>7 days</strong> of delivery. Refunds always credit to your <strong>SmartBuyX wallet</strong> — you can withdraw to your default UPI anytime.
        </p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/customer/returns">View my returns</Link>
        </Button>
      </SettingsCard>
    </SettingsSection>
  );
}
