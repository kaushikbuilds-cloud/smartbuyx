"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceAlertForm } from "./price-alert-form";

export function TrackPricePopover({ productId, currentPrice }: { productId: string; currentPrice: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="outline" size="lg" onClick={() => setOpen((v) => !v)}>
        {open ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        Track price
      </Button>
      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border bg-card p-4 shadow-lg">
          <PriceAlertForm productId={productId} currentPrice={currentPrice} />
        </div>
      ) : null}
    </div>
  );
}
