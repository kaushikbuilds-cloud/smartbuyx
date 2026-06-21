"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestPasswordResetEmail } from "@/features/account/preferences";

export function ResetPasswordButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await requestPasswordResetEmail();
          if (res?.error) toast.error(res.error);
          else toast.success(res?.success ?? "Email sent.");
        })
      }
    >
      <Mail className="h-4 w-4" /> Send reset email
    </Button>
  );
}

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button variant="outline" className="text-destructive" onClick={() => setConfirming(true)}>
        <Trash2 className="h-4 w-4" /> Delete my account
      </Button>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-destructive">This action is permanent.</p>
      <p className="text-xs text-muted-foreground">
        Email <a href="mailto:hello@smartbuyx.in?subject=Account%20deletion" className="text-primary hover:underline">hello@smartbuyx.in</a> from your registered address and we&apos;ll process it within 30 days as per IT Rules 2021.
      </p>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
    </div>
  );
}
