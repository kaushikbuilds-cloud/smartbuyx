import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type CompetitorRow = {
  competitorId: string;
  title: string;
  brand: string | null;
  price: number;
  rating: number;
  ratingCount: number;
  salesCount: number;
};

export type CompetitiveProduct = {
  productId: string;
  title: string;
  myPrice: number;
  myRating: number;
  mySales: number;
  competitors: CompetitorRow[];
  avgCompetitorPrice: number | null;
  pricePosition: "cheapest" | "competitive" | "expensive" | "no_competition";
  recommendation: string;
};

// Internal competitor analysis: compares each of the seller's products
// against other active listings in the same category on SmartBuyX itself.
// (No external marketplace scraping — this is honest, real data we actually have.)
export async function getCompetitorAnalysis(sellerId: string): Promise<CompetitiveProduct[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: myProducts } = await supabase
    .from("products")
    .select("id, title, category_id, base_price, rating_avg, sales_count")
    .eq("supplier_id", sellerId)
    .eq("status", "active")
    .not("category_id", "is", null);

  if (!myProducts || myProducts.length === 0) return [];

  const results: CompetitiveProduct[] = [];

  for (const p of myProducts) {
    const { data: rivals } = await supabase
      .from("products")
      .select("id, title, brand, base_price, rating_avg, rating_count, sales_count, supplier_id")
      .eq("category_id", p.category_id)
      .eq("status", "active")
      .neq("supplier_id", sellerId)
      .order("sales_count", { ascending: false })
      .limit(5);

    const competitors: CompetitorRow[] = (rivals ?? []).map((r) => ({
      competitorId: r.id,
      title: r.title,
      brand: r.brand,
      price: Number(r.base_price),
      rating: Number(r.rating_avg),
      ratingCount: r.rating_count,
      salesCount: r.sales_count,
    }));

    const myPrice = Number(p.base_price);
    const avgCompetitorPrice = competitors.length > 0
      ? Math.round(competitors.reduce((s, c) => s + c.price, 0) / competitors.length)
      : null;

    let pricePosition: CompetitiveProduct["pricePosition"] = "no_competition";
    let recommendation = "No similar listings yet — you set the market here.";

    if (avgCompetitorPrice !== null) {
      const diff = (myPrice - avgCompetitorPrice) / avgCompetitorPrice;
      if (diff <= -0.08) {
        pricePosition = "cheapest";
        recommendation = `You're ${Math.abs(Math.round(diff * 100))}% below the category average — good for volume, consider a small raise if stock is tight.`;
      } else if (diff >= 0.08) {
        pricePosition = "expensive";
        recommendation = `You're ${Math.round(diff * 100)}% above the category average (₹${avgCompetitorPrice}). Consider matching or justify with quality/rating.`;
      } else {
        pricePosition = "competitive";
        recommendation = "Priced in line with the category — competitive.";
      }
    }

    results.push({
      productId: p.id,
      title: p.title,
      myPrice,
      myRating: Number(p.rating_avg),
      mySales: p.sales_count,
      competitors,
      avgCompetitorPrice,
      pricePosition,
      recommendation,
    });
  }

  return results;
}
