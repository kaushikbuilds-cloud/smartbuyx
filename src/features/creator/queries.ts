import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ReelFeedItem = {
  id: string;
  title: string | null;
  caption: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  creatorId: string;
  creatorName: string | null;
  taggedProducts: { id: string; title: string; slug: string; price: number; image: string | null }[];
};

export async function getPublishedReels(limit = 20): Promise<ReelFeedItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reels")
    .select(`
      id, title, caption, video_url, thumbnail_url, views, likes, creator_id,
      profiles!reels_creator_id_fkey(full_name),
      reel_products(products(id, title, slug, base_price, images))
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => {
    const creator = r.profiles as unknown as { full_name: string | null } | null;
    const tagged = (r.reel_products as unknown as { products: { id: string; title: string; slug: string; base_price: number; images: { url: string }[] } | null }[]) ?? [];
    return {
      id: r.id,
      title: r.title,
      caption: r.caption,
      videoUrl: r.video_url,
      thumbnailUrl: r.thumbnail_url,
      views: r.views,
      likes: r.likes,
      creatorId: r.creator_id,
      creatorName: creator?.full_name ?? null,
      taggedProducts: tagged
        .filter((t) => t.products)
        .map((t) => ({
          id: t.products!.id,
          title: t.products!.title,
          slug: t.products!.slug,
          price: Number(t.products!.base_price),
          image: t.products!.images?.[0]?.url ?? null,
        })),
    };
  });
}

export type MyReel = {
  id: string;
  title: string | null;
  status: string;
  views: number;
  likes: number;
  createdAt: string;
};

export async function getMyReels(creatorId: string): Promise<MyReel[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reels")
    .select("id, title, status, views, likes, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({ ...r, createdAt: r.created_at }));
}

export type MyAffiliateLink = {
  id: string;
  code: string;
  commissionPct: number;
  productTitle: string;
  totalEarnings: number;
  pendingEarnings: number;
};

export async function getMyAffiliateLinks(creatorId: string): Promise<MyAffiliateLink[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("affiliate_links")
    .select("id, code, commission_pct, products(title), affiliate_earnings(amount, status)")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((l) => {
    const product = l.products as unknown as { title: string } | null;
    const earnings = (l.affiliate_earnings as unknown as { amount: number; status: string }[]) ?? [];
    return {
      id: l.id,
      code: l.code,
      commissionPct: Number(l.commission_pct),
      productTitle: product?.title ?? "Product",
      totalEarnings: earnings.reduce((s, e) => s + Number(e.amount), 0),
      pendingEarnings: earnings.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0),
    };
  });
}
