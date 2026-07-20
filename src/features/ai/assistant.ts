"use server";

import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { requireUser } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/utils/safe-error";
import { searchCatalog, CATALOG_SEARCH_TOOL, type AssistantProduct } from "./catalog-tool";
import type OpenAI from "openai";

export type { AssistantProduct };

export type AssistantReply =
  | { ok: true; answer: string; products: AssistantProduct[] }
  | { ok: false; error: string };

type ChatTurn = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are SmartBuyX AI, the shopping assistant for an Indian marketplace selling consumer products AND construction materials.
- ALWAYS call searchCatalog before answering product questions — never invent items or prices.
- If results exist: recommend the best 1-3 with a one-line reason each (price, rating, value). Mention prices in ₹.
- If no results: say the catalog doesn't have it yet and suggest posting an RFQ at /rfq/new for construction needs.
- For construction quantity questions (e.g. cement for 1000 sqft), give a practical estimate: ~0.4 bags cement/sqft built-up area, steel ~3.5-4 kg/sqft, bricks ~8-10/sqft — then search for those materials.
- Keep answers under 120 words, friendly, India-context. No markdown headers; plain sentences and short bullet lines are fine.`;

export async function askAssistant(
  history: ChatTurn[],
  message: string
): Promise<AssistantReply> {
  const { user } = await requireUser(); // the page that renders this chat is gated, but Server Actions are independently callable
  if (!message.trim()) return { ok: false, error: "Type a question first." };
  if (!isOpenAIConfigured()) return { ok: false, error: "AI is not configured yet." };
  const rl = checkRateLimit(`assistant:${user.id}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many questions — try again in ${rl.retryAfterSeconds}s.` };

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
            results = await searchCatalog(args);
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
    return { ok: false, error: safeErrorMessage(e, "AI request failed.", "askAssistant") };
  }
}
