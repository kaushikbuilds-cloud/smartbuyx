import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// "Block Points" -- holds points against a Fastrr order_id without debiting
// them yet (see unblock/route.ts and fastrr-fulfil.ts for when they're
// actually released or converted to a permanent debit).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone = body?.mobile_number;
  const points = Number(body?.transactional_points ?? 0);
  const orderId = String(body?.order_id ?? "");
  if (!phone || !orderId || points <= 0) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (!profile) return NextResponse.json({ data: { status: false, message: "Unknown customer" } });

  const { data: wallet } = await admin.from("wallets").select("balance, blocked_balance").eq("user_id", profile.id).maybeSingle();
  const available = Math.max(0, Number(wallet?.balance ?? 0) - Number(wallet?.blocked_balance ?? 0));
  if (available < points) {
    return NextResponse.json({ data: { status: false, available_points: available, message: "Insufficient points" } });
  }

  const { error } = await admin.from("wallet_point_blocks").insert({
    user_id: profile.id, fastrr_order_id: orderId, points, status: "blocked",
  });
  if (error) return NextResponse.json({ data: { status: false, message: error.message } });

  await admin
    .from("wallets")
    .update({ blocked_balance: Number(wallet?.blocked_balance ?? 0) + points, updated_at: new Date().toISOString() })
    .eq("user_id", profile.id);

  return NextResponse.json({
    data: {
      status: true, available_points: available - points, message: "Valid Customer Id",
      debited_points: points, transaction_id: orderId, discount_value: points,
    },
  });
}
