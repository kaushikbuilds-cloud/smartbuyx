import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// "[OPTIONAL] Unblock points" -- releases a hold without debiting it. Called
// by Fastrr when the customer removes points/exits checkout/changes number.
// If they never call it (tab closed, reload), the cron in
// expire-orders/route.ts also sweeps stale blocks after a timeout, per the
// guide's own caveat that merchants are responsible for that fallback.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const orderId = String(body?.order_id ?? "");
  if (!orderId) return NextResponse.json({ error: "order_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: block } = await admin
    .from("wallet_point_blocks")
    .select("id, user_id, points, status")
    .eq("fastrr_order_id", orderId)
    .maybeSingle();
  if (!block || block.status !== "blocked") return NextResponse.json({ data: { status: true } }); // already resolved -- idempotent

  const { data: wallet } = await admin.from("wallets").select("blocked_balance").eq("user_id", block.user_id).maybeSingle();
  await admin
    .from("wallets")
    .update({ blocked_balance: Math.max(0, Number(wallet?.blocked_balance ?? 0) - block.points), updated_at: new Date().toISOString() })
    .eq("user_id", block.user_id);
  await admin.from("wallet_point_blocks").update({ status: "released", updated_at: new Date().toISOString() }).eq("id", block.id);

  return NextResponse.json({ data: { status: true } });
}
