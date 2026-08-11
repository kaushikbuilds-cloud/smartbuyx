"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminSetSubscriptionStatus } from "@/features/admin/actions";

export function SubscriptionRowActions({ subscriptionId, status }: { subscriptionId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  function setStatus(next: "active" | "cancelled") {
    startTransition(async () => {
      const res = await adminSetSubscriptionStatus(subscriptionId, next);
      if (res.error) toast.error(res.error);
      else toast.success(`Subscription ${next}.`);
    });
  }

  if (status === "cancelled") {
    return <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("active")}>Reactivate</Button>;
  }
  return <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("cancelled")}>Suspend</Button>;
}
