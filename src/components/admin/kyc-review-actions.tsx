"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setKycStatus } from "@/features/admin/actions";

export function KycReviewActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="gradient" disabled={pending}
        onClick={() => startTransition(async () => { await setKycStatus(id, "approved"); toast.success("Approved"); })}>
        <Check className="h-4 w-4" /> Approve
      </Button>
      <Button size="sm" variant="outline" disabled={pending}
        onClick={() => startTransition(async () => { await setKycStatus(id, "rejected"); toast.success("Rejected"); })}>
        <X className="h-4 w-4" /> Reject
      </Button>
    </div>
  );
}
