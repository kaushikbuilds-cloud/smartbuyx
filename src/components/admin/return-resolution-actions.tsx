"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveReturnRequest } from "@/features/admin/actions";

export function ReturnResolutionActions({ returnId }: { returnId: string }) {
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const res = await resolveReturnRequest(returnId, "approve");
      if (res.error) toast.error(res.error);
      else toast.success("Refund issued to buyer's wallet.");
    });
  }

  function reject() {
    const notes = window.prompt("Reason for rejecting this return? (optional, kept internally)") ?? undefined;
    startTransition(async () => {
      const res = await resolveReturnRequest(returnId, "reject", notes);
      if (res.error) toast.error(res.error);
      else toast.success("Return rejected.");
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="gradient" disabled={pending} onClick={approve}>
        <Check className="h-4 w-4" /> Refund
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={reject}>
        <X className="h-4 w-4" /> Reject
      </Button>
    </div>
  );
}
