import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Called by Fastrr to sync our category tree -- see products/route.ts for
// the same auth/shape reasoning.
export async function GET(req: NextRequest) {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(250, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "100")));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  const { data: categories, count } = await admin
    .from("categories")
    .select("id, fastrr_numeric_id, name, created_at", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  const items = (categories ?? []).map((c) => ({
    id: c.fastrr_numeric_id,
    title: c.name,
    // categories has no description field of its own -- a short generated
    // line beats sending an empty string for every collection.
    body_html: `Shop the best in ${c.name} at SmartBuyX.`,
    updated_at: c.created_at,
    image: null,
  }));

  return NextResponse.json({ collections: items, page, limit, total: count ?? 0 });
}
