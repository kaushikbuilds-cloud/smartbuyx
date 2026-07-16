"use client";

import { useActionState } from "react";
import { updatePoStatus, type PoActionState } from "@/features/procurement/actions";
import { SubmitButton } from "@/components/auth/submit-button";

export function PoStatusActions({ poId, status }: { poId: string; status: string }) {
  const [state, action] = useActionState<PoActionState, FormData>(updatePoStatus, null);

  if (status !== "draft") {
    return state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <form action={action}>
          <input type="hidden" name="poId" value={poId} />
          <input type="hidden" name="status" value="sent" />
          <SubmitButton variant="gradient" size="sm">Send to supplier</SubmitButton>
        </form>
        <form action={action}>
          <input type="hidden" name="poId" value={poId} />
          <input type="hidden" name="status" value="cancelled" />
          <SubmitButton variant="outline" size="sm">Cancel</SubmitButton>
        </form>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
    </div>
  );
}
