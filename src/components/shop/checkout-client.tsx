"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils/format";
import { validateCoupon } from "@/features/orders/checkout-actions";
import { startFastrrCheckout } from "@/features/orders/fastrr-checkout-actions";

declare global {
  interface Window {
    HeadlessCheckout: {
      addToCart: (event: Event, token: string, opts: { fallbackUrl: string }) => void;
    };
  }
}

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
  // Shiprocket's shopify.js scans/mutates the DOM (e.g. the #sellerDomain
  // input) as soon as it loads, which can race React's hydration of this
  // subtree and trip "Hydration failed" (#418) on /checkout. Mounting these
  // elements only after hydration completes keeps them out of the
  // server/client diff entirely.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  async function pay(e: React.MouseEvent) {
    if (!addressId) {
      toast.error("Please add a delivery address.");
      return;
    }
    setLoading(true);
    const res = await startFastrrCheckout(addressId, appliedCode ?? undefined);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    // Opens Fastrr's checkout iframe overlay directly on this page -- see
    // the "SR Checkout Integration Guide" embedding pattern. fallbackUrl is
    // used if the iframe itself can't load for some reason.
    window.HeadlessCheckout.addToCart(e.nativeEvent, res.token, {
      fallbackUrl: `${window.location.origin}/checkout/failure`,
    });
  }

  return (
    <>
      {mounted ? (
        <>
          <Script src="https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js" strategy="afterInteractive" />
          <link rel="stylesheet" href="https://checkout-ui.shiprocket.com/assets/styles/shopify.css" />
          <input type="hidden" id="sellerDomain" value="smartbuyx.in" readOnly />
        </>
      ) : null}

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
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
          <span>Coupon {appliedCode} applied</span>
          <span className="font-medium">− {formatINR(discount)}</span>
        </div>
      ) : null}

      <div className="flex items-baseline justify-between border-t pt-3">
        <span className="font-semibold">Total</span>
        <span className="text-lg font-bold text-primary">{formatINR(total)}</span>
      </div>

      <Button variant="gradient" size="lg" className="w-full" onClick={pay} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Pay {formatINR(total)}
      </Button>
    </>
  );
}
