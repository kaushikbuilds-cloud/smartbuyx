"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startPlanCheckout } from "@/features/billing/actions";

export function SubscribeButton({
  planId,
  isFree,
  isCurrent,
}: {
  planId: string;
  isFree: boolean;
  isCurrent: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    const res = await startPlanCheckout(planId);

    if (!res.ok) {
      if (res.error === "FREE_ACTIVATED") {
        toast.success("Free plan activated!");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setLoading(false);
      return;
    }

    // Plain top-level navigation to a server-rendered bridge page that does
    // the actual auto-submitting POST to PayU as real server-rendered HTML.
    window.location.href = `/billing/pay-plan/${res.paymentId}`;
  }

  if (isCurrent) {
    return <Button variant="outline" className="w-full" disabled>Current Plan</Button>;
  }

  return (
    <Button variant="gradient" className="w-full" onClick={subscribe} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
      {isFree ? "Get Started Free" : "Upgrade"}
    </Button>
  );
}
