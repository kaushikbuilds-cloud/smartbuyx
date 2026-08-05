"use client";

import { useActionState } from "react";
import { savePickupAddress, type PickupState, type PickupAddress } from "@/features/shipping/pickup-actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

export function PickupAddressForm({ existing }: { existing: PickupAddress }) {
  const [state, action] = useActionState<PickupState, FormData>(savePickupAddress, null);

  return (
    <form action={action} className="space-y-4">
      {existing?.pickup_registered ? (
        <p className="text-xs text-muted-foreground">
          ✓ Registered with our courier partner. Orders are picked up from this address. Re-saving updates it.
        </p>
      ) : (
        <p className="text-xs text-amber-600">
          Not set up yet — courier auto-booking will fail for your orders until you save a pickup address.
        </p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="name">Contact name</Label>
        <Input id="name" name="name" required defaultValue={existing?.pickup_name ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" inputMode="numeric" required placeholder="10-digit mobile" defaultValue={existing?.pickup_phone ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required defaultValue={existing?.pickup_email ?? ""} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="addressLine1">Address line 1</Label>
        <Input id="addressLine1" name="addressLine1" required defaultValue={existing?.pickup_address_line1 ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
        <Input id="addressLine2" name="addressLine2" defaultValue={existing?.pickup_address_line2 ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required defaultValue={existing?.pickup_city ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" required defaultValue={existing?.pickup_state ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" name="pincode" inputMode="numeric" required defaultValue={existing?.pickup_pincode ?? ""} />
        </div>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save pickup address</SubmitButton>
    </form>
  );
}
