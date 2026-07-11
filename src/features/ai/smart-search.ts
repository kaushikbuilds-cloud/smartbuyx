import { z } from "zod";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";

export type ParsedQuery = {
  keywords: string;
  maxPrice?: number;
  minPrice?: number;
  minRating?: number;
  kind?: "product" | "material";
};

const parsedSchema = z.object({
  keywords: z.string().default(""),
  maxPrice: z.coerce.number().positive().optional(),
  minPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  kind: z.enum(["product", "material"]).optional(),
});

// Simple per-instance cache so repeated searches don't re-hit OpenAI.
const cache = new Map<string, ParsedQuery>();
const CACHE_MAX = 500;

// Heuristic: only worth an AI parse when the query looks like natural language
// (price words, rupee amounts, or 3+ words). Plain keywords skip the AI call.
export function looksNatural(q: string): boolean {
  if (/(under|below|above|less than|cheaper|₹|rs\.?|rupees|budget|best|top rated)/i.test(q)) return true;
  return q.trim().split(/\s+/).length >= 4;
}

export async function parseSmartQuery(q: string): Promise<ParsedQuery> {
  const fallback: ParsedQuery = { keywords: q };
  const key = q.trim().toLowerCase();
  if (!key) return fallback;

  const hit = cache.get(key);
  if (hit) return hit;
  if (!isOpenAIConfigured() || !looksNatural(q)) return fallback;

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Parse an Indian marketplace search query into structured filters.
Return ONLY JSON: { "keywords": string (the product terms, no price words), "maxPrice"?: number (INR), "minPrice"?: number, "minRating"?: number 1-5, "kind"?: "product"|"material" }.
"material" = construction goods (cement, steel, tiles, paint, sand, bricks, pipes, wires).
Examples:
"black shoes under 2000" -> {"keywords":"black shoes","maxPrice":2000}
"best cement under ₹450 per bag" -> {"keywords":"cement","maxPrice":450,"kind":"material","minRating":4}
"top rated earbuds" -> {"keywords":"earbuds","minRating":4}`,
        },
        { role: "user", content: q.trim() },
      ],
    });

    const parsed = parsedSchema.safeParse(JSON.parse(res.choices[0]?.message?.content ?? "{}"));
    const result: ParsedQuery = parsed.success && parsed.data.keywords
      ? (parsed.data as ParsedQuery)
      : fallback;

    if (cache.size >= CACHE_MAX) cache.clear();
    cache.set(key, result);
    return result;
  } catch {
    return fallback;
  }
}
