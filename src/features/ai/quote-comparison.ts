import { z } from "zod";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import type { Quote } from "@/features/rfq/queries";

export type QuoteVerdict = {
  recommendedQuoteId: string;
  headline: string;       // one-line recommendation
  reasoning: string;      // why this quote wins
  bestValueBy: "ai" | "heuristic";
};

const verdictSchema = z.object({
  recommendedQuoteId: z.string(),
  headline: z.string(),
  reasoning: z.string(),
});

// Deterministic best-value pick: normalise price (cheaper = better) and blend
// with the supplier trust score. Always available, even without an AI key.
function heuristicPick(quotes: Quote[]): QuoteVerdict | null {
  if (quotes.length === 0) return null;
  const amounts = quotes.map((q) => q.amount);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const span = max - min || 1;

  let best = quotes[0];
  let bestScore = -Infinity;
  for (const q of quotes) {
    const priceScore = 1 - (q.amount - min) / span; // 1 = cheapest
    const trustScore = (q.trust_score ?? 50) / 100;   // 0..1
    const score = priceScore * 0.6 + trustScore * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = q;
    }
  }

  const cheapest = best.amount === min;
  return {
    recommendedQuoteId: best.id,
    headline: `${best.supplier_name ?? "This supplier"} offers the best overall value`,
    reasoning: cheapest
      ? `Lowest price at ${formatRs(best.amount)} with a solid trust score of ${best.trust_score ?? "—"}.`
      : `Best balance of price (${formatRs(best.amount)}) and supplier trust (${best.trust_score ?? "—"}/100), even though it isn't the cheapest.`,
    bestValueBy: "heuristic",
  };
}

function formatRs(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

// Compares quotes on an RFQ and recommends the best value. Falls back to the
// deterministic heuristic when OpenAI isn't configured or the call fails.
export async function compareQuotes(
  quotes: Quote[],
  context: { title: string; budgetMin?: number | null; budgetMax?: number | null }
): Promise<QuoteVerdict | null> {
  const fallback = heuristicPick(quotes);
  if (quotes.length < 2 || !isOpenAIConfigured()) return fallback;

  const lines = quotes
    .map((q) => `id=${q.id} | supplier="${q.supplier_name ?? "Supplier"}" | price=${q.amount} | trust=${q.trust_score ?? "?"}/100 | note="${(q.message ?? "").slice(0, 200)}"`)
    .join("\n");
  const budget =
    context.budgetMin || context.budgetMax
      ? `Buyer budget: ${context.budgetMin ?? "—"} to ${context.budgetMax ?? "—"}.`
      : "No stated budget.";

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You compare supplier quotes for a B2B procurement request on an Indian marketplace.
Weigh price against supplier trust score and any warranty/delivery/payment terms in the note.
The cheapest is not always best — a low price from a low-trust supplier is risky.
Return ONLY JSON: { "recommendedQuoteId": <one id from the list>, "headline": one sentence <=14 words, "reasoning": 1-2 sentences citing price and trust }.`,
        },
        { role: "user", content: `Request: ${context.title}\n${budget}\n\nQuotes:\n${lines}` },
      ],
    });

    const parsed = verdictSchema.safeParse(JSON.parse(res.choices[0]?.message?.content ?? "{}"));
    if (!parsed.success) return fallback;
    // Guard against the model inventing an id.
    if (!quotes.some((q) => q.id === parsed.data.recommendedQuoteId)) return fallback;

    return { ...parsed.data, bestValueBy: "ai" };
  } catch {
    return fallback;
  }
}
