import type { NextConfig } from "next";

// Next.js/React hydration needs 'unsafe-inline' for its own bootstrap script
// without per-request nonce middleware (not set up here) — this CSP is a
// pragmatic baseline (blocks framing, restricts connect/img/frame to known
// hosts) rather than a maximally strict one. Tighten with nonces later if needed.
const CSP = [
  "default-src 'self'",
  // Order checkout now uses Fastrr (Shiprocket Checkout)'s client-side
  // script + iframe overlay, loaded from their *.shiprocket.com domains.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout-ui.shiprocket.com",
  "style-src 'self' 'unsafe-inline' https://checkout-ui.shiprocket.com",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://checkout-api.shiprocket.com https://checkout-ui.shiprocket.com",
  "frame-src https://checkout-ui.shiprocket.com https://checkout-api.shiprocket.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // Plan/subscription billing still uses PayU's hosted checkout (order
  // checkout switched to Fastrr; subscriptions did not) -- the browser
  // navigates there via a plain form POST. Chrome enforces form-action
  // against EVERY hop of a redirect chain, not just the initial submit
  // target -- PayU's /_payment endpoint may internally redirect to a
  // sibling subdomain, so a wildcard on payu.in is needed rather than
  // literal hostnames alone (which is what silently blocked every attempt
  // the first time this was integrated).
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
