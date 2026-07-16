"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { checkRateLimit } from "@/lib/rate-limit";

export type SupplierMatch = {
  userId: string;
  businessName: string;
  trustScore: number;
  ratingAvg: number;
  ratingCount: number;
  isLocal: boolean;
  reason: string;
};

export type MatchResult =
  | { ok: true; matches: SupplierMatch[]; by: "ai" | "heuristic" }
  | { ok: false; error: string };

const reasonsSchema = z.object({
  matches: z.array(z.object({ userId: z.string(), reason: z.string() })),
});

type Candidate = {
  user_id: string;
  business_name: string;
  bio: string | null;
  trust_score: number;
  rating_avg: number;
  rating_count: number;
  avg_response_minutes: number | null;
  service_pincodes: string[] | null;
};

// AI Supplier Matchmaking: instead of a flat list, recommend the best few
// suppliers for a specific need, each with a one-line reason. Ranks candidates
// by trust + rating + locality, then asks AI to justify the top picks. Works
// without AI (generic reasons) via the heuristic fallback.
export async function matchSuppliers(input: {
  need: string;
  pincode?: string;
  budget?: number;
}): Promise<MatchResult> {
  if (!input.need.trim()) return { ok: false, error: "Describe what you need first." };
  if (!isSupabaseConfigured()) return { ok: false, error: "Supplier directory isn't available yet." };

  // Public page, no login required — rate limit by IP instead of user id.
  // Vercel's edge sets/overwrites x-forwarded-for with the real client IP, so
  // this isn't client-spoofable there; on other hosts, confirm the same holds.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`match-suppliers:${ip}`, 15, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_profiles")
    .select("user_id, business_name, bio, trust_score, rating_avg, rating_count, avg_response_minutes, service_pincodes")
    .order("trust_score", { ascending: false })
    .limit(40);

  const candidates = (data ?? []) as Candidate[];
  if (candidates.length === 0) return { ok: true, matches: [], by: "heuristic" };

  // Score: trust (0..1) + rating (0..1) + locality bonus.
  const scored = candidates
    .map((c) => {
      const local = Boolean(input.pincode && c.service_pincodes?.includes(input.pincode));
      const score = (c.trust_score / 100) * 0.5 + (c.rating_avg / 5) * 0.3 + (local ? 0.2 : 0);
      return { c, local, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const base: SupplierMatch[] = scored.map(({ c, local }) => ({
    userId: c.user_id,
    businessName: c.business_name,
    trustScore: c.trust_score,
    ratingAvg: Number(c.rating_avg ?? 0),
    ratingCount: c.rating_count ?? 0,
    isLocal: local,
    reason: local
      ? `Trust ${c.trust_score}/100, delivers to your area${c.rating_count ? `, rated ${Number(c.rating_avg).toFixed(1)}★` : ""}.`
      : `Trust ${c.trust_score}/100${c.rating_count ? `, rated ${Number(c.rating_avg).toFixed(1)}★ (${c.rating_count})` : ""}${c.avg_response_minutes ? `, replies in ~${c.avg_response_minutes} min` : ""}.`,
  }));

  if (!isOpenAIConfigured()) return { ok: true, matches: base, by: "heuristic" };

  const profile = scored
    .map(({ c, local }) => `userId=${c.user_id} | name="${c.business_name}" | trust=${c.trust_score}/100 | rating=${Number(c.rating_avg).toFixed(1)}(${c.rating_count}) | local=${local} | responds=${c.avg_response_minutes ?? "?"}min | bio="${(c.bio ?? "").slice(0, 120)}"`)
    .join("\n");

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You match B2B buyers to suppliers on an Indian marketplace.
For the buyer's need, write a specific one-line reason (<=16 words) each supplier is a good fit,
citing trust score, rating, locality, or response time. Do not invent facts not in the data.
Return ONLY JSON: { "matches": [ { "userId": <id>, "reason": <string> } ] } for the suppliers given, same order.`,
        },
        {
          role: "user",
          content: `Need: ${input.need}${input.budget ? `\nBudget: ₹${input.budget}` : ""}${input.pincode ? `\nPincode: ${input.pincode}` : ""}\n\nSuppliers:\n${profile}`,
        },
      ],
    });

    const parsed = reasonsSchema.safeParse(JSON.parse(res.choices[0]?.message?.content ?? "{}"));
    if (!parsed.success) return { ok: true, matches: base, by: "heuristic" };

    const reasonById = new Map(parsed.data.matches.map((m) => [m.userId, m.reason]));
    const withReasons = base.map((m) => ({ ...m, reason: reasonById.get(m.userId) ?? m.reason }));
    return { ok: true, matches: withReasons, by: "ai" };
  } catch {
    return { ok: true, matches: base, by: "heuristic" };
  }
}
