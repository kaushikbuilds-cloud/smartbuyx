"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { formatINR } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { askProcurement, type DraftPo } from "@/features/ai/procurement";
import { createPurchaseOrder } from "@/features/procurement/actions";

type Turn = { role: "user" | "assistant"; content: string; draftPo?: DraftPo | null };

const SUGGESTIONS = [
  "Cement + steel for a 1000 sqft slab",
  "Best suppliers for vitrified tiles near 560001",
  "Bulk order: 200 LED panel lights, compare prices",
  "Estimate materials to build a boundary wall",
];

function draftTotal(po: DraftPo): number {
  return po.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

export function ProcurementChat() {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
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
      const res = await askProcurement(history, q);
      setTurns((prev) => [
        ...prev,
        res.ok
          ? { role: "assistant", content: res.answer, draftPo: res.draftPo }
          : { role: "assistant", content: `⚠️ ${res.error}` },
      ]);
    });
  }

  function confirmPo(po: DraftPo) {
    setCreating(true);
    startTransition(async () => {
      const res = await createPurchaseOrder({
        title: po.title,
        items: po.items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          total: i.quantity * i.unitPrice,
        })),
        notes: po.supplierName ? `Suggested supplier: ${po.supplierName}` : null,
      });
      setCreating(false);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Purchase order created");
      if (res?.poId) router.push(`/dashboard/customer/procurement/${res.poId}`);
    });
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-1 py-4">
        {turns.length === 0 && !pending ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
              <FileText className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Procurement Assistant</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Find materials, compare suppliers, estimate quantities, and I&apos;ll draft a purchase order you can send.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((t, i) => (
          <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
            <div className="max-w-[85%] space-y-3">
              <div
                className={cn(
                  "whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm",
                  t.role === "user" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "border bg-card"
                )}
              >
                {t.content}
              </div>

              {t.draftPo && t.draftPo.items.length > 0 ? (
                <Card className="space-y-3 border-purple-200 p-4 dark:border-purple-900">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-semibold">{t.draftPo.title}</p>
                  </div>
                  {t.draftPo.supplierName ? (
                    <p className="text-xs text-muted-foreground">Suggested supplier: {t.draftPo.supplierName}</p>
                  ) : null}
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted-foreground">
                      <tr><th className="pb-1">Item</th><th className="pb-1 text-right">Qty</th><th className="pb-1 text-right">Rate</th><th className="pb-1 text-right">Amount</th></tr>
                    </thead>
                    <tbody>
                      {t.draftPo.items.map((it, j) => (
                        <tr key={j} className="border-t">
                          <td className="py-1">{it.title}</td>
                          <td className="py-1 text-right">{it.quantity}{it.unit ? ` ${it.unit}` : ""}</td>
                          <td className="py-1 text-right">{formatINR(it.unitPrice)}</td>
                          <td className="py-1 text-right">{formatINR(it.quantity * it.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-semibold"><td colSpan={3} className="py-1.5">Total</td><td className="py-1.5 text-right">{formatINR(draftTotal(t.draftPo))}</td></tr>
                    </tfoot>
                  </table>
                  <Button variant="gradient" size="sm" className="w-full" disabled={creating} onClick={() => confirmPo(t.draftPo!)}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Create purchase order
                  </Button>
                </Card>
              ) : null}
            </div>
          </div>
        ))}

        {pending && !creating ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Working on it...
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

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
          placeholder="What do you need to procure?"
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
