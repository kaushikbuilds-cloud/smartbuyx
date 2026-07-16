// Lightweight in-memory rate limiter for expensive (AI-cost) Server Actions.
//
// Known limitation: this state is per serverless function instance. On
// Vercel, a new instance means a fresh limit, and multiple concurrent
// instances don't share counts — so this is a speed bump against casual
// single-client abuse, not a bulletproof limit against a distributed attack.
// A proper fix is a shared store (Upstash Redis + @upstash/ratelimit), not
// implemented here since it requires provisioning an external service.
// This still meaningfully raises the cost of abuse for the common case
// (one user/script hammering an endpoint) at zero infra cost.

const buckets = new Map<string, { count: number; resetAt: number }>();

// Periodically drop stale entries so the map doesn't grow unbounded across
// a long-lived instance.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}
