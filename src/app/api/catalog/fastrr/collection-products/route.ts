import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// "Fetch Products By Collection" -- collection_id passed as a query param
// per the guide's example endpoint shape (not a path param).
export async function GET(req: NextRequest) {
  const collectionNumericId = req.nextUrl.searchParams.get("collection_id");
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(250, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "100")));
  const offset = (page - 1) * limit;

  // A missing/unrecognized collection_id (health-check crawl, stale id,
  // etc.) returns an empty result set instead of an error -- keeps this
  // endpoint's response shape consistent with products/collections, which
  // always return 200.
  if (!collectionNumericId) return NextResponse.json({ products: [], page, limit, total: 0 });

  const admin = createAdminClient();
  // collection_id is Fastrr's numeric id (see /collections), not our uuid.
  const { data: category } = await admin.from("categories").select("id").eq("fastrr_numeric_id", collectionNumericId).maybeSingle();
  if (!category) return NextResponse.json({ products: [], page, limit, total: 0 });

  const { data: products, count } = await admin
    .from("products")
    .select("id, fastrr_numeric_id, title, description, brand, images, status, updated_at, weight_kg, categories(name), product_variants(id, fastrr_numeric_id, sku, price, options, updated_at, inventory(quantity))", { count: "exact" })
    .eq("status", "active")
    .eq("category_id", category.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const items = (products ?? []).map((p) => {
    const images = (p.images as string[]) ?? [];
    const category = p.categories as unknown as { name: string } | null;
    const variants = (p.product_variants as unknown as {
      id: string; fastrr_numeric_id: number; sku: string; price: number; options: Record<string, string>; updated_at: string;
      inventory: { quantity: number } | null;
    }[]) ?? [];
    return {
      id: p.fastrr_numeric_id,
      title: p.title,
      body_html: p.description ?? "",
      vendor: p.brand ?? "",
      product_type: category?.name ?? "",
      updated_at: p.updated_at,
      status: p.status === "active" ? "active" : "draft",
      variants: variants.map((v) => ({
        id: v.fastrr_numeric_id,
        title: Object.values(v.options ?? {}).join(" / ") || "Default",
        price: Number(v.price).toFixed(2),
        quantity: v.inventory?.quantity ?? 0,
        sku: v.sku,
        updated_at: v.updated_at,
        image: images[0] ? { src: images[0] } : null,
        weight: Number(p.weight_kg ?? 0.5),
      })),
      image: images[0] ? { src: images[0] } : null,
    };
  });

  return NextResponse.json({ products: items, page, limit, total: count ?? 0 });
}
