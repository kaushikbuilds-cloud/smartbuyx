"use client";

import { useActionState } from "react";
import { addAddress, type AddressActionState } from "@/features/account/address-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function AddressForm() {
  const [state, action] = useActionState<AddressActionState, FormData>(addAddress, null);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-2">
        <Label htmlFor="line1">Address line 1</Label>
        <Input id="line1" name="line1" required placeholder="Flat / House no, Street" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="line2">Address line 2</Label>
        <Input id="line2" name="line2" placeholder="Area, Landmark (optional)" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" name="pincode" required inputMode="numeric" maxLength={6} />
        </div>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="outline">Save address</SubmitButton>
    </form>
  );
}
