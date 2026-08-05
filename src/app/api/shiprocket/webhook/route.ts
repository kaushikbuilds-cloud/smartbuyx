import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncOrderStatus } from "@/features/orders/seller-order-actions";

// Register this URL in Shiprocket dashboard -> Settings -> API -> Webhooks:
//   https://www.smartbuyx.in/api/shiprocket/webhook?token=<SHIPROCKET_WEBHOOK_TOKEN>
// Shiprocket has no HMAC signature scheme for webhooks -- it supports a
// caller-chosen secret appended to the URL, which is what's verified here.
const STATUS_MAP: Record<string, string> = {
  "PICKED UP": "picked_up",
  "IN TRANSIT": "in_transit",
  "OUT FOR DELIVERY": "out_for_delivery",
  DELIVERED: "delivered",
  "RTO INITIATED": "returned",
  "RTO DELIVERED": "returned",
  CANCELLED: "cancelled",
};

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.SHIPROCKET_WEBHOOK_TOKEN || token !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { awb?: string; current_status?: string };
  if (!body.awb || !body.current_status) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const mapped = STATUS_MAP[body.current_status.toUpperCase()];
  if (!mapped) return NextResponse.json({ received: true, ignored: true });

  const admin = createAdminClient();
  const { data: shipment } = await admin.from("shipments").select("id, order_id, status").eq("awb", body.awb).single();
  if (!shipment) return NextResponse.json({ received: true, ignored: true });

  const patch: Record<string, unknown> = { status: mapped, updated_at: new Date().toISOString() };
  if (mapped === "delivered") patch.delivered_at = new Date().toISOString();
  if (mapped === "picked_up") patch.shipped_at = new Date().toISOString();

  await admin.from("shipments").update(patch).eq("id", shipment.id);
  await syncOrderStatus(shipment.order_id);

  return NextResponse.json({ received: true });
}
