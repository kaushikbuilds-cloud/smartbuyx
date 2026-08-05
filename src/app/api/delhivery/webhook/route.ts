import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncOrderStatus } from "@/features/orders/seller-order-actions";

// Delhivery has no self-serve webhook dashboard (unlike Shiprocket) -- you
// email them this URL + a shared-secret token to include as a query param,
// and their team wires up the push (their docs say allow 5-6 business days).
// Register: https://www.smartbuyx.in/api/delhivery/webhook?token=<DELHIVERY_WEBHOOK_TOKEN>
// Payload shape per Delhivery's "Tracking via Push API" docs -- verify
// against their first real test push once webhook setup is confirmed, since
// their public docs don't fully pin down every field.
const STATUS_MAP: Record<string, string> = {
  "PICKED UP": "picked_up",
  "IN TRANSIT": "in_transit",
  "OUT FOR DELIVERY": "out_for_delivery",
  DELIVERED: "delivered",
  RTO: "returned",
  CANCELLED: "cancelled",
};

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.DELHIVERY_WEBHOOK_TOKEN || token !== process.env.DELHIVERY_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const shipmentData = body?.Shipment ?? body?.ShipmentData?.[0]?.Shipment;
  const awb: string | undefined = shipmentData?.AWB;
  const status: string | undefined = shipmentData?.Status?.Status;
  if (!awb || !status) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const mapped = STATUS_MAP[status.toUpperCase()];
  if (!mapped) return NextResponse.json({ received: true, ignored: true });

  const admin = createAdminClient();
  const { data: shipment } = await admin.from("shipments").select("id, order_id").eq("awb", awb).maybeSingle();
  if (!shipment) return NextResponse.json({ received: true, ignored: true });

  const patch: Record<string, unknown> = { status: mapped, updated_at: new Date().toISOString() };
  if (mapped === "delivered") patch.delivered_at = new Date().toISOString();
  if (mapped === "picked_up") patch.shipped_at = new Date().toISOString();

  await admin.from("shipments").update(patch).eq("id", shipment.id);
  await syncOrderStatus(shipment.order_id);

  return NextResponse.json({ received: true });
}
