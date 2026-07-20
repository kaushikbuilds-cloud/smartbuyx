"use server";

import { z } from "zod";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { requireUser } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/utils/safe-error";
import { searchCatalog, type AssistantProduct } from "./catalog-tool";

export type PlanCategory = {
  category: string;
  budget: number;
  note: string;
  products: AssistantProduct[];
};

export type ShoppingPlanReply =
  | { ok: true; totalBudget: number; allocated: number; categories: PlanCategory[] }
  | { ok: false; error: string };

const allocationSchema = z.object({
  categories: z
    .array(
      z.object({
        category: z.string().min(1),
        budget: z.coerce.number().positive(),
        query: z.string().min(1), // search keywords for this category
        note: z.string().default(""),
      })
    )
    .min(1)
    .max(6),
});

const SYSTEM = `You are SmartBuyX's AI shopping planner for an Indian marketplace (consumer products + construction materials).
Given a shopping goal and total budget in INR, break it into 3-6 sensible categories with a budget split that sums to roughly the total (do not exceed it).
Return ONLY JSON: { "categories": [ { "category": string, "budget": number, "query": string (catalog search keywords for this category), "note": string (one short line on why/what to look for) } ] }
Examples:
Goal "Diwali home decor and gifting under ₹15000" -> categories like Home Decor, Lighting/Diyas, Gifting, Festive Wear -- each with a budget slice and a short note.
Goal "new home setup under ₹50000" -> Furniture, Kitchen essentials, Lighting, Decor.
Keep category names short (1-3 words). query should be plain catalog search terms, no price words.`;

export async function planShopping(goal: string, totalBudget: number): Promise<ShoppingPlanReply> {
  const { user } = await requireUser();
  if (!goal.trim()) return { ok: false, error: "Describe what you're shopping for." };
  if (!totalBudget || totalBudget <= 0) return { ok: false, error: "Enter a total budget." };
  if (!isOpenAIConfigured()) return { ok: false, error: "AI is not configured yet." };

  const rl = checkRateLimit(`shopping-planner:${user.id}`, 10, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  try {
    const res = await openai().chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Goal: ${goal.trim()}\nTotal budget: ₹${totalBudget}` },
      ],
    });

    const parsed = allocationSchema.safeParse(JSON.parse(res.choices[0]?.message?.content ?? "{}"));
    if (!parsed.success) return { ok: false, error: "Couldn't build a plan for that — try rephrasing." };

    // Cap allocations to the stated total, proportionally, in case the model overshoots.
    const rawTotal = parsed.data.categories.reduce((s, c) => s + c.budget, 0);
    const scale = rawTotal > totalBudget ? totalBudget / rawTotal : 1;

    const categories: PlanCategory[] = await Promise.all(
      parsed.data.categories.map(async (c) => {
        const budget = Math.round(c.budget * scale);
        const products = await searchCatalog({ query: c.query, maxPrice: budget, limit: 4 });
        return { category: c.category, budget, note: c.note, products };
      })
    );

    const allocated = categories.reduce((s, c) => s + c.budget, 0);
    return { ok: true, totalBudget, allocated, categories };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "Shopping planner failed.", "planShopping") };
  }
}
