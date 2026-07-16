"use client";

import { useActionState } from "react";
import { initiateReturn, type ReturnActionState } from "@/features/orders/returns";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";
import { ReturnProofUploader } from "@/components/shop/return-proof-uploader";

const REASONS = [
  { value: "damaged", label: "Damaged in delivery" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "not_as_described", label: "Not as described" },
  { value: "size_fit", label: "Size / fit issue" },
  { value: "no_longer_needed", label: "No longer needed" },
  { value: "better_price", label: "Found a better price" },
  { value: "other", label: "Other" },
];

export function ReturnForm({ orderItemId }: { orderItemId: string }) {
  const [state, action] = useActionState<ReturnActionState, FormData>(initiateReturn, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderItemId" value={orderItemId} />
      <div className="grid gap-2">
        <Label htmlFor="reason">Why are you returning this?</Label>
        <select
          id="reason"
          name="reason"
          required
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Additional details (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Share photos to support@smartbuyx.in for faster approval."
        />
      </div>
      <ReturnProofUploader />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="wantsExchange" className="h-4 w-4 rounded border-input" />
        Exchange for a new one instead of a refund
      </label>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Submit return request</SubmitButton>
    </form>
  );
}
