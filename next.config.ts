import type { NextConfig } from "next";

// Next.js/React hydration needs 'unsafe-inline' for its own bootstrap script
// without per-request nonce middleware (not set up here) — this CSP is a
// pragmatic baseline (blocks framing, restricts connect/img/frame to known
// hosts) rather than a maximally strict one. Tighten with nonces later if needed.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // Both order checkout and plan/subscription billing now use PayU's hosted
  // checkout -- the browser navigates there via a plain form POST (no
  // client-side PayU script/widget involved). Chrome enforces form-action
  // against EVERY hop of a redirect chain, not just the initial submit target
  // -- PayU's /_payment endpoint may internally redirect to a sibling
  // subdomain (regional processing, trailing-slash normalization, etc.), so a
  // wildcard on payu.in is needed rather than literal hostnames alone (which
  // is what was silently blocking every attempt).
  "form-action 'self' https://*.payu.in",
].join("; ");

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default config;
