"use client";

import { useActionState } from "react";
import { updateAccount, type PrefsActionState } from "@/features/account/preferences";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

type Props = {
  email: string;
  initial: {
    full_name: string | null;
    username: string | null;
    phone: string | null;
    date_of_birth: string | null;
  };
};

export function AccountForm({ email, initial }: Props) {
  const [state, action] = useActionState<PrefsActionState, FormData>(updateAccount, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">Email is your login — contact support to change it.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" defaultValue={initial.full_name ?? ""} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" defaultValue={initial.username ?? ""} placeholder="kaushik.s" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="phone">Mobile number</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={initial.phone ?? ""} placeholder="+91" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date_of_birth">Date of birth (optional)</Label>
          <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={initial.date_of_birth ?? ""} />
        </div>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save changes</SubmitButton>
    </form>
  );
}
