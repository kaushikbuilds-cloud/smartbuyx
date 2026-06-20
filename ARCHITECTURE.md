# SmartBuyX — Architecture

India's AI-powered Commerce + Construction + Creator super-app. One platform combining D2C ecommerce, construction materials, professional services (architect/engineer/contractor/interior designer), creator commerce, AR try-on, and AI building tools.

## Stack
- **Frontend/Server:** Next.js 15 (App Router, RSC, Server Actions), TypeScript, TailwindCSS, Shadcn UI
- **Auth & DB:** Supabase (Auth + Postgres + Storage + Realtime + RLS)
- **Payments:** Razorpay (UPI, cards, net banking, wallet)
- **AI:** OpenAI (primary), Gemini (multimodal: floor plans, sketches, CAD)
- **State:** React Query (server cache), Zustand (UI state)
- **Validation:** Zod on every boundary

> The product spec PDF references Flutter + NestJS + Firebase. This repo executes on the Next.js + Supabase stack agreed in the brief — capabilities (AR, AI, real-time) are equivalent on web with WebXR, Edge Functions, and Supabase Realtime.

## Domains
1. **Identity** — auth, profiles, roles, KYC, devices
2. **Catalog** — D2C products, construction materials, categories, variants, inventory
3. **Pros Marketplace** — supplier · architect · engineer · contractor · interior designer profiles, RFQs, quotes, consultations
4. **Orders & Payments** — cart, checkout, orders, Razorpay, refunds, payouts
5. **Wallet & Promos** — wallet ledger, coupons, cashback
6. **Projects** — construction project mgmt: stages, milestones, materials, expenses, site reports, assignments
7. **AI** — Shopping Assistant, Material Estimator, House Builder (sketch/CAD → plans, 3D, BOQ, cost)
8. **AR** — Try Room sessions (fashion + home)
9. **Creator Commerce** — creator profiles, reels, product tagging, affiliate links/earnings, live commerce, brand collaborations
10. **Messaging** — buyer↔pro chat, notifications
11. **Reviews** — polymorphic ratings
12. **Admin** — moderation, KYC, payouts, analytics, audit logs

## User roles
- `customer` (default) — buys products/materials, hires pros, runs projects
- `supplier` — sells materials, manages inventory, receives RFQs
- `architect` — design services, portfolio, proposals
- `engineer` — structural review, inspections, site reports
- `contractor` — labour mgmt, execution, progress tracking
- `interior_designer` — packages, 3D room design, material suggestions
- `creator` — reels, affiliate income, live commerce, brand collabs
- `d2c_brand` — product catalog, campaigns, sales analytics
- `admin` / `superadmin` — platform ops

Stored on `profiles.role`; mirrored into JWT `app_metadata` via Postgres trigger so RLS can `auth.jwt()->>'role'`.

## Route structure (App Router groups)

> Two pillars are physically separated into `(commerce)` and `(build)` route groups.
> See [DOMAINS.md](./DOMAINS.md) for the boundary contract and the Bridge.

```
src/app/
├── (marketing)/              # Public landing, about, plans (pricing)
├── (auth)/
│   ├── login, register, forgot-password
│   └── callback/route.ts     # Supabase OAuth callback
│
├── (commerce)/               # ── PILLAR A: buy-a-thing ──
│   ├── products/             # D2C ecommerce
│   ├── materials/            # Construction materials
│   ├── suppliers/
│   ├── reels/                # Creator commerce feed
│   ├── ar-try/               # AR Try Room
│   ├── cart/ · checkout/ · orders/
│
├── (build)/                  # ── PILLAR B: hire-a-pro / run-a-project ──
│   ├── architects/
│   ├── engineers/
│   ├── contractors/
│   ├── interior-designers/
│   ├── estimator/            # AI Material Estimator (CAD/blueprint → BOQ)
│   ├── house-builder/        # AI House Builder (sketch → plans + 3D + cost)
│   └── cost-calculator/
│
├── (ai)/                     # ── SHARED KERNEL ──
│   └── assistant/            # AI Shopping Assistant (spans both pillars)
├── (dashboard)/
│   ├── layout.tsx            # Auth guard + role-aware sidebar
│   ├── customer/             # orders, projects, wallet
│   ├── supplier/             # catalog, inventory, RFQs, payouts
│   ├── architect/            # portfolio, proposals, consultations
│   ├── engineer/             # inspections, reports
│   ├── contractor/           # crew, expenses, site updates
│   ├── interior-designer/    # packages, deliverables
│   ├── creator/              # reels studio, affiliate, live, earnings
│   ├── brand/                # campaigns, sales analytics
│   ├── admin/                # users, fraud, GMV, payouts
│   ├── projects/             # construction PM workspace (customer + assigned pros)
│   └── wallet/
└── api/
    ├── ai/{chat,estimate,house-builder}/route.ts
    ├── razorpay/{order,webhook}/route.ts
    └── webhooks/
```

## Folder structure

```
src/
├── app/                      # Routes (above)
├── components/
│   ├── ui/                   # shadcn primitives
│   ├── layout/               # navbar, sidebar, footer, role-switcher
│   ├── shop/                 # product cards, filters, AR launcher
│   ├── dashboard/            # role widgets, charts
│   ├── ai/                   # chat ui, estimator forms, plan viewer
│   ├── creator/              # reel player, product tagger, live ui
│   └── shared/               # generic composites + providers
├── features/                 # Bounded contexts
│   ├── auth/                 # otp, oauth, session
│   ├── catalog/              # products + materials
│   ├── orders/
│   ├── payments/             # razorpay, wallet, coupons
│   ├── pros/                 # supplier/architect/engineer/contractor/id
│   ├── projects/             # stages, milestones, materials, expenses
│   ├── ai/                   # assistant, estimator, house-builder
│   ├── creator/              # reels, affiliate, live
│   ├── ar/                   # WebXR sessions
│   ├── reviews/
│   └── messaging/
│       └── {actions,queries,schemas,types}.ts
├── lib/
│   ├── supabase/             # browser, server, admin, middleware clients
│   ├── razorpay/             # client + signature verify
│   ├── ai/                   # openai/gemini providers + prompts + tools
│   ├── auth/                 # session, role guards
│   ├── utils/                # cn, formatters, INR money
│   └── constants/
├── hooks/                    # useUser, useCart, useWallet, useTheme
├── stores/                   # zustand (cart, ui)
├── types/                    # shared TS types
├── styles/globals.css
└── middleware.ts             # auth + role-gated routes
```

## Authentication

- **Methods:** Email/password, Google OAuth, Mobile OTP (Supabase Phone Auth), Apple OAuth.
- **JWT + RBAC:** Supabase JWT; `profiles.role` synced into `app_metadata.role` via trigger; all RLS keyed off `auth.uid()` + `auth.jwt()->>'role'`.
- **Session:** `@supabase/ssr` httpOnly cookies. `middleware.ts` refreshes on every request and gates `/dashboard/*` by role.
- **Server guards:** `requireUser()` / `requireRole(...roles)` in `lib/auth/guards.ts`.
- **Role upgrade:** customer applies via `pro_applications` → admin approves → role updated → JWT auto-mirrored.
- **Devices & audit:** `user_devices` for push tokens + device mgmt; `audit_logs` for admin-visible action history.

## Database

Two migrations, all tables RLS-enabled.

**`0001_init.sql` — core:**
profiles · addresses · pro_applications · supplier_profiles · architect_profiles · contractor_profiles · categories · products · product_variants · inventory · carts · cart_items · orders · order_items · order_status_history · payments · payouts · rfqs · quotes · service_bookings · reviews · conversations · messages · ai_conversations · ai_messages · estimates · notifications

**`0002_extended.sql` — full platform:**
- Role enum extension: `customer`, `engineer`, `interior_designer`, `creator`, `d2c_brand`
- Pro profiles: engineer_profiles · interior_designer_profiles · d2c_brand_profiles · creator_profiles
- Projects: projects · project_milestones · project_materials · project_expenses · site_reports · consultations
- Creator commerce: reels · reel_products · affiliate_links · affiliate_earnings · live_sessions · brand_collaborations
- AI/AR: ar_sessions · house_builder_runs · material_estimate_runs
- Money: wallets · wallet_transactions · coupons · coupon_redemptions
- Ops: audit_logs · user_devices

## AI layer

- `lib/ai/providers/{openai,gemini}.ts` behind `AIProvider` interface; router selects per-task (text vs multimodal).
- **Shopping Assistant** — streaming chat with tools: `searchProducts`, `searchMaterials`, `findPros`, `addToCart`, `compareBrands`, `estimateBudget`.
- **Material Estimator** — accepts CAD/blueprint/floor plan upload → vision model → structured BOQ (Zod schema) → priced via current `products` / `materials`.
- **House Builder** — accepts plot size + sketch → generates floor plans, elevations, 3D concepts, BOQ, cost estimate (job-queued via `house_builder_runs`).

## AR (Try Room)

- Web: WebXR / `<model-viewer>` for furniture and home placement; image-based virtual try-on for fashion via vision API.
- Sessions tracked in `ar_sessions`; snapshots in Supabase Storage.

## Creator commerce

- Reels uploaded to Supabase Storage; HLS transcode via Edge Function.
- `reel_products` tags products with position/time; tap-to-shop opens PDP.
- Affiliate flow: creator generates `affiliate_links` (unique code, commission %). Checkout attributes order → `affiliate_earnings` row → settled to wallet → payout.
- Live commerce: `live_sessions` with stream URL; viewers can purchase tagged items mid-stream.

## Payments

- Razorpay Checkout (UPI, cards, net banking, wallets).
- Server Action creates Razorpay order + `payments` row; webhook verifies HMAC, marks `orders.status = paid`, credits affiliates, queues fulfillment + supplier payouts.
- In-platform wallet for cashback, coupon savings, creator earnings; ledger in `wallet_transactions`.

## Conventions

- **Server Components by default**; `"use client"` only when needed.
- **Server Actions** for mutations; Route Handlers for webhooks/streams.
- **Zod** schemas colocated under `features/*/schemas.ts`.
- **No prop drilling** — composition + small Zustand stores.
- **Errors** — `Result<T, AppError>` in features; never throw raw at boundaries.
- **Naming** — files kebab-case, components PascalCase, hooks `useX`.
- **Money** — store as `numeric(12,2)` INR; never floats in client math.

## Design

Inspired by Apple / Tesla / Airbnb / Stripe. Glassmorphism + Material 3 accents, dynamic gradients, dark + light, premium typography (Inter + system display). Tailwind tokens defined in `globals.css`; shadcn primitives extend them.
