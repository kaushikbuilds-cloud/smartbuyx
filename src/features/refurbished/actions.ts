"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { uniqueSlug } from "@/lib/utils/format";
import { refurbishedSchema } from "./schemas";

export type ActionState = { error?: string; success?: string } | null;

const SELLER_ROLES = ["supplier", "d2c_brand", "admin", "superadmin"] as const;

function parseImages(formData: FormData): string[] {
  const raw = (formData.get("images") as string) || "";
  return raw.split(/[\n,]/).map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s));
}

export async function createRefurbishedProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole(...SELLER_ROLES);
  const parsed = refurbishedSchema.safeParse({ ...Object.fromEntries(formData), images: parseImages(formData) });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const supabase = await createClient();
  const slug = uniqueSlug(p.title);

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      supplier_id: user.id,
      kind: "product",
      is_refurbished: true,
      title: p.title,
      slug,
      description: p.description || null,
      brand: p.brand || null,
      base_price: p.basePrice,
      compare_at_price: p.compareAtPrice ?? null,
      images: p.images.map((url) => ({ url })),
      status: "active",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { data: variant, error: vErr } = await supabase
    .from("product_variants")
    .insert({ product_id: product.id, sku: `${slug}-default`, options: {}, price: p.basePrice })
    .select("id")
    .single();
  if (vErr) return { error: vErr.message };
  if (variant && p.stock > 0) {
    await supabase.from("inventory").update({ quantity: p.stock }).eq("variant_id", variant.id);
  }

  const { error: detailsErr } = await supabase.from("refurbished_details").insert({
    product_id: product.id,
    condition_grade: p.conditionGrade,
    battery_health: p.batteryHealth ?? null,
    warranty_months: p.warrantyMonths,
    accessories_included: p.accessoriesIncluded || null,
    qc_status: "pending",
  });
  if (detailsErr) return { error: detailsErr.message };

  const { error: serialErr } = await supabase.from("refurbished_serials").insert({
    product_id: product.id,
    serial_or_imei: p.serialOrImei,
  });
  if (serialErr) return { error: serialErr.message };

  revalidatePath("/dashboard/supplier/refurbished");
  redirect("/dashboard/supplier/refurbished");
}

export async function updateRefurbishedProduct(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireRole(...SELLER_ROLES);
  const parsed = refurbishedSchema.safeParse({ ...Object.fromEntries(formData), images: parseImages(formData) });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      title: p.title,
      description: p.description || null,
      brand: p.brand || null,
      base_price: p.basePrice,
      compare_at_price: p.compareAtPrice ?? null,
      images: p.images.map((url) => ({ url })),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("supplier_id", user.id);
  if (error) return { error: error.message };

  // Editing the condition report resets QC -- the item must be re-inspected
  // before it's visible to shoppers again, since what's being sold changed.
  const { error: detailsErr } = await supabase
    .from("refurbished_details")
    .update({
      condition_grade: p.conditionGrade,
      battery_health: p.batteryHealth ?? null,
      warranty_months: p.warrantyMonths,
      accessories_included: p.accessoriesIncluded || null,
      qc_status: "pending",
      qc_notes: null,
      qc_reviewed_by: null,
      qc_reviewed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", id);
  if (detailsErr) return { error: detailsErr.message };

  const { error: serialErr } = await supabase
    .from("refurbished_serials")
    .update({ serial_or_imei: p.serialOrImei })
    .eq("product_id", id);
  if (serialErr) return { error: serialErr.message };

  revalidatePath("/dashboard/supplier/refurbished");
  return { success: "Saved — this listing will need re-inspection before it's visible to shoppers." };
}

export async function deleteRefurbishedProduct(id: string): Promise<void> {
  const { user } = await requireRole(...SELLER_ROLES);
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id).eq("supplier_id", user.id);
  revalidatePath("/dashboard/supplier/refurbished");
}
