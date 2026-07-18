"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setUserSuspended } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";

export function SuspendUserButton({ userId, isSuspended }: { userId: string; isSuspended: boolean }) {
  const [pending, startTransition] = useTransition();
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (isSuspended) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await setUserSuspended(userId, false);
            if (res?.error) toast.error(res.error);
            else toast.success("User unsuspended");
          })
        }
      >
        Unsuspend
      </Button>
    );
  }

  if (reasonOpen) {
    return (
      <div className="flex items-center gap-1">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="h-8 w-32 rounded-md border border-input bg-background px-2 text-xs"
        />
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await setUserSuspended(userId, true, reason);
              if (res?.error) {
                toast.error(res.error);
                return;
              }
              toast.success("User suspended");
              setReasonOpen(false);
            })
          }
        >
          Confirm
        </Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" size="sm" onClick={() => setReasonOpen(true)}>
      Suspend
    </Button>
  );
}
