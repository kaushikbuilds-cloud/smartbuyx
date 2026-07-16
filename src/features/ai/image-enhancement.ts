"use server";

import OpenAI, { toFile } from "openai";
import { openai, isOpenAIConfigured } from "@/lib/ai/openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";

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
// OpenAI image edits, then re-uploads the result next to the original.
export async function enhanceProductImage(imageUrl: string): Promise<EnhanceResult> {
  await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  if (!isOpenAIConfigured()) return { error: "AI image enhancement isn't configured yet." };
  if (!isAllowedImageHost(imageUrl)) return { error: "Invalid image source." };

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return { error: "Couldn't fetch the original image." };
    const bytes = new Uint8Array(await res.arrayBuffer());
    const image = await toFile(bytes, "product.png", { type: "image/png" });

    const result = await openai().images.edit({
      model: "gpt-image-1",
      image,
      prompt: ENHANCE_PROMPT,
      size: "1024x1024",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) return { error: "AI enhancement returned no image." };

    const admin = createAdminClient();
    const path = `enhanced-${crypto.randomUUID()}.png`;
    const { error } = await admin.storage
      .from("product-images")
      .upload(path, Buffer.from(b64, "base64"), { contentType: "image/png" });
    if (error) return { error: error.message };

    const { data } = admin.storage.from("product-images").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err) {
    if (err instanceof OpenAI.APIError) return { error: err.message };
    return { error: "AI enhancement failed. Try again." };
  }
}
