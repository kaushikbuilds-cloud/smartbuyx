"use client";

import { useActionState } from "react";
import { submitProApplication, type ProApplicationState } from "@/features/onboarding/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

const ROLES = [
  { value: "supplier", label: "Supplier — sell products or construction materials" },
  { value: "architect", label: "Architect — offer design consultations" },
  { value: "contractor", label: "Contractor — offer building/renovation services" },
];

export function ProApplicationForm() {
  const [state, action] = useActionState<ProApplicationState, FormData>(submitProApplication, null);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="requestedRole">What do you want to become?</Label>
        <select
          id="requestedRole"
          name="requestedRole"
          required
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="businessName">Business / professional name</Label>
        <Input id="businessName" name="businessName" required placeholder="e.g. SmartBuild Supplies" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Tell us about your business (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="What you sell or offer, GSTIN, years in business, service areas..."
        />
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Submit application</SubmitButton>
    </form>
  );
}
