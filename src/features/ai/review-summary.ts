import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ReviewSummary = {
  headline: string;
  pros: string[];
  cons: string[];
};

const summarySchema = z.object({
  headline: z.string(),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
});

const MIN_REVIEWS = 3;

// Returns a cached AI summary if reviews haven't changed since it was made;
// otherwise generates a fresh one and caches it on the product row.
export async function getReviewSummary(
  productId: string,
  ratingCount: number
): Promise<ReviewSummary | null> {
  if (ratingCount < MIN_REVIEWS || !isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("ai_review_summary, ai_review_summary_count")
    .eq("id", productId)
    .single();

  // Cache hit: summary exists and review count is unchanged.
  if (product?.ai_review_summary && product.ai_review_summary_count === ratingCount) {
    return product.ai_review_summary as ReviewSummary;
  }

  if (!isOpenAIConfigured()) return (product?.ai_review_summary as ReviewSummary) ?? null;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, title, comment")
    .eq("target_type", "product")
    .eq("target_id", productId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (!reviews || reviews.length < MIN_REVIEWS) return null;

  const corpus = reviews
    .map((r) => `★${r.rating} ${r.title ?? ""} ${r.comment ?? ""}`.trim())
    .join("\n");

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Summarize customer reviews for an Indian marketplace product.
Return ONLY JSON: { "headline": one sentence <=15 words starting with "Customers say", "pros": [up to 4 short phrases], "cons": [up to 3 short phrases] }.
Be honest and specific. If reviews are mostly positive, cons can be [].`,
        },
        { role: "user", content: corpus },
      ],
    });

    const parsed = summarySchema.safeParse(JSON.parse(res.choices[0]?.message?.content ?? "{}"));
    if (!parsed.success) return null;
    const summary = parsed.data as ReviewSummary;

    // Cache it (service role — any viewer can trigger generation).
    const admin = createAdminClient();
    await admin
      .from("products")
      .update({ ai_review_summary: summary, ai_review_summary_count: ratingCount })
      .eq("id", productId);

    return summary;
  } catch {
    return (product?.ai_review_summary as ReviewSummary) ?? null;
  }
}
