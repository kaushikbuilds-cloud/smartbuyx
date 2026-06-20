"use client";

import { useActionState } from "react";
import { createRfq, type RfqActionState } from "@/features/rfq/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function RfqForm() {
  const [state, action] = useActionState<RfqActionState, FormData>(createRfq, null);
  return (
    <form action={action} className="max-w-2xl space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Requirement title</Label>
        <Input id="title" name="title" required placeholder="e.g. 500 bags of OPC 53 cement" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Details</Label>
        <textarea id="description" name="description" rows={4}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Quantity, specs, delivery location, timeline..." />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} placeholder="600001" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="budgetMin">Budget min (₹)</Label>
          <Input id="budgetMin" name="budgetMin" type="number" min="0" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="budgetMax">Budget max (₹)</Label>
          <Input id="budgetMax" name="budgetMax" type="number" min="0" />
        </div>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <SubmitButton variant="gradient">Send to all suppliers</SubmitButton>
      <p className="text-xs text-muted-foreground">
        Your RFQ will be sent to up to 100 of the highest-trust-score suppliers in the area.
      </p>
    </form>
  );
}
