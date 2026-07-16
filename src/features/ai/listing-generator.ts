"use server";

import { z } from "zod";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { requireRole } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/utils/safe-error";

const SELLER_ROLES = ["supplier", "d2c_brand", "admin", "superadmin"] as const;

export type GeneratedListing = {
  title: string;
  description: string;
  brand: string;
  unit: string;
  keywords: string[];
  suggestedPrice: number;
  kind: "product" | "material";
};

export type GenerateResult =
  | { ok: true; listing: GeneratedListing }
  | { ok: false; error: string };

const listingSchema = z.object({
  title: z.string(),
  description: z.string(),
  brand: z.string().default(""),
  unit: z.string().default(""),
  keywords: z.array(z.string()).default([]),
  suggestedPrice: z.coerce.number().nonnegative().default(0),
  kind: z.enum(["product", "material"]).default("product"),
});

export async function generateListing(prompt: string): Promise<GenerateResult> {
  const { user } = await requireRole(...SELLER_ROLES);

  if (!prompt.trim()) return { ok: false, error: "Describe the product first." };
  if (!isOpenAIConfigured()) return { ok: false, error: "AI is not configured (missing OpenAI key)." };
  const rl = checkRateLimit(`listing:${user.id}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  const system = `You are a product-listing assistant for SmartBuyX, an Indian marketplace selling both consumer products and construction materials.
Given a short product description, produce a compelling, SEO-friendly listing.
Rules:
- title: max 12 words, include brand + key spec.
- description: 2-3 short sentences, benefit-led, India-relevant, no markdown.
- brand: the brand if identifiable, else "".
- unit: the selling unit ("piece","kg","bag","litre","m","m2","box"). For construction materials pick the natural unit.
- keywords: 5-8 lowercase SEO search terms buyers would type.
- suggestedPrice: a realistic INR price (number only, no symbol). Base it on typical Indian market pricing.
- kind: "material" for construction/building goods (cement, steel, tiles, paint, sand, pipes...), otherwise "product".
Return ONLY valid JSON with keys: title, description, brand, unit, keywords, suggestedPrice, kind.`;

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt.trim() },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = listingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ok: false, error: "AI returned an unexpected format. Try again." };

    return { ok: true, listing: parsed.data as GeneratedListing };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "AI request failed.", "generateListing") };
  }
}
