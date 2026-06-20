# SmartBuyX

AI-powered marketplace platform: ecommerce, construction materials, suppliers, architects, contractors. Includes an AI Shopping Assistant and AI Material Estimator.

## Stack
Next.js 15 · TypeScript · TailwindCSS · Shadcn UI · Supabase (Postgres + Auth + Storage) · Razorpay · OpenAI / Gemini

## Getting started

```bash
cp .env.example .env.local        # fill in keys
npm install
npx supabase start                # local Postgres + Auth
npx supabase db reset             # applies supabase/migrations/*
npm run dev
```

## Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) — full architecture, folder layout, auth flow, route map
- [supabase/migrations/0001_init.sql](./supabase/migrations/0001_init.sql) — database schema + RLS

## Scripts
- `dev` — start Next.js dev server
- `build` / `start` — production build & run
- `typecheck` — `tsc --noEmit`
- `db:types` — regenerate Supabase TS types

## Status
Foundation only. Feature implementations land in subsequent passes.
