"use server";

import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { requireUser } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/utils/safe-error";
import { searchCatalog, CATALOG_SEARCH_TOOL, type AssistantProduct } from "./catalog-tool";
import type OpenAI from "openai";

export type GiftFinderInput = {
  recipient: string; // e.g. "my mom", "a colleague", "my 8-year-old nephew"
  occasion: string; // e.g. "birthday", "Diwali", "anniversary"
  budget: number; // INR
  interests?: string; // free text, optional
};

export type GiftFinderReply =
  | { ok: true; answer: string; products: AssistantProduct[] }
  | { ok: false; error: string };

const SYSTEM = `You are SmartBuyX's AI gift finder for an Indian marketplace.
- ALWAYS call searchCatalog at least once (often 2-3 times with different queries) to find real, diverse gift ideas — never invent products or prices.
- Suggest 3-6 varied ideas across different categories when possible (not six of the same type of item), each with a one-line reason tied to the recipient/occasion.
- Respect the budget strictly — do not suggest items over it.
- Mention prices in ₹. Keep the whole answer under 130 words, warm and friendly, India-context (festivals, relationships, etc.).
- If nothing suitable is found within budget, say so plainly and suggest raising the budget.`;

export async function findGifts(input: GiftFinderInput): Promise<GiftFinderReply> {
  const { user } = await requireUser();
  if (!input.recipient.trim() || !input.occasion.trim()) return { ok: false, error: "Tell me who it's for and the occasion." };
  if (!input.budget || input.budget <= 0) return { ok: false, error: "Enter a budget." };
  if (!isOpenAIConfigured()) return { ok: false, error: "AI is not configured yet." };

  const rl = checkRateLimit(`gift-finder:${user.id}`, 15, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  const userPrompt = `Recipient: ${input.recipient.trim()}
Occasion: ${input.occasion.trim()}
Budget: ₹${input.budget}
${input.interests?.trim() ? `Interests/notes: ${input.interests.trim()}` : ""}`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: userPrompt },
  ];

  const collected: AssistantProduct[] = [];

  try {
    for (let round = 0; round < 3; round++) {
      const res = await openai().chat.completions.create({
        model: AI_MODEL,
        temperature: 0.6,
        messages,
        tools: [CATALOG_SEARCH_TOOL],
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
            results = await searchCatalog({ ...args, maxPrice: args.maxPrice ?? input.budget });
          } catch { /* bad args -> empty results */ }
          for (const r of results) {
            if (!collected.some((c) => c.id === r.id)) collected.push(r);
          }
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(
              results.map((r) => ({ title: r.title, brand: r.brand, price: r.price, unit: r.unit, rating: r.rating, slug: r.slug }))
            ),
          });
        }
        continue;
      }

      return { ok: true, answer: msg.content ?? "", products: collected.filter((p) => p.price <= input.budget).slice(0, 6) };
    }

    return { ok: true, answer: "Here's what I found:", products: collected.filter((p) => p.price <= input.budget).slice(0, 6) };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Gift finder failed.", "findGifts") };
  }
}
