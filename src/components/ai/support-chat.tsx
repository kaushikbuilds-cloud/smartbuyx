"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LifeBuoy, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { askSupport } from "@/features/ai/support";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Where is my order?",
  "How do refunds work?",
  "Status of my return",
  "How do I use Smart Coins?",
];

export function SupportChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

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
      const res = await askSupport(history, q);
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: res.ok ? res.answer : `⚠️ ${res.error}` },
      ]);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
            <LifeBuoy className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">AI Support</p>
            <p className="text-xs text-muted-foreground">Instant answers about your orders, returns &amp; coins</p>
          </div>
        </div>

        <div className="max-h-80 space-y-3 overflow-y-auto">
          {turns.length === 0 ? (
            <div className="flex flex-wrap gap-2">
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
          ) : null}

          {turns.map((t, i) => (
            <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm",
                  t.role === "user"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : "border bg-muted/40"
                )}
              >
                {t.content}
              </div>
            </div>
          ))}

          {pending ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking your account...
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex items-center gap-2 rounded-xl border bg-background p-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about an order, return, or payment..."
            className="flex-1 bg-transparent px-2 text-sm focus:outline-none"
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
