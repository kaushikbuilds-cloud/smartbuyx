"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";
import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils/format";
import {
  createCheckoutOrder,
  verifyAndFinalizeOrder,
  validateCoupon,
} from "@/features/orders/checkout-actions";

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

export function CheckoutClient({
  addressId,
  subtotal,
  buyerName,
  buyerEmail,
}: {
  addressId: string | null;
  subtotal: number;
  buyerName: string;
  buyerEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const total = Math.max(0, subtotal - discount);

  async function applyCoupon() {
    setApplying(true);
    const res = await validateCoupon(code);
    setApplying(false);
    if (!res.ok) {
      toast.error(res.reason);
      setDiscount(0);
      setAppliedCode(null);
      return;
    }
    setDiscount(res.discount);
    setAppliedCode(code.trim());
    toast.success(`Coupon applied — you save ${formatINR(res.discount)}`);
  }

  async function pay() {
    if (!addressId) {
      toast.error("Please add a delivery address.");
      return;
    }
    if (typeof window === "undefined" || !window.Razorpay) {
      toast.error("Payment is still loading — please try again in a moment.");
      return;
    }
    setLoading(true);
    const res = await createCheckoutOrder(addressId, appliedCode ?? undefined);
    if (!res.ok) {
      toast.error(res.error);
      setLoading(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: res.keyId,
      amount: res.amount,
      currency: "INR",
      name: "SmartBuyX",
      description: "Order payment",
      order_id: res.razorpayOrderId,
      prefill: { name: buyerName, email: buyerEmail },
      theme: { color: "#2563eb" },
      handler: async (response: RazorpayResponse) => {
        const result = await verifyAndFinalizeOrder({
          orderId: res.orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (result.ok) router.push(`/checkout/success?order=${res.orderId}`);
        else {
          toast.error(result.error ?? "Payment verification failed.");
          setLoading(false);
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    });
    rzp.open();
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={applyCoupon} disabled={applying || !code.trim()}>
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>

      {discount > 0 ? (
        <div className="flex justify-between text-sm text-emerald-600">
          <span>Coupon {appliedCode}</span>
          <span>− {formatINR(discount)}</span>
        </div>
      ) : null}

      <div className="flex justify-between border-t pt-3 font-semibold">
        <span>Total</span>
        <span>{formatINR(total)}</span>
      </div>

      <Button variant="gradient" className="w-full" onClick={pay} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Pay {formatINR(total)}
      </Button>
    </>
  );
}
