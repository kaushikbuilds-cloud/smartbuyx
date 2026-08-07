"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateShipmentStatus, retryShiprocketBooking } from "@/features/orders/seller-order-actions";

// "ready_to_ship" is now normally reached automatically once Shiprocket
// assigns a courier + AWB (see createShiprocketShipment) -- the manual
// transition stays as a fallback for shipments booked outside Shiprocket.
const NEXT_LABEL: Record<string, { status: string; label: string }> = {
  pending: { status: "ready_to_ship", label: "Mark ready to ship" },
  ready_to_ship: { status: "picked_up", label: "Mark picked up" },
  picked_up: { status: "in_transit", label: "Mark in transit" },
  in_transit: { status: "out_for_delivery", label: "Out for delivery" },
  out_for_delivery: { status: "delivered", label: "Mark delivered" },
};

export function ShipmentStatusControl({
  shipmentId,
  status,
  awb,
  courierName,
  labelUrl,
  bookingError,
}: {
  shipmentId: string | null;
  status: string;
  awb?: string | null;
  courierName?: string | null;
  labelUrl?: string | null;
  bookingError?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const next = NEXT_LABEL[status];

  if (!shipmentId) return <span className="text-xs text-muted-foreground">Awaiting payment</span>;

  if (status === "pending" && !awb) {
    return (
      <div className="flex flex-col items-end gap-1">
        {bookingError ? <span className="max-w-xs text-right text-xs text-destructive">{bookingError}</span> : null}
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await retryShiprocketBooking(shipmentId);
              if (!res.ok) toast.error(res.error ?? "Could not book courier.");
              else toast.success("Booking retried — refresh in a moment.");
            })
          }
        >
          Retry courier booking
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {awb ? (
        <span className="text-xs text-muted-foreground">
          {courierName ?? "Courier"} · AWB {awb}
          {labelUrl ? (
            <>
              {" · "}
              <a href={labelUrl} target="_blank" rel="noopener noreferrer" className="underline">
                Label
              </a>
            </>
          ) : null}
        </span>
      ) : null}
      {next ? (
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
      ) : null}
    </div>
  );
}
