"use client";

import { useActionState } from "react";
import { savePayoutDetails, type PayoutState } from "@/features/seller/verification";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

type Existing = {
  account_holder: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  upi_id: string | null;
  verified: boolean;
} | null;

export function PayoutDetailsForm({ existing }: { existing: Existing }) {
  const [state, action] = useActionState<PayoutState, FormData>(savePayoutDetails, null);

  return (
    <form action={action} className="space-y-4">
      {existing ? (
        <p className="text-xs text-muted-foreground">
          {existing.verified ? "✓ Verified. " : "Pending verification. "}
          Re-submitting will reset verification.
        </p>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="accountHolder">Account holder name</Label>
        <Input id="accountHolder" name="accountHolder" required defaultValue={existing?.account_holder ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="bankName">Bank name</Label>
        <Input id="bankName" name="bankName" required defaultValue={existing?.bank_name ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="accountNumber">Account number</Label>
          <Input id="accountNumber" name="accountNumber" inputMode="numeric" required defaultValue={existing?.account_number ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmAccountNumber">Confirm account number</Label>
          <Input id="confirmAccountNumber" name="confirmAccountNumber" inputMode="numeric" required defaultValue={existing?.account_number ?? ""} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ifsc">IFSC code</Label>
          <Input id="ifsc" name="ifsc" required placeholder="e.g. HDFC0001234" defaultValue={existing?.ifsc ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="upiId">UPI ID (optional)</Label>
          <Input id="upiId" name="upiId" placeholder="name@bank" defaultValue={existing?.upi_id ?? ""} />
        </div>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save payout details</SubmitButton>
    </form>
  );
}
