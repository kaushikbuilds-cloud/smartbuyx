"use server";

import { createClient } from "@/lib/supabase/server";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeErrorMessage } from "@/lib/utils/safe-error";
import type OpenAI from "openai";

export type DraftPoItem = { title: string; quantity: number; unit: string | null; unitPrice: number };
export type DraftPo = { title: string; supplierName: string | null; items: DraftPoItem[] };

export type ProcurementReply =
  | { ok: true; answer: string; draftPo: DraftPo | null }
  | { ok: false; error: string };

type ChatTurn = { role: "user" | "assistant"; content: string };

async function searchCatalog(params: { query?: string; kind?: "product" | "material"; maxPrice?: number; limit?: number }) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select("title, base_price, unit, brand, rating_avg, rating_count")
    .eq("status", "active");
  if (params.kind) q = q.eq("kind", params.kind);
  if (params.query) q = q.textSearch("search_tsv", params.query, { type: "websearch", config: "simple" });
  if (params.maxPrice) q = q.lte("base_price", params.maxPrice);
  const { data } = await q.order("rating_avg", { ascending: false }).limit(Math.min(params.limit ?? 6, 10));
  return (data ?? []).map((p) => ({
    title: p.title,
    price: Number(p.base_price),
    unit: p.unit,
    brand: p.brand,
    rating: Number(p.rating_avg ?? 0),
    ratingCount: p.rating_count ?? 0,
  }));
}

async function findSuppliers(params: { pincode?: string; limit?: number }) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase.from("supplier_profiles").select("business_name, trust_score, rating_avg, service_pincodes");
  if (params.pincode) q = q.contains("service_pincodes", [params.pincode]);
  const { data } = await q.order("trust_score", { ascending: false }).limit(Math.min(params.limit ?? 5, 10));
  return (data ?? []).map((s) => ({
    name: s.business_name,
    trust: s.trust_score,
    rating: Number(s.rating_avg ?? 0),
  }));
}

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchCatalog",
      description: "Search the live catalog of products and construction materials for real prices before quoting.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          kind: { type: "string", enum: ["product", "material"] },
          maxPrice: { type: "number" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "findSuppliers",
      description: "Find top verified suppliers, optionally by pincode, ranked by trust score.",
      parameters: {
        type: "object",
        properties: { pincode: { type: "string" }, limit: { type: "number" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draftPurchaseOrder",
      description:
        "Draft a purchase order for the buyer to review. Only call this once you have real prices from searchCatalog and the buyer has confirmed what they want.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "short PO title, e.g. 'Cement + steel for slab'" },
          supplierName: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                unitPrice: { type: "number", description: "price per unit in INR" },
              },
              required: ["title", "quantity", "unitPrice"],
            },
          },
        },
        required: ["title", "items"],
      },
    },
  },
];

const SYSTEM = `You are SmartBuyX Procurement AI, a B2B buying assistant for an Indian marketplace (products + construction materials).
- Help buyers find materials/products, compare suppliers, estimate quantities and costs, and prepare purchase orders.
- ALWAYS call searchCatalog for real prices before quoting any number — never invent prices.
- For construction estimates use practical norms: cement ~0.4 bag/sqft built-up, steel ~4 kg/sqft, bricks ~8-10/sqft, then search those materials.
- Call findSuppliers when the buyer asks who to buy from.
- When the buyer is ready, call draftPurchaseOrder with real unit prices you found. Do not draft a PO until you have prices.
- Keep replies under 130 words, India-context, plain sentences. Mention prices in ₹.`;

export async function askProcurement(history: ChatTurn[], message: string): Promise<ProcurementReply> {
  const { user } = await requireUser(); // the page that renders this chat is gated, but Server Actions are independently callable
  if (!message.trim()) return { ok: false, error: "Type a request first." };
  if (!isOpenAIConfigured()) return { ok: false, error: "AI is not configured yet." };
  const rl = checkRateLimit(`procurement:${user.id}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many requests — try again in ${rl.retryAfterSeconds}s.` };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    ...history.slice(-8).map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: message.trim() },
  ];

  let draftPo: DraftPo | null = null;

  try {
    for (let round = 0; round < 4; round++) {
      const res = await openai().chat.completions.create({
        model: AI_MODEL,
        temperature: 0.4,
        messages,
        tools: TOOLS,
      });
      const msg = res.choices[0]?.message;
      if (!msg) return { ok: false, error: "No response from AI." };

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push(msg);
        for (const call of msg.tool_calls) {
          if (call.type !== "function") continue;
          let result: unknown = {};
          try {
            const args = JSON.parse(call.function.arguments || "{}");
            if (call.function.name === "searchCatalog") result = await searchCatalog(args);
            else if (call.function.name === "findSuppliers") result = await findSuppliers(args);
            else if (call.function.name === "draftPurchaseOrder") {
              const items: DraftPoItem[] = (args.items ?? []).map((i: DraftPoItem) => ({
                title: String(i.title),
                quantity: Number(i.quantity),
                unit: i.unit ? String(i.unit) : null,
                unitPrice: Number(i.unitPrice),
              }));
              draftPo = { title: String(args.title ?? "Purchase order"), supplierName: args.supplierName ?? null, items };
              result = { drafted: true, itemCount: items.length };
            }
          } catch { /* bad args → empty */ }
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        }
        continue;
      }

      return { ok: true, answer: msg.content ?? "", draftPo };
    }
    return { ok: true, answer: "Here's what I found.", draftPo };
  } catch (e) {
    return { ok: false, error: safeErrorMessage(e, "AI request failed.", "askProcurement") };
  }
}
