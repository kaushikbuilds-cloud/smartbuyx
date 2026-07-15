"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewProApplication, verifySupplierGst } from "@/features/admin/actions";

export function ApplicationActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="gradient"
        disabled={pending}
        onClick={() => startTransition(async () => { await reviewProApplication(id, true); toast.success("Approved"); })}
      >
        <Check className="h-4 w-4" /> Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => { await reviewProApplication(id, false); toast.success("Rejected"); })}
      >
        <X className="h-4 w-4" /> Reject
      </Button>
    </div>
  );
}

export function GstVerifyButton({ userId, verified }: { userId: string; verified: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant={verified ? "outline" : "gradient"}
      disabled={pending}
      onClick={() => startTransition(async () => {
        await verifySupplierGst(userId, !verified);
        toast.success(verified ? "GST unverified" : "GST verified");
      })}
    >
      {verified ? "Unverify GST" : "Verify GST"}
    </Button>
  );
}
