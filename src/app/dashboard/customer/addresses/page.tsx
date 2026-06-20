import { MapPin, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listAddresses } from "@/features/account/address-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/dashboard/page-shell";
import { AddressForm } from "@/components/shop/address-form";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const { user } = await requireUser();
  const addresses = await listAddresses(user.id);

  return (
    <PageShell title="My Addresses" description="Where should we deliver?">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold">Saved addresses ({addresses.length})</h2>
            {addresses.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <MapPin className="h-10 w-10" />
                <p>No addresses yet — add one to get started.</p>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-semibold">Add new address</h2>
            <AddressForm />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
