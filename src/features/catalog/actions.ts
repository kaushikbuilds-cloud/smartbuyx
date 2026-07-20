"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireUser } from "@/lib/auth/guards";
import { uniqueSlug } from "@/lib/utils/format";
import { productSchema, reviewSchema, parseSizeChart } from "./schemas";

export type ActionState = { error?: string; success?: string } | null;

const SELLER_ROLES = ["supplier", "d2c_brand", "admin", "superadmin"] as const;

function parseImages(formData: FormData): string[] {
  const raw = (formData.get("images") as string) || "";
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s));
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole(...SELLER_ROLES);

  const parsed = productSchema.safeParse({
    ...Object.fromEntries(formData),
    images: parseImages(formData),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const supabase = await createClient();
  const slug = uniqueSlug(p.title);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      supplier_id: user.id,
      kind: p.kind,
      title: p.title,
      slug,
      description: p.description || null,
      brand: p.brand || null,
      unit: p.unit || null,
      base_price: p.basePrice,
      compare_at_price: p.compareAtPrice ?? null,
      category_id: p.categoryId || null,
      images: p.images.map((url) => ({ url })),
      status: p.status,
      attributes: parseSizeChart(p.sizeChart) ? { size_chart: parseSizeChart(p.sizeChart) } : {},
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Every product needs at least one purchasable variant (default SKU).
  const { data: variant, error: vErr } = await supabase
    .from("product_variants")
    .insert({ product_id: product.id, sku: `${slug}-default`, options: {}, price: p.basePrice })
    .select("id")
    .single();
  if (vErr) return { error: vErr.message };

  // Set opening stock (inventory row auto-created by trigger).
  if (variant && p.stock > 0) {
    await supabase.from("inventory").update({ quantity: p.stock }).eq("variant_id", variant.id);
  }

  revalidatePath("/dashboard/supplier/products");
  redirect("/dashboard/supplier/products");
}

export async function updateProduct(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole(...SELLER_ROLES);
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(formData),
    images: parseImages(formData),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase.from("products").select("attributes").eq("id", id).single();
  const sizeChart = parseSizeChart(p.sizeChart);
  const attributes = { ...(existing?.attributes as Record<string, unknown> ?? {}) };
  if (sizeChart) attributes.size_chart = sizeChart;
  else delete attributes.size_chart;

  const { error } = await supabase
    .from("products")
    .update({
      title: p.title,
      description: p.description || null,
      brand: p.brand || null,
      unit: p.unit || null,
      base_price: p.basePrice,
      compare_at_price: p.compareAtPrice ?? null,
      category_id: p.categoryId || null,
      images: p.images.map((url) => ({ url })),
      status: p.status,
      attributes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("supplier_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/supplier/products");
  return { success: "Product updated." };
}

export async function deleteProduct(id: string): Promise<void> {
  const { user } = await requireRole(...SELLER_ROLES);
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id).eq("supplier_id", user.id);
  revalidatePath("/dashboard/supplier/products");
}

// Buyers may review only products they have purchased on a delivered order.
export async function addReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const r = parsed.data;

  const supabase = await createClient();

  // Confirm a delivered purchase of this product by this buyer.
  const { data: purchased } = await supabase
    .from("order_items")
    .select("id, orders!inner(buyer_id, status), product_variants!inner(product_id)")
    .eq("orders.buyer_id", user.id)
    .eq("orders.status", "delivered")
    .eq("product_variants.product_id", r.productId)
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("reviews").upsert(
    {
      author_id: user.id,
      target_type: "product",
      target_id: r.productId,
      rating: r.rating,
      title: r.title || null,
      comment: r.comment || null,
      verified_purchase: Boolean(purchased),
      order_item_id: purchased?.id ?? null,
    },
    { onConflict: "author_id,target_type,target_id" }
  );
  if (error) return { error: error.message };

  revalidatePath(`/products`);
  return { success: "Thanks for your review!" };
}
