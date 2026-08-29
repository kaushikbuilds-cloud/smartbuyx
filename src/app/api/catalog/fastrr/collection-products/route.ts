import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toShopifyProduct, CATALOG_PRODUCT_SELECT } from "@/lib/fastrr/product-shape";

// "Fetch Products By Collection" -- collection_id passed as a query param
// per the guide's example endpoint shape (not a path param). Same product
// shape and "data" envelope as products/route.ts -- see that file for the
// field-by-field reasoning.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const collectionNumericId = req.nextUrl.searchParams.get("collection_id");
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(250, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "100")));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Fastrr always calls this with a real collection_id -- this branch only
  // matters for manual testing (visiting the bare URL), where showing every
  // active product is more useful than an empty result.
  let categoryId: string | null = null;
  if (collectionNumericId) {
    const { data: category } = await admin.from("categories").select("id").eq("fastrr_numeric_id", collectionNumericId).maybeSingle();
    if (!category) return NextResponse.json({ data: { total: 0, products: [] } });
    categoryId = category.id;
  }

  let query = admin
    .from("products")
    .select(CATALOG_PRODUCT_SELECT, { count: "exact" })
    .eq("status", "active");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data: products, count, error } = await query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) console.error("[fastrr/collection-products] query failed", { message: error.message, code: error.code });

  const items = (products ?? []).map(toShopifyProduct);

  return NextResponse.json({ data: { total: count ?? 0, products: items } });
}
