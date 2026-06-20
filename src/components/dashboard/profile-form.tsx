"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileActionState } from "@/features/account/profile-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export function ProfileForm({
  initial,
  email,
}: {
  initial: { full_name: string | null; phone: string | null };
  email: string;
}) {
  const [state, action] = useActionState<ProfileActionState, FormData>(updateProfile, null);
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={initial.full_name ?? ""} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={initial.phone ?? ""} placeholder="+91" />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save changes</SubmitButton>
    </form>
  );
}
