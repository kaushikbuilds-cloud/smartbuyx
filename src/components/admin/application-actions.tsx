"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewProApplication, setApplicationStatus, verifySupplierGst } from "@/features/admin/actions";

export function ApplicationActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap justify-end gap-2">
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
        onClick={() => startTransition(async () => { await setApplicationStatus(id, "under_review"); toast.success("Marked under review"); })}
      >
        <Clock className="h-4 w-4" /> Under review
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          const note = window.prompt("What extra information do you need from the applicant?");
          if (note === null) return;
          startTransition(async () => { await setApplicationStatus(id, "info_requested", note); toast.success("Info requested"); });
        }}
      >
        <MessageSquare className="h-4 w-4" /> Request info
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
