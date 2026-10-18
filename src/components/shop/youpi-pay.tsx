"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type YoupiResponse = { status: string; order_id: string };
declare global {
  interface Window {
    Youpi?: { pay: (opts: Record<string, unknown>) => void };
  }
}

// Loads the YouPI checkout script from our own YouPI deployment and opens its
// UPI QR / COD flow. The webhook (not this callback) is what actually fulfils
// the order; the handler only moves the customer along to the result page.
export function YoupiPay({ orderId, amount }: { orderId: string; amount: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opened = useRef(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_YOUPI_BASE_URL!;
    const s = document.createElement("script");
    s.src = `${base}/youpi.js`;
    s.dataset.youpiKey = process.env.NEXT_PUBLIC_YOUPI_PUBLIC_KEY!;
    s.dataset.currency = "INR";
    s.onload = () => setReady(true);
    s.onerror = () => setError("Could not load the payment form. Please try again.");
    document.head.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  function open() {
    if (!window.Youpi) return;
    opened.current = true;
    window.Youpi.pay({
      order_id: orderId,
      amount,
      currency: "INR",
      name: "SmartBuyX",
      description: "SmartBuyX Order",
      handler: (res: YoupiResponse) => {
        if (res.status === "SUCCESS") router.replace(`/checkout/success?order=${orderId}`);
        else router.replace(`/checkout/failure?order=${orderId}`);
      },
      onClose: () => {
        opened.current = false;
      },
    });
  }

  useEffect(() => {
    if (ready && !opened.current) open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <main className="mx-auto mt-16 max-w-sm space-y-4 text-center">
      <p>Complete your payment with UPI.</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={open} disabled={!ready}>
        {ready ? "Pay now" : <Loader2 className="h-4 w-4 animate-spin" />}
      </Button>
    </main>
  );
}
