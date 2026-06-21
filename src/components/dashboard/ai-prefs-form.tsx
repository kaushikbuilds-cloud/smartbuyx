"use client";

import { useActionState } from "react";
import { updateAiPrefs, type PrefsActionState, type Preferences } from "@/features/account/preferences";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/auth/submit-button";

export function AiPrefsForm({ initial }: { initial: Preferences["ai"] }) {
  const [state, action] = useActionState<PrefsActionState, FormData>(updateAiPrefs, null);
  return (
    <form action={action} className="space-y-5">
      <Switch
        name="recs_on"
        label="AI recommendations"
        description="Let SmartBuyX suggest products you'll love based on activity."
        defaultChecked={initial?.recs_on ?? true}
      />

      <div className="grid gap-2">
        <Label htmlFor="brands">Favorite brands</Label>
        <Input
          id="brands"
          name="brands"
          defaultValue={(initial?.brands ?? []).join(", ")}
          placeholder="UltraTech, boAt, ASUS"
        />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="categories">Interested categories</Label>
        <Input
          id="categories"
          name="categories"
          defaultValue={(initial?.categories ?? []).join(", ")}
          placeholder="Electronics, Cement, Tiles"
        />
        <p className="text-xs text-muted-foreground">Comma-separated.</p>
      </div>

      <div>
        <Label className="mb-2 block">Preferred budget range (₹)</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input name="budget_min" type="number" min={0} defaultValue={initial?.budget_min ?? 0} placeholder="Min" />
          <Input name="budget_max" type="number" min={0} defaultValue={initial?.budget_max ?? 100000} placeholder="Max" />
        </div>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save AI preferences</SubmitButton>
    </form>
  );
}
