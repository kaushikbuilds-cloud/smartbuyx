"use client";

import { useActionState } from "react";
import { updateOrderPrefs, type PrefsActionState, type Preferences } from "@/features/account/preferences";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

type Address = { id: string; line1: string; city: string };

export function OrderPrefsForm({
  initial,
  addresses,
}: {
  initial: Preferences["orders"];
  addresses: Address[];
}) {
  const [state, action] = useActionState<PrefsActionState, FormData>(updateOrderPrefs, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="delivery_window">Preferred delivery window</Label>
        <select
          id="delivery_window"
          name="delivery_window"
          defaultValue={initial?.delivery_window ?? "anytime"}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="anytime">Anytime</option>
          <option value="morning">Morning (9 AM – 12 PM)</option>
          <option value="afternoon">Afternoon (12 – 5 PM)</option>
          <option value="evening">Evening (5 – 9 PM)</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="default_address_id">Default shipping address</Label>
        {addresses.length === 0 ? (
          <p className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Add an address first under <a href="/dashboard/customer/addresses" className="text-primary hover:underline">Addresses</a>.
          </p>
        ) : (
          <select
            id="default_address_id"
            name="default_address_id"
            defaultValue={initial?.default_address_id ?? ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">— Choose at checkout —</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.line1}, {a.city}
              </option>
            ))}
          </select>
        )}
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save order preferences</SubmitButton>
    </form>
  );
}
