"use client";

import { useActionState } from "react";
import { addUpi, type PaymentMethodState } from "@/features/account/payment-methods";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function UpiForm() {
  const [state, action] = useActionState<PaymentMethodState, FormData>(addUpi, null);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" placeholder="e.g. GPay, Personal" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="upi_id">UPI ID</Label>
        <Input id="upi_id" name="upi_id" placeholder="yourname@upi" required />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save UPI</SubmitButton>
    </form>
  );
}
