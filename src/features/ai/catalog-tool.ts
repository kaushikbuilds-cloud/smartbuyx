// Shared OpenAI function-calling tool for searching SmartBuyX's live catalog.
// Extracted from assistant.ts so gift-finder and shopping-planner can reuse
// the exact same tool contract instead of re-declaring it.
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type OpenAI from "openai";

export type AssistantProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAt: number | null;
  unit: string | null;
  brand: string | null;
  rating: number;
  ratingCount: number;
  image: string | null;
};

export async function searchCatalog(params: {
  query?: string;
  kind?: "product" | "material";
  maxPrice?: number;
  minRating?: number;
  limit?: number;
}): Promise<AssistantProduct[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select("id, title, slug, base_price, compare_at_price, unit, brand, rating_avg, rating_count, images")
    .eq("status", "active");

  if (params.kind) q = q.eq("kind", params.kind);
  if (params.query) q = q.textSearch("search_tsv", params.query, { type: "websearch", config: "simple" });
  if (params.maxPrice) q = q.lte("base_price", params.maxPrice);
  if (params.minRating) q = q.gte("rating_avg", params.minRating);

  const { data } = await q
    .order("rating_avg", { ascending: false })
    .order("sales_count", { ascending: false })
    .limit(Math.min(params.limit ?? 6, 10));

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    price: Number(p.base_price),
    compareAt: p.compare_at_price ? Number(p.compare_at_price) : null,
    unit: p.unit,
    brand: p.brand,
    rating: Number(p.rating_avg ?? 0),
    ratingCount: p.rating_count ?? 0,
    image: (p.images as { url: string }[] | null)?.[0]?.url ?? null,
  }));
}

export const CATALOG_SEARCH_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "searchCatalog",
    description:
      "Search SmartBuyX's live catalog of consumer products and construction materials. Use for any product question, comparison, or budget query.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "search keywords, e.g. 'cement 50kg' or 'wireless earbuds'" },
        kind: { type: "string", enum: ["product", "material"], description: "material = construction goods" },
        maxPrice: { type: "number", description: "max price in INR" },
        minRating: { type: "number", description: "minimum star rating 1-5" },
        limit: { type: "number", description: "how many results, default 6" },
      },
    },
  },
};
