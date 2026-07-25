"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils/format";
import { createCheckoutOrder, validateCoupon } from "@/features/orders/checkout-actions";

export function CheckoutClient({
  addressId,
  subtotal,
}: {
  addressId: string | null;
  subtotal: number;
}) {
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
    setLoading(true);
    const res = await createCheckoutOrder(addressId, appliedCode ?? undefined);
    if (!res.ok) {
      toast.error(res.error);
      setLoading(false);
      return;
    }
    // Plain top-level navigation (not a form-action) to a server-rendered
    // bridge page that does the actual auto-submitting POST to PayU as real
    // server-rendered HTML.
    window.location.href = `/checkout/pay/${res.orderId}`;
  }

  return (
    <>
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
