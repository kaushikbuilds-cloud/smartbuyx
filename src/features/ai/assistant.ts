"use server";

import { createClient } from "@/lib/supabase/server";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
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

export type AssistantReply =
  | { ok: true; answer: string; products: AssistantProduct[] }
  | { ok: false; error: string };

type ChatTurn = { role: "user" | "assistant"; content: string };

// Search the live catalog — used as the model's tool.
async function searchProducts(params: {
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

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchProducts",
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
  },
];

const SYSTEM = `You are SmartBuyX AI, the shopping assistant for an Indian marketplace selling consumer products AND construction materials.
- ALWAYS call searchProducts before answering product questions — never invent items or prices.
- If results exist: recommend the best 1-3 with a one-line reason each (price, rating, value). Mention prices in ₹.
- If no results: say the catalog doesn't have it yet and suggest posting an RFQ at /rfq/new for construction needs.
- For construction quantity questions (e.g. cement for 1000 sqft), give a practical estimate: ~0.4 bags cement/sqft built-up area, steel ~3.5-4 kg/sqft, bricks ~8-10/sqft — then search for those materials.
- Keep answers under 120 words, friendly, India-context. No markdown headers; plain sentences and short bullet lines are fine.`;

export async function askAssistant(
  history: ChatTurn[],
  message: string
): Promise<AssistantReply> {
  if (!message.trim()) return { ok: false, error: "Type a question first." };
  if (!isOpenAIConfigured()) return { ok: false, error: "AI is not configured yet." };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    ...history.slice(-8).map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: message.trim() },
  ];

  const collected: AssistantProduct[] = [];

  try {
    // Tool loop — allow up to 3 tool rounds.
    for (let round = 0; round < 3; round++) {
      const res = await openai().chat.completions.create({
        model: AI_MODEL,
        temperature: 0.4,
        messages,
        tools: TOOLS,
      });

      const msg = res.choices[0]?.message;
      if (!msg) return { ok: false, error: "No response from AI." };

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push(msg);
        for (const call of msg.tool_calls) {
          if (call.type !== "function") continue;
          let results: AssistantProduct[] = [];
          try {
            const args = JSON.parse(call.function.arguments || "{}");
            results = await searchProducts(args);
          } catch { /* bad args → empty results */ }
          for (const r of results) {
            if (!collected.some((c) => c.id === r.id)) collected.push(r);
          }
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(
              results.map((r) => ({
                title: r.title, brand: r.brand, price: r.price, unit: r.unit,
                rating: r.rating, ratingCount: r.ratingCount, slug: r.slug,
              }))
            ),
          });
        }
        continue; // let the model see tool results
      }

      // Final answer.
      return { ok: true, answer: msg.content ?? "", products: collected.slice(0, 6) };
    }

    return { ok: true, answer: "I found these options:", products: collected.slice(0, 6) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI request failed." };
  }
}
