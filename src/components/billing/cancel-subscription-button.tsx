"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelSubscription } from "@/features/billing/actions";

export function CancelSubscriptionButton({ subscriptionId }: { subscriptionId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      className="text-destructive"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await cancelSubscription(subscriptionId);
          toast.success("Subscription will not renew at period end.");
        })
      }
    >
      Cancel renewal
    </Button>
  );
}
