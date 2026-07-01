"use client";

import { useState, useTransition } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateListing } from "@/features/ai/listing-generator";

// Fills the seller product form (by input id) with AI-generated content.
function setField(id: string, value: string) {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  if (el) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export function AiAssistPanel() {
  const [prompt, setPrompt] = useState("");
  const [pending, startTransition] = useTransition();

  function generate() {
    if (!prompt.trim()) {
      toast.error("Type a product name or short description first.");
      return;
    }
    startTransition(async () => {
      const res = await generateListing(prompt);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const l = res.listing;
      setField("title", l.title);
      setField("description", l.description);
      if (l.brand) setField("brand", l.brand);
      if (l.unit) setField("unit", l.unit);
      if (l.suggestedPrice > 0) setField("basePrice", String(l.suggestedPrice));
      setField("kind", l.kind);
      toast.success("Listing drafted — review and tweak before saving.");
    });
  }

  return (
    <div className="mb-6 max-w-2xl rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 dark:border-purple-900/40 dark:from-purple-950/30 dark:to-indigo-950/30">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold">Generate with AI</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Describe the product in a few words — AI writes the title, description, unit &amp; suggests a price.
      </p>
      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); generate(); } }}
          placeholder="e.g. UltraTech OPC 53 grade cement 50kg"
          disabled={pending}
        />
        <Button type="button" variant="gradient" onClick={generate} disabled={pending}>
          <Wand2 className="h-4 w-4" /> {pending ? "Drafting..." : "Generate"}
        </Button>
      </div>
    </div>
  );
}
