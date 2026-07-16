// For catch blocks around third-party SDK calls (OpenAI, Razorpay, etc.):
// logs the real error server-side only, and always returns a generic message
// to the client. An unexpected exception's .message can leak internal detail
// (a variable/property name from a TypeError, an internal hostname, etc.) —
// safer to never forward it verbatim, even though most SDK errors are
// harmless in practice.
export function safeErrorMessage(e: unknown, fallback: string, context: string): string {
  console.error(`[${context}]`, e);
  return fallback;
}
