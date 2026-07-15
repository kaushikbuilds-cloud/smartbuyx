"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";
import { Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startPlanCheckout, verifyPlanPayment } from "@/features/billing/actions";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function SubscribeButton({
  planId,
  isFree,
  isCurrent,
  buyerName,
  buyerEmail,
}: {
  planId: string;
  isFree: boolean;
  isCurrent: boolean;
  buyerName: string;
  buyerEmail: string;
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

    const rzp = new window.Razorpay({
      key: res.keyId,
      amount: res.amount,
      currency: "INR",
      name: "SmartBuyX",
      description: "Plan subscription",
      order_id: res.razorpayOrderId,
      prefill: { name: buyerName, email: buyerEmail },
      theme: { color: "#7c3aed" },
      handler: async (response: RazorpayResponse) => {
        const result = await verifyPlanPayment({
          planId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (result.ok) {
          toast.success("Subscribed! Welcome to your new plan.");
          router.push("/dashboard/subscription");
        } else {
          toast.error(result.error ?? "Verification failed.");
          setLoading(false);
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    });
    rzp.open();
  }

  if (isCurrent) {
    return <Button variant="outline" className="w-full" disabled>Current Plan</Button>;
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Button variant="gradient" className="w-full" onClick={subscribe} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
        {isFree ? "Get Started Free" : "Upgrade"}
      </Button>
    </>
  );
}
