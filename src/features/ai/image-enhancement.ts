"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";

// Gemini's OpenAI-compatibility layer (used everywhere else in src/lib/ai/openai.ts)
// only covers chat completions, not image generation/editing -- so this one
// feature talks to Gemini's native image model directly instead. Still just
// the one GEMINI_API_KEY across the whole app.
const IMAGE_MODEL = "gemini-2.5-flash-image";

function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const ENHANCE_PROMPT =
  "Enhance this product photo for an e-commerce listing: even, bright studio lighting, " +
  "a clean plain white background, sharpened detail, true-to-life colours. Keep the product itself unchanged.";

export type EnhanceResult = { url?: string; error?: string };

// This action is invoked from a client component, so it's independently
// callable with any string — never trust imageUrl as "always our own upload".
// Only ever fetch from our own Supabase Storage bucket, never an arbitrary
// caller-supplied host (that would be SSRF: an authenticated seller could
// otherwise point this server-side fetch at internal services or a cloud
// metadata endpoint).
function isAllowedImageHost(url: string): boolean {
  try {
    const target = new URL(url);
    if (target.protocol !== "https:") return false;
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return target.hostname === supabaseUrl.hostname && target.pathname.includes("/product-images/");
  } catch {
    return false;
  }
}

// Cleans up a seller-uploaded product photo (better lighting/background) via
// Gemini's native image model (image-in, image-out), then re-uploads the
// result next to the original.
export async function enhanceProductImage(imageUrl: string): Promise<EnhanceResult> {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  if (!isGeminiConfigured()) return { error: "AI image enhancement isn't configured yet." };
  if (!isAllowedImageHost(imageUrl)) return { error: "Invalid image source." };
  // Tighter limit than text AI calls — image generation costs meaningfully more per call.
  const rl = checkRateLimit(`enhance:${user.id}`, 8, 60_000);
  if (!rl.ok) return { error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return { error: "Couldn't fetch the original image." };
    const bytes = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get("content-type") ?? "image/png";

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: ENHANCE_PROMPT },
                { inline_data: { mime_type: mimeType, data: bytes.toString("base64") } },
              ],
            },
          ],
        }),
      }
    );
    if (!geminiRes.ok) return { error: "AI enhancement failed. Try again." };
    const body = await geminiRes.json();
    const parts = body.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
    const b64 = imagePart?.inlineData?.data;
    if (!b64) return { error: "AI enhancement returned no image." };

    const admin = createAdminClient();
    const path = `enhanced-${crypto.randomUUID()}.png`;
    const { error } = await admin.storage
      .from("product-images")
      .upload(path, Buffer.from(b64, "base64"), { contentType: "image/png" });
    if (error) return { error: error.message };

    const { data } = admin.storage.from("product-images").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch {
    return { error: "AI enhancement failed. Try again." };
  }
}
