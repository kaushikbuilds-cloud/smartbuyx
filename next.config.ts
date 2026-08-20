import type { NextConfig } from "next";

// Next.js/React hydration needs 'unsafe-inline' for its own bootstrap script
// without per-request nonce middleware (not set up here) — this CSP is a
// pragmatic baseline (blocks framing, restricts connect/img/frame to known
// hosts) rather than a maximally strict one. Tighten with nonces later if needed.
const CSP = [
  "default-src 'self'",
  // Order checkout uses Fastrr (Shiprocket Checkout)'s client-side script +
  // iframe overlay. Confirmed via live browser console errors that their
  // actual checkout UI spans several distinct domains beyond
  // checkout-ui/checkout-api.shiprocket.com -- notably the iframe content
  // itself loads from fastrr-boost-ui.pickrr.com (Fastrr's legacy/internal
  // brand name, "pickrr"), plus events.pickrr.com and uptime2.fastrr.com for
  // analytics/uptime pings, and otpless.com for their OTP-less login widget.
  // Wildcarding *.shiprocket.com, *.pickrr.com, and *.fastrr.com covers
  // whichever specific subdomain they use without needing to chase each one
  // individually as their product evolves.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.shiprocket.com https://*.pickrr.com https://*.fastrr.com https://otpless.com",
  "style-src 'self' 'unsafe-inline' https://*.shiprocket.com https://*.pickrr.com https://fonts.googleapis.com",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.shiprocket.com https://*.pickrr.com https://*.fastrr.com",
  "frame-src https://*.shiprocket.com https://*.pickrr.com https://*.fastrr.com",
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
