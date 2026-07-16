"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { openai, isOpenAIConfigured, AI_MODEL } from "@/lib/ai/openai";
import { checkRateLimit } from "@/lib/rate-limit";
import type OpenAI from "openai";

export type SupportReply =
  | { ok: true; answer: string }
  | { ok: false; error: string };

type ChatTurn = { role: "user" | "assistant"; content: string };

// Look up the signed-in user's recent orders (RLS scopes to their own rows).
async function getMyOrders(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, total, created_at, order_items(title, quantity)")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []).map((o) => ({
    orderId: o.id.slice(0, 8),
    status: o.status,
    total: Number(o.total),
    placed: o.created_at,
    items: (o.order_items as { title: string; quantity: number }[] | null)?.map(
      (i) => `${i.title} x${i.quantity}`
    ),
  }));
}

async function getMyReturns(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("return_requests")
    .select("id, status, amount, reason, created_at, order_items(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []).map((r) => ({
    returnId: r.id.slice(0, 8),
    status: r.status,
    amount: Number(r.amount),
    reason: r.reason,
    item: (r.order_items as unknown as { title: string } | null)?.title,
  }));
}

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getMyOrders",
      description: "Get the customer's 5 most recent orders with status, items and totals.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyReturns",
      description: "Get the customer's recent return/refund requests with status.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const SYSTEM = `You are SmartBuyX Support, helping customers of an Indian marketplace.
Platform facts you can rely on:
- Orders flow: pending → paid → processing → shipped → delivered. Track at /orders.
- Returns: allowed within 7 days of delivery from the order page. Refunds credit the SmartBuyX wallet within 24h of pickup.
- Escrow: payment is held until the buyer confirms delivery, then released to the seller.
- Wallet/Smart Coins: 1 coin = ₹1, usable on any purchase; earned via referrals (100/friend) and cashback.
- Payments: Razorpay (UPI, cards, net banking). Saved UPI under Settings → Payments.
- Sellers: apply via supplier dashboard; GST-verified sellers get a Trust Score badge.
- Contact: hello@smartbuyx.in for anything you cannot resolve.
Rules:
- Use getMyOrders / getMyReturns whenever the user asks about "my order", delivery status, or refunds — never guess.
- Reference orders by their short id (e.g. #AB12CD34).
- Be concise (<100 words), warm, India-context. If the issue needs a human, say to email hello@smartbuyx.in with the order id.`;

export async function askSupport(history: ChatTurn[], message: string): Promise<SupportReply> {
  const { user } = await requireUser();
  if (!message.trim()) return { ok: false, error: "Type a question first." };
  if (!isOpenAIConfigured()) return { ok: false, error: "AI support is not configured yet." };
  const rl = checkRateLimit(`support:${user.id}`, 20, 60_000);
  if (!rl.ok) return { ok: false, error: `Too many questions — try again in ${rl.retryAfterSeconds}s.` };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    ...history.slice(-8).map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: message.trim() },
  ];

  try {
    for (let round = 0; round < 3; round++) {
      const res = await openai().chat.completions.create({
        model: AI_MODEL,
        temperature: 0.3,
        messages,
        tools: TOOLS,
      });

      const msg = res.choices[0]?.message;
      if (!msg) return { ok: false, error: "No response." };

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push(msg);
        for (const call of msg.tool_calls) {
          if (call.type !== "function") continue;
          let payload: unknown = [];
          if (call.function.name === "getMyOrders") payload = await getMyOrders(user.id);
          if (call.function.name === "getMyReturns") payload = await getMyReturns(user.id);
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(payload),
          });
        }
        continue;
      }

      return { ok: true, answer: msg.content ?? "" };
    }
    return { ok: false, error: "Couldn't resolve that — email hello@smartbuyx.in." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Support request failed." };
  }
}
