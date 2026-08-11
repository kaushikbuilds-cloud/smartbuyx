// Builds the exact payload shape from the "Product Update Webhook" example
// in Shiprocket's integration guide and pushes it to Fastrr. Per their FAQ
// (Q4), catalog sync is NOT automatic -- either this push webhook or a
// manual sync from their account manager is required before any variant_id
// is recognized by the checkout/access-token API.
import { createAdminClient } from "@/lib/supabase/admin";
import { pushProductUpdate, pushCollectionUpdate } from "./client";

export async function syncProductToFastrr(productId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, title, description, brand, status, updated_at, weight_kg, categories(name), product_variants(id, sku, price, options, updated_at, inventory(quantity)), images")
    .eq("id", productId)
    .single();
  if (!product) return;

  const images = (product.images as string[]) ?? [];
  const category = product.categories as unknown as { name: string } | null;
  const variants = (product.product_variants as unknown as {
    id: string; sku: string; price: number; options: Record<string, string>; updated_at: string;
    inventory: { quantity: number } | null;
  }[]) ?? [];

  await pushProductUpdate({
    id: product.id,
    title: product.title,
    body_html: product.description ?? "",
    vendor: product.brand ?? "",
    product_type: category?.name ?? "",
    updated_at: product.updated_at,
    status: product.status === "active" ? "active" : "draft",
    variants: variants.map((v) => ({
      id: v.id,
      title: Object.values(v.options ?? {}).join(" / ") || "Default",
      price: Number(v.price).toFixed(2),
      quantity: v.inventory?.quantity ?? 0,
      sku: v.sku,
      updated_at: v.updated_at,
      image: images[0] ? { src: images[0] } : null,
      weight: Number(product.weight_kg ?? 0.5),
    })),
    image: images[0] ? { src: images[0] } : null,
  });
}

export async function syncCollectionToFastrr(categoryId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: category } = await admin.from("categories").select("id, name, created_at").eq("id", categoryId).single();
  if (!category) return;

  await pushCollectionUpdate({
    id: category.id,
    title: category.name,
    body_html: "",
    updated_at: category.created_at,
    image: null,
  });
}

// One-time (or occasional) full push -- used to seed Fastrr's catalog cache
// when webhooks alone haven't covered everything yet (e.g. products created
// before this sync was wired up).
export async function backfillFastrrCatalog(): Promise<{ products: number; collections: number }> {
  const admin = createAdminClient();
  const { data: products } = await admin.from("products").select("id").eq("status", "active");
  for (const p of products ?? []) {
    await syncProductToFastrr(p.id);
  }
  const { data: categories } = await admin.from("categories").select("id");
  for (const c of categories ?? []) {
    await syncCollectionToFastrr(c.id);
  }
  return { products: products?.length ?? 0, collections: categories?.length ?? 0 };
}
