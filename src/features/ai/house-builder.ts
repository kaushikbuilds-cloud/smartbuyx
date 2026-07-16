"use server";

import { z } from "zod";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { requireUser } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/utils/safe-error";

export type FloorPlanRoom = { name: string; approxSqft: number; notes: string };
export type BoqItem = { material: string; quantity: string; notes: string };
export type HouseBuilderOutput = {
  floorPlans: { floor: string; rooms: FloorPlanRoom[] }[];
  materialEstimate: BoqItem[];
  costEstimate: { low: number; high: number; currency: "INR" };
  summary: string;
};

export type HouseBuilderResult =
  | { ok: true; runId: string; output: HouseBuilderOutput }
  | { ok: false; error: string };

const inputSchema = z.object({
  sketchUrl: z.string().url(),
  plotSizeSqft: z.coerce.number().positive().max(100_000),
  floors: z.coerce.number().int().min(1).max(10),
  requirements: z.string().max(1000).optional().or(z.literal("")),
});

// Same class of concern as image-enhancement.ts: this action is invoked from
// a client component, so it's independently callable with any string — only
// ever fetch a sketch from our own house-plans bucket, never an arbitrary host.
function isAllowedSketchHost(url: string): boolean {
  try {
    const target = new URL(url);
    if (target.protocol !== "https:") return false;
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return target.hostname === supabaseUrl.hostname && target.pathname.includes("/house-plans/");
  } catch {
    return false;
  }
}

const outputSchema = z.object({
  floorPlans: z.array(
    z.object({
      floor: z.string(),
      rooms: z.array(z.object({ name: z.string(), approxSqft: z.number(), notes: z.string() })),
    })
  ),
  materialEstimate: z.array(z.object({ material: z.string(), quantity: z.string(), notes: z.string() })),
  costEstimate: z.object({ low: z.number(), high: z.number(), currency: z.literal("INR") }),
  summary: z.string(),
});

const SYSTEM = `You are an architectural planning assistant for SmartBuyX, an Indian construction marketplace.
Given a plot sketch/photo and requirements, produce a practical floor plan layout, bill of materials, and cost estimate
for the Indian construction market (₹/sqft norms: basic ~₹1500-1800/sqft, standard ~₹1800-2500/sqft, premium ~₹2500-3500/sqft).
Use realistic Indian residential room names and material quantities (cement in bags, steel in kg, bricks in count, tiles in sqft).
Return ONLY JSON matching this shape:
{
  "floorPlans": [{ "floor": "Ground Floor", "rooms": [{ "name": string, "approxSqft": number, "notes": string }] }],
  "materialEstimate": [{ "material": string, "quantity": string, "notes": string }],
  "costEstimate": { "low": number, "high": number, "currency": "INR" },
  "summary": "2-3 sentence plain-English summary"
}
Base floor count and total area on what's given. Keep room counts and sizes proportional to the stated plot size and floor count.`;

// AI House Builder: analyzes an uploaded plot sketch/photo with GPT-4o vision
// and generates a floor plan layout, bill of materials, and cost estimate.
// True 3D models/elevations are out of scope here (would need a dedicated 3D
// generation service) — this covers the layout + BOQ + cost half of the spec.
export async function generateHouseBuilderPlan(input: unknown): Promise<HouseBuilderResult> {
  const { user } = await requireUser();
  if (!isOpenAIConfigured()) return { ok: false, error: "AI House Builder isn't configured yet." };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (!isAllowedSketchHost(parsed.data.sketchUrl)) return { ok: false, error: "Invalid sketch source." };

  const rl = checkRateLimit(`house-builder:${user.id}`, 6, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  const supabase = await createClient();
  const { data: run, error: insertError } = await supabase
    .from("house_builder_runs")
    .insert({
      user_id: user.id,
      plot_size_sqft: parsed.data.plotSizeSqft,
      floors: parsed.data.floors,
      input: {
        sketch_url: parsed.data.sketchUrl,
        requirements: parsed.data.requirements || null,
      },
      status: "processing",
    })
    .select("id")
    .single();
  if (insertError || !run) return { ok: false, error: insertError?.message ?? "Could not start the run." };

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Plot size: ${parsed.data.plotSizeSqft} sqft. Floors: ${parsed.data.floors}. ${
                parsed.data.requirements ? `Requirements: ${parsed.data.requirements}` : "No specific requirements given."
              }`,
            },
            { type: "image_url", image_url: { url: parsed.data.sketchUrl } },
          ],
        },
      ],
    });

    const parsedOutput = outputSchema.safeParse(JSON.parse(res.choices[0]?.message?.content ?? "{}"));
    if (!parsedOutput.success) {
      await supabase.from("house_builder_runs").update({ status: "failed" }).eq("id", run.id);
      return { ok: false, error: "AI couldn't generate a plan from that sketch. Try a clearer photo." };
    }

    await supabase
      .from("house_builder_runs")
      .update({ status: "done", outputs: parsedOutput.data })
      .eq("id", run.id);

    return { ok: true, runId: run.id, output: parsedOutput.data };
  } catch (err) {
    await supabase.from("house_builder_runs").update({ status: "failed" }).eq("id", run.id);
    if (err instanceof OpenAI.APIError) return { ok: false, error: err.message };
    return { ok: false, error: safeErrorMessage(err, "AI House Builder failed. Try again.", "generateHouseBuilderPlan") };
  }
}

export async function listMyHouseBuilderRuns(userId: string) {
  const { user } = await requireUser();
  if (user.id !== userId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("house_builder_runs")
    .select("id, plot_size_sqft, floors, outputs, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}
