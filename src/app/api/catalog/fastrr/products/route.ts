import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { data: products, count } = await admin
    .from("products")
    .select(
      "id, fastrr_numeric_id, title, slug, description, brand, compare_at_price, gst_rate, images, status, created_at, updated_at, weight_kg, categories(name), product_variants(id, fastrr_numeric_id, sku, price, options, created_at, updated_at, inventory(quantity))",
      { count: "exact" }
    )
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const items = (products ?? []).map((p) => {
    const images = (p.images as string[]) ?? [];
    const category = p.categories as unknown as { name: string } | null;
    const variants = (p.product_variants as unknown as {
      id: string; fastrr_numeric_id: number; sku: string; price: number; options: Record<string, string>;
      created_at: string; updated_at: string; inventory: { quantity: number } | null;
    }[]) ?? [];

    // Product-level `options` = every distinct {name, values[]} across this
    // product's variants, aggregated from each variant's own option map.
    const optionMap = new Map<string, Set<string>>();
    for (const v of variants) {
      for (const [name, value] of Object.entries(v.options ?? {})) {
        if (!optionMap.has(name)) optionMap.set(name, new Set());
        optionMap.get(name)!.add(value);
      }
    }

    return {
      id: p.fastrr_numeric_id,
      title: p.title,
      body_html: p.description ?? "",
      vendor: p.brand ?? "",
      product_type: category?.name ?? "",
      created_at: p.created_at,
      handle: p.slug,
      updated_at: p.updated_at,
      tags: [p.brand, category?.name].filter(Boolean).join(", "),
      status: p.status === "active" ? "active" : "draft",
      variants: variants.map((v) => ({
        id: v.fastrr_numeric_id,
        title: Object.values(v.options ?? {}).join(" / ") || "Default",
        price: Number(v.price).toFixed(2),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price).toFixed(2) : "",
        sku: v.sku,
        quantity: v.inventory?.quantity ?? 0,
        created_at: v.created_at,
        updated_at: v.updated_at,
        taxable: Number(p.gst_rate ?? 0) > 0,
        option_values: v.options ?? {},
        grams: Math.round(Number(p.weight_kg ?? 0.5) * 1000),
        image: images[0] ? { src: images[0] } : null,
        weight: Number(p.weight_kg ?? 0.5),
        weight_unit: "kg",
      })),
      image: images[0] ? { src: images[0] } : null,
      options: [...optionMap.entries()].map(([name, values]) => ({ name, values: [...values] })),
    };
  });

  return NextResponse.json({ data: { total: count ?? 0, products: items } });
}
