"use server";

import { z } from "zod";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { requireUser } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/utils/safe-error";
import { searchCatalog, type AssistantProduct } from "./catalog-tool";

export type ImageSearchReply =
  | { ok: true; detected: string; products: AssistantProduct[] }
  | { ok: false; error: string };

const detectionSchema = z.object({
  keywords: z.string().min(1),
  kind: z.enum(["product", "material"]).default("product"),
  description: z.string().default(""),
});

const SYSTEM = `You identify what's in a photo for an Indian marketplace's "search by photo" feature (consumer products + construction materials).
Return ONLY JSON: { "keywords": string (short catalog search terms, e.g. "wireless earbuds black" or "white ceramic floor tile"), "kind": "product"|"material", "description": string (one short friendly sentence naming what you see) }.
If the photo is unclear or not a shoppable item, still give your best-guess keywords.`;

// gpt-4o-mini (AI_MODEL) accepts image inputs, so no separate vision model
// or dependency is needed — same client used everywhere else in the app.
export async function searchByImage(imageDataUrl: string): Promise<ImageSearchReply> {
  const { user } = await requireUser();
  if (!imageDataUrl.startsWith("data:image/")) return { ok: false, error: "Invalid image." };
  if (!isOpenAIConfigured()) return { ok: false, error: "AI is not configured yet." };

  const rl = checkRateLimit(`image-search:${user.id}`, 15, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "What is this, for catalog search purposes?" },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    });

    const parsed = detectionSchema.safeParse(JSON.parse(res.choices[0]?.message?.content ?? "{}"));
    if (!parsed.success) return { ok: false, error: "Couldn't recognize that photo — try a clearer shot." };

    const products = await searchCatalog({ query: parsed.data.keywords, kind: parsed.data.kind, limit: 8 });
    return { ok: true, detected: parsed.data.description || parsed.data.keywords, products };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Image search failed.", "searchByImage") };
  }
}
