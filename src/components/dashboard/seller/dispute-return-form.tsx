"use client";

import { useActionState, useState } from "react";
import { disputeReturn, type ReturnActionState } from "@/features/orders/returns";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";

export function DisputeReturnForm({ returnId }: { returnId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ReturnActionState, FormData>(disputeReturn, null);

  if (state?.success) return <p className="text-xs text-emerald-600">{state.success}</p>;

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Dispute this return
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="returnId" value={returnId} />
      <textarea
        name="sellerNotes"
        required
        rows={2}
        placeholder="Explain why you're contesting this return..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
      />
      {state?.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      <div className="flex gap-2">
        <SubmitButton size="sm" variant="outline">Submit dispute</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
