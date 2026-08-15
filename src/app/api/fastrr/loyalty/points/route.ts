import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// "Fetch Available Points" -- 1 point = ₹1, matching how wallets.balance is
// already treated as a plain INR amount throughout the app.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const phone = body?.mobile_number;
  const cartValue = Number(body?.cart_value ?? 0);
  if (!phone) return NextResponse.json({ error: "mobile_number is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (!profile) return NextResponse.json({ data: { mobile_number: phone, available_points: 0, applicable_points: 0 } });

  const { data: wallet } = await admin.from("wallets").select("balance, blocked_balance").eq("user_id", profile.id).maybeSingle();
  const available = Math.max(0, Number(wallet?.balance ?? 0) - Number(wallet?.blocked_balance ?? 0));
  const applicable = Math.floor(Math.min(available, cartValue));

  return NextResponse.json({ data: { mobile_number: phone, available_points: available, applicable_points: applicable } });
}
