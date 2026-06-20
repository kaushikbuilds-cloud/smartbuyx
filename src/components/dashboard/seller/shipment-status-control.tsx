"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateShipmentStatus } from "@/features/orders/seller-order-actions";

const NEXT_LABEL: Record<string, { status: string; label: string }> = {
  pending: { status: "ready_to_ship", label: "Mark ready to ship" },
  ready_to_ship: { status: "picked_up", label: "Mark picked up" },
  picked_up: { status: "in_transit", label: "Mark in transit" },
  in_transit: { status: "out_for_delivery", label: "Out for delivery" },
  out_for_delivery: { status: "delivered", label: "Mark delivered" },
};

export function ShipmentStatusControl({ shipmentId, status }: { shipmentId: string | null; status: string }) {
  const [pending, startTransition] = useTransition();
  const next = NEXT_LABEL[status];

  if (!shipmentId) return <span className="text-xs text-muted-foreground">Awaiting payment</span>;
  if (!next) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await updateShipmentStatus(shipmentId, next.status);
          if (res.error) toast.error(res.error);
          else toast.success(next.label.replace("Mark ", "") + " ✓");
        })
      }
    >
      {next.label}
    </Button>
  );
}
