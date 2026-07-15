"use client";

import { useActionState } from "react";
import { createAffiliateLink, type CreatorActionState } from "@/features/creator/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function AffiliateLinkForm() {
  const [state, action] = useActionState<CreatorActionState, FormData>(createAffiliateLink, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="grid gap-2">
        <Label htmlFor="productSlug" className="text-xs">Product slug</Label>
        <Input id="productSlug" name="productSlug" required placeholder="e.g. asus-tuf-f15-abc12" className="h-9 w-64" />
      </div>
      <SubmitButton size="sm" variant="outline">Generate link</SubmitButton>
      {state?.error ? <p className="w-full text-xs text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="w-full text-xs text-emerald-600">{state.success}</p> : null}
    </form>
  );
}
