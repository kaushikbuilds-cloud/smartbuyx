import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toShopifyProduct, CATALOG_PRODUCT_SELECT } from "@/lib/fastrr/product-shape";

// Called by Fastrr to sync our catalog (see "SR Checkout Integration Guide").
// Response shape confirmed directly against Shiprocket's own example
// response for this endpoint -- notably wrapped in a top-level "data" key
// (not a bare object), which earlier versions of this route did NOT do.
// That mismatch is a strong candidate for the generic 500s the access-token
// API kept returning even after catalog sync and numeric ids were fixed.
// Without this, Next.js can treat a GET route with no cookies/headers usage
// as statically cacheable and serve one build-time snapshot forever --
// which would explain persistent "0 products" regardless of real DB state.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(250, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "100")));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  const { data: products, count, error } = await admin
    .from("products")
    .select(CATALOG_PRODUCT_SELECT, { count: "exact" })
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // A query error here (bad grants, a malformed nested select) previously
  // vanished into "0 total" -- surface it instead of silently masking it,
  // same lesson as the PayU "permission denied" bug earlier.
  if (error) console.error("[fastrr/products] query failed", { message: error.message, code: error.code, details: error.details, hint: error.hint });

  const items = (products ?? []).map(toShopifyProduct);

  return NextResponse.json({ data: { total: count ?? 0, products: items } });
}
