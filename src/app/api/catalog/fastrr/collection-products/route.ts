import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// "Fetch Products By Collection" -- collection_id passed as a query param
// per the guide's example endpoint shape (not a path param). Same product
// shape and "data" envelope as products/route.ts -- see that file for the
// field-by-field reasoning.
export async function GET(req: NextRequest) {
  const collectionNumericId = req.nextUrl.searchParams.get("collection_id");
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(250, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "100")));
  const offset = (page - 1) * limit;

  if (!collectionNumericId) return NextResponse.json({ data: { total: 0, products: [] } });

  const admin = createAdminClient();
  const { data: category } = await admin.from("categories").select("id").eq("fastrr_numeric_id", collectionNumericId).maybeSingle();
  if (!category) return NextResponse.json({ data: { total: 0, products: [] } });

  const { data: products, count } = await admin
    .from("products")
    .select(
      "id, fastrr_numeric_id, title, slug, description, brand, compare_at_price, gst_rate, images, status, created_at, updated_at, weight_kg, categories(name), product_variants(id, fastrr_numeric_id, sku, price, options, created_at, updated_at, inventory(quantity))",
      { count: "exact" }
    )
    .eq("status", "active")
    .eq("category_id", category.id)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const items = (products ?? []).map((p) => {
    const images = (p.images as string[]) ?? [];
    const category = p.categories as unknown as { name: string } | null;
    const variants = (p.product_variants as unknown as {
      id: string; fastrr_numeric_id: number; sku: string; price: number; options: Record<string, string>;
      created_at: string; updated_at: string; inventory: { quantity: number } | null;
    }[]) ?? [];

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
