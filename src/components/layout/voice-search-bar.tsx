"use client";

import { useRef, useState } from "react";
import { ChevronDown, Mic, Search } from "lucide-react";

// Minimal shape of the Web Speech API — not in default lib.dom.d.ts.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function VoiceSearchBar() {
  const [listening, setListening] = useState(false);
  const [supported] = useState(
    () => typeof window !== "undefined" && Boolean((window as unknown as Record<string, unknown>).webkitSpeechRecognition || (window as unknown as Record<string, unknown>).SpeechRecognition)
  );
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startListening() {
    const Ctor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new (Ctor as new () => SpeechRecognitionLike)();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript && inputRef.current) {
        inputRef.current.value = transcript;
        formRef.current?.requestSubmit();
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  return (
    <form
      ref={formRef}
      action="/products"
      className="flex flex-1 items-stretch overflow-hidden rounded-xl border bg-muted/30 focus-within:ring-2 focus-within:ring-purple-500/30"
    >
      <div className="flex items-center pl-4 text-muted-foreground"><Search className="h-4 w-4" /></div>
      <input
        ref={inputRef}
        name="q"
        placeholder="Search for products, brands and more..."
        className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none"
      />
      {supported ? (
        <button
          type="button"
          onClick={startListening}
          aria-label="Search by voice"
          title="Search by voice"
          className={`flex items-center px-2 text-muted-foreground hover:text-foreground ${listening ? "animate-pulse text-rose-500" : ""}`}
        >
          <Mic className="h-4 w-4" />
        </button>
      ) : null}
      <div className="hidden items-center gap-1 border-l border-border/60 px-3 text-xs text-muted-foreground sm:flex">
        All Categories <ChevronDown className="h-3 w-3" />
      </div>
      <button type="submit" className="flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 px-5 text-white hover:opacity-90">
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}
