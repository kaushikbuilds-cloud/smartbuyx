"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";

export type CreatorActionState = { error?: string; success?: string } | null;

const CREATOR_ROLES = ["creator", "admin", "superadmin"] as const;

const reelSchema = z.object({
  title: z.string().max(120).optional().or(z.literal("")),
  caption: z.string().max(500).optional().or(z.literal("")),
  videoUrl: z.string().url("Enter a valid video URL"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  productSlug: z.string().optional().or(z.literal("")),
});

export async function publishReel(_prev: CreatorActionState, formData: FormData): Promise<CreatorActionState> {
  const { user } = await requireRole(...CREATOR_ROLES);
  const parsed = reelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const supabase = await createClient();
  const { data: reel, error } = await supabase
    .from("reels")
    .insert({
      creator_id: user.id,
      title: p.title || null,
      caption: p.caption || null,
      video_url: p.videoUrl,
      thumbnail_url: p.thumbnailUrl || null,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !reel) return { error: error?.message ?? "Failed to publish." };

  // Optionally tag one product by slug.
  if (p.productSlug) {
    const { data: product } = await supabase.from("products").select("id").eq("slug", p.productSlug).single();
    if (product) {
      await supabase.from("reel_products").insert({ reel_id: reel.id, product_id: product.id });
    }
  }

  revalidatePath("/reels");
  revalidatePath("/dashboard/creator");
  return { success: "Reel published!" };
}

const linkSchema = z.object({ productSlug: z.string().min(1, "Enter a product slug") });

export async function createAffiliateLink(_prev: CreatorActionState, formData: FormData): Promise<CreatorActionState> {
  const { user } = await requireRole(...CREATOR_ROLES);
  const parsed = linkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("id").eq("slug", parsed.data.productSlug).single();
  if (!product) return { error: "Product not found — check the slug." };

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("affiliate_rate")
    .eq("user_id", user.id)
    .maybeSingle();
  const commission = creatorProfile?.affiliate_rate ?? 5;

  const code = `${user.id.slice(0, 6)}-${product.id.slice(0, 6)}`.toUpperCase();
  const { error } = await supabase.from("affiliate_links").insert({
    creator_id: user.id,
    product_id: product.id,
    code,
    commission_pct: commission,
  });
  if (error) return { error: error.code === "23505" ? "You already have a link for this product." : error.message };

  revalidatePath("/dashboard/creator");
  return { success: `Affiliate link created: ${code}` };
}
