# SSRF Security Report

## Status: HIGH (1 finding, fixed)

## Findings

Searched all of `src/` for `fetch(` calls — only two exist in the entire codebase:

1. `src/lib/whatsapp/client.ts` — fetches a **hardcoded** MSG91 endpoint, no user input in the URL. Safe by construction, not exploitable.
2. `src/features/ai/image-enhancement.ts` — `enhanceProductImage(imageUrl)` did `fetch(imageUrl)` where `imageUrl` is a plain string parameter with **zero validation**. In the intended UI flow the value always comes from a Supabase Storage public URL the seller just uploaded, but this is a `"use server"` action invoked from a client component (`image-uploader.tsx`), so — same class of issue as the AUTH_MIDDLEWARE findings — it's independently callable with any argument by any authenticated supplier/d2c_brand/admin account. An attacker in one of those roles could call it with `http://169.254.169.254/latest/meta-data/` (cloud metadata endpoint) or any internal-network URL, and the server-side fetch response gets forwarded into an OpenAI API call — a working SSRF primitive with a real onward data path.

## What's at risk

Cloud metadata endpoint access (credential theft, depending on hosting), internal network/service probing, or using the server as a fetch relay — gated behind requiring one of 4 roles rather than being fully anonymous, but still a real hole since regular sellers can self-serve that role via the become-a-seller flow.

## What's already secure

Only one other `fetch()` exists in the whole codebase, and it has no user-controlled input at all.

## Recommendations

**Applied** — added `isAllowedImageHost()`, which requires the URL to be `https://` and match the project's own Supabase Storage hostname + the `product-images` bucket path. Any other host or scheme is rejected before the fetch ever happens. This is stricter than a generic private-IP-range blocklist (which would still allow fetching arbitrary public URLs) since the function's only legitimate use case is re-fetching an image this app itself just stored.
