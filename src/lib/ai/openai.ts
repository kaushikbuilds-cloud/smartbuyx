import OpenAI from "openai";

// Every text/vision AI feature in the app (assistant, gift finder, shopping
// planner, image search, size recommendation, listing generator, etc.) calls
// through this one client -- so swapping providers means editing this file
// only, not each of the ~13 feature files. Currently pointed at Gemini's
// OpenAI-compatibility endpoint (same `openai` SDK and call shapes -- chat
// completions, JSON mode, vision, tool-calling -- just a different base URL
// and API key) rather than OpenAI directly, since Google Cloud billing is
// easier to set up from India and has a generous free tier. Only image
// *generation/editing* (see image-enhancement.ts) isn't covered by this
// compatibility layer and calls Gemini's native image model separately.
let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }
  return client;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Fast, cheap, good enough for listing/summary/reasoning tasks -- Gemini's
// equivalent tier to what gpt-4o-mini was doing before.
export const AI_MODEL = "gemini-2.5-flash";
