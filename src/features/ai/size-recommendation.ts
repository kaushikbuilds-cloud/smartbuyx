"use server";

import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/utils/safe-error";

export type SizeRecommendationReply =
  | { ok: true; size: string; reasoning: string }
  | { ok: false; error: string };

export type SizeInput = {
  productId: string;
  heightCm?: number;
  weightKg?: number;
  usualSize?: string; // e.g. "US 8", "UK M", "usually Medium in H&M"
  notes?: string;
};

const SYSTEM = `You recommend a clothing size from a seller's size chart for an Indian apparel marketplace.
The chart maps size labels to chest measurement in inches (e.g. {"S":36,"M":38,"L":40}).
Given the shopper's height/weight/usual-size-elsewhere info, pick the single best-fitting size label from the chart and explain briefly (1-2 sentences, friendly, mention the measurement).
If the shopper gives a usual size from another brand/region, convert sensibly (e.g. "US 8" or "UK 10" typically maps to a specific chest range) rather than just matching the label text.
Return ONLY JSON: { "size": string (must be one of the chart's keys), "reasoning": string }.`;

export async function recommendSize(input: SizeInput): Promise<SizeRecommendationReply> {
  const { user } = await requireUser();
  if (!isOpenAIConfigured()) return { ok: false, error: "AI is not configured yet." };
  if (!input.heightCm && !input.weightKg && !input.usualSize?.trim()) {
    return { ok: false, error: "Give at least your height, weight, or usual size somewhere else." };
  }

  const rl = checkRateLimit(`size-rec:${user.id}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("title, attributes")
    .eq("id", input.productId)
    .single();

  const sizeChart = (product?.attributes as Record<string, unknown> | undefined)?.size_chart as Record<string, number> | undefined;
  if (!sizeChart || Object.keys(sizeChart).length === 0) {
    return { ok: false, error: "This product doesn't have a size chart yet." };
  }

  const shopperInfo = [
    input.heightCm ? `Height: ${input.heightCm}cm` : null,
    input.weightKg ? `Weight: ${input.weightKg}kg` : null,
    input.usualSize?.trim() ? `Usual size elsewhere: ${input.usualSize.trim()}` : null,
    input.notes?.trim() ? `Notes: ${input.notes.trim()}` : null,
  ].filter(Boolean).join("\n");

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Product: ${product?.title}\nSize chart (chest, inches): ${JSON.stringify(sizeChart)}\n\n${shopperInfo}`,
        },
      ],
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    if (typeof parsed.size !== "string" || !sizeChart[parsed.size.toUpperCase()]) {
      return { ok: false, error: "Couldn't determine a size from that — try adding more detail." };
    }
    return { ok: true, size: parsed.size.toUpperCase(), reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "" };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Size recommendation failed.", "recommendSize") };
  }
}
