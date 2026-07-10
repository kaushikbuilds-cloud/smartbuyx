"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Send, ImageOff, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatINR } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { askAssistant, type AssistantProduct } from "@/features/ai/assistant";

type Turn = {
  role: "user" | "assistant";
  content: string;
  products?: AssistantProduct[];
};

const SUGGESTIONS = [
  "Best cement under ₹450 per bag",
  "Wireless earbuds under ₹2000",
  "How much steel for a 1200 sqft house?",
  "Compare top-rated tiles",
];

export function AssistantChat({ initialQuery }: { initialQuery?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, pending]);

  function send(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    setInput("");
    setTurns((prev) => [...prev, { role: "user", content: q }]);
    startTransition(async () => {
      const history = turns.map((t) => ({ role: t.role, content: t.content }));
      const res = await askAssistant(history, q);
      setTurns((prev) => [
        ...prev,
        res.ok
          ? { role: "assistant", content: res.answer, products: res.products }
          : { role: "assistant", content: `⚠️ ${res.error}` },
      ]);
    });
  }

  // Auto-send a query passed via ?q= (from dashboard hero chips).
  useEffect(() => {
    if (initialQuery && !sentInitial.current) {
      sentInitial.current = true;
      send(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-1 py-4">
        {turns.length === 0 && !pending ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Ask SmartBuyX AI</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Products, materials, budgets, quantities — I search the live catalog.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((t, i) => (
          <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] space-y-3")}>
              <div
                className={cn(
                  "whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm",
                  t.role === "user"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : "border bg-card"
                )}
              >
                {t.content}
              </div>

              {t.products && t.products.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {t.products.slice(0, 4).map((p) => (
                    <Link key={p.id} href={`/products/${p.slug}`}>
                      <Card className="flex items-center gap-3 p-2.5 transition-shadow hover:shadow-md">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p.image ? (
                            <Image src={p.image} alt={p.title} fill sizes="48px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <ImageOff className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{p.title}</p>
                          <p className="text-xs font-bold">
                            {formatINR(p.price)}
                            {p.unit ? <span className="font-normal text-muted-foreground"> / {p.unit}</span> : null}
                          </p>
                          {p.ratingCount > 0 ? (
                            <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                              {p.rating.toFixed(1)} ({p.ratingCount})
                            </p>
                          ) : null}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {pending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching the catalog...
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        className="flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <span className="flex h-9 w-9 items-center justify-center text-purple-600">
          <Sparkles className="h-5 w-5" />
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about products, materials, budgets..."
          className="flex-1 bg-transparent text-sm focus:outline-none"
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
