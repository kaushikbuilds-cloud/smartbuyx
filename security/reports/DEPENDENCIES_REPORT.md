# Dependencies Security Report

## Status: LOW (informational, no safe fix applied — see reasoning)

## Findings

- `package-lock.json` is committed (`git ls-files` confirms), and `DEPLOY.md` already specifies `npm ci` (not `npm install`) for the deploy build step — so production installs use the lock file's exact resolved versions, not the `^` ranges in `package.json`.
- All 37 top-level dependencies use `^` (caret) ranges in `package.json` itself, not exact pins. In practice this matters less than it sounds given the `npm ci` + committed lock file combination above, but it's worth noting against the audit's literal "exact versions pinned" goal.
- Reviewed every dependency name (`@radix-ui/*`, `@supabase/*`, `next`, `react`, `zod`, `openai`, `razorpay`, standard tooling) — all are well-known, widely-used, legitimate packages. No typosquatted or hallucinated package names (the "slopsquatting" risk this category is named for) found anywhere in `package.json`.
- `npm audit` reports 4 vulnerabilities: 2 moderate (`postcss`, transitively required by `next`'s own CSS pipeline) and 2 high (`tar`, transitively required by the `supabase` CLI tool). Checked whether either is actually reachable in this app's runtime:
  - **`tar`/`supabase`**: `supabase` is a `devDependency` (confirmed via `package.json`) — the CLI tool used for local migrations/dev, never bundled into or executed by the deployed Next.js app. The `tar` vulnerabilities are path-traversal/symlink issues in tar *extraction*, relevant only if a developer runs `supabase` CLI commands that extract an untrusted archive — not a production attack surface.
  - **`postcss`/`next`**: `postcss` runs at *build time* only (compiling the app's own static Tailwind CSS), not on any runtime user input. The CVE is about unescaped `</style>` in postcss's *output* when stringifying attacker-controlled CSS input — this app never feeds user-supplied CSS through postcss, so the vulnerable code path isn't reachable here even though the package is present.
- **Checked what `npm audit fix --force` would actually do before considering it**: for the `postcss` issue, npm's resolver wants to downgrade `next` all the way to `9.3.3` — a catastrophically breaking change (Next 9 predates the App Router this entire codebase is built on). For the `tar` issue, it wants to bump the `supabase` CLI dev tool across a major version. Neither was applied.

## What's at risk

Effectively nothing exploitable in production — both flagged vulnerabilities are in code paths (dev-tooling extraction, build-time CSS compilation of the app's own static styles) this app doesn't exercise with untrusted input.

## What's already secure

Lock file committed + `npm ci` in the documented deploy process already gives reproducible, pinned-in-practice installs despite the caret ranges in `package.json`. No suspicious dependencies.

## Recommendations

1. (Optional, low urgency) Bump the `supabase` CLI dev dependency to 2.x when convenient — it's a major version so should be done deliberately (test that local migration/dev workflows still work), not force-applied blindly. No rush since it's dev-only.
2. Do **not** apply `npm audit fix --force` — as shown above, it would downgrade Next.js to an incompatible ancient version. If the `postcss` advisory needs to be fully closed at some point, that requires waiting for `next` to bump its own transitive `postcss` dependency in a future release, not forcing it from this project.
3. (Optional, cosmetic) Could switch `package.json` to exact version pins instead of `^` ranges, but given the lock file + `npm ci` combination already provides reproducibility, this is a style preference more than a security fix.
