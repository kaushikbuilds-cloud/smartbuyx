import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { backfillFastrrCatalog } from "@/lib/fastrr/sync";

// One-time (or occasional) trigger to push the full catalog to Fastrr --
// visit this URL while logged in as admin. See sync.ts for why this is
// needed: Fastrr's catalog sync isn't automatic (their FAQ Q4), so products
// created before the push-webhook was wired up need this to become
// checkout-able.
export async function GET() {
  await requireRole("admin", "superadmin");
  const result = await backfillFastrrCatalog();
  return NextResponse.json({ ok: true, ...result });
}
