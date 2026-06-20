"use client";

import { useActionState } from "react";
import { upsertPriceAlert, type AlertActionState } from "@/features/preferences/alerts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function PriceAlertForm({ productId, currentPrice }: { productId: string; currentPrice: number }) {
  const [state, action] = useActionState<AlertActionState, FormData>(upsertPriceAlert, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="grid gap-2">
        <Label htmlFor="targetPrice">Notify me when price drops to</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">₹</span>
          <Input
            id="targetPrice"
            name="targetPrice"
            type="number"
            min={1}
            step="1"
            defaultValue={Math.max(1, Math.round(currentPrice * 0.9))}
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">Current price: ₹{currentPrice}</p>
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient" className="w-full">Set Alert</SubmitButton>
    </form>
  );
}
