import OpenAI from "openai";

let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

// Default model — cheap, fast, good enough for listing/summary tasks.
export const AI_MODEL = "gpt-4o-mini";
