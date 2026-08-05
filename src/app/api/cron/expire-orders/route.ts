import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Runs hourly (see vercel.json). Orders are created as "pending" the moment
// checkout starts (before the buyer ever reaches PayU) so there's a row to
// attach the payment session to -- if the buyer abandons checkout or the
// payment never completes, that row sits "pending" forever with nothing to
// clean it up. This auto-cancels anything left unpaid past the window so
// buyers' order lists don't fill up with dead test/abandoned rows, and
// nothing downstream (stock, coupons) is at risk since fulfilPaidOrder never
// ran for these -- there's nothing to roll back, just a status flip.
const EXPIRE_AFTER_HOURS = 2;

export async function GET(req: NextRequest) {
  // Vercel automatically sends this header on cron invocations when
  // CRON_SECRET is set -- verifying it stops this route being triggered by
  // anyone who finds the URL.
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - EXPIRE_AFTER_HOURS * 60 * 60 * 1000).toISOString();

  const { data: stale } = await admin
    .from("orders")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  const ids = (stale ?? []).map((o) => o.id);
  if (ids.length === 0) return NextResponse.json({ expired: 0 });

  await admin.from("orders").update({ status: "cancelled" }).in("id", ids);
  await admin.from("order_status_history").insert(
    ids.map((id) => ({ order_id: id, status: "cancelled", note: `Auto-cancelled: unpaid after ${EXPIRE_AFTER_HOURS}h` }))
  );
  await admin.from("payments").update({ status: "failed" }).in("order_id", ids).eq("status", "created");

  return NextResponse.json({ expired: ids.length });
}
