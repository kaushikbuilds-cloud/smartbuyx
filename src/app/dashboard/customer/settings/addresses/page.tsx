import { MapPin, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listAddresses } from "@/features/account/address-queries";
import { Badge } from "@/components/ui/badge";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { AddressForm } from "@/components/shop/address-form";

export const metadata = { title: "Addresses" };

export default async function AddressesSettingsPage() {
  const { user } = await requireUser();
  const addresses = await listAddresses(user.id);

  return (
    <SettingsSection title="Addresses" description="Where should we deliver?">
      <SettingsCard title={`Saved addresses (${addresses.length})`}>
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <MapPin className="h-10 w-10" />
            <p>No addresses saved yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{a.label ?? a.line1}</div>
                  {a.is_default ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Default
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard title="Add new address">
        <AddressForm />
      </SettingsCard>
    </SettingsSection>
  );
}
