import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Called by Fastrr to sync our catalog (see "SR Checkout Integration Guide").
// Response mirrors Shopify's product JSON shape -- confirmed against the
// guide's own Product Update Webhook example, which uses that exact field
// set (id, title, body_html, vendor, product_type, variants[...], image).
// Catalog data is the same info already public on our storefront, so this
// is left unauthenticated like any other public product listing.
export async function GET(req: NextRequest) {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(250, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "100")));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  const { data: products, count } = await admin
    .from("products")
    .select("id, title, description, brand, category_id, images, status, updated_at, weight_kg, categories(name), product_variants(id, sku, price, options, updated_at, inventory(quantity))", { count: "exact" })
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const items = (products ?? []).map((p) => {
    const images = (p.images as string[]) ?? [];
    const category = p.categories as unknown as { name: string } | null;
    const variants = (p.product_variants as unknown as {
      id: string; sku: string; price: number; options: Record<string, string>; updated_at: string;
      inventory: { quantity: number } | null;
    }[]) ?? [];
    return {
      id: p.id,
      title: p.title,
      body_html: p.description ?? "",
      vendor: p.brand ?? "",
      product_type: category?.name ?? "",
      updated_at: p.updated_at,
      status: p.status === "active" ? "active" : "draft",
      variants: variants.map((v) => ({
        id: v.id,
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
