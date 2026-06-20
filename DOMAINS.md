# SmartBuyX — Domain Boundaries

SmartBuyX is **one app with two co-equal pillars** sharing a small kernel. This file is the
contract: before building any feature, decide which pillar it belongs to. Cross-pillar calls go
through the **Bridge** only — never reach across directly.

```
                         ┌─────────────────────────────┐
                         │        SHARED KERNEL        │
                         │  Identity · Payments · AI   │
                         │  Wallet · Notifications     │
                         │  Reviews · Messaging        │
                         └───────────┬─────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                              │
   ┌──────────▼───────────┐                     ┌────────────▼──────────┐
   │   PILLAR A: COMMERCE │   ◄── Bridge ──►    │   PILLAR B: BUILD     │
   │  (Amazon/Flipkart)   │                     │  (ArchStudio/Constio) │
   └──────────────────────┘                     └───────────────────────┘
```

---

## Pillar A — Commerce (transactional)

> Mental model: **buy now**. Low-consideration, repeat, GMV-driven.

**Scope:** D2C products, construction materials, supplier listings, creator commerce (reels/affiliate/live), AR Try Room.

**Core flow:** catalog → search → cart → checkout → **one-time payment** → fulfillment → tracking → review.

**Owns these tables:** `products`, `materials`, `categories`, `product_variants`, `inventory`, `carts`, `cart_items`, `orders`, `order_items`, `order_status_history`, `payments`, `payouts`, `reels`, `reel_products`, `affiliate_links`, `affiliate_earnings`, `live_sessions`, `brand_collaborations`, `ar_sessions`.

**Routes:** `(commerce)/*` — products, materials, suppliers, reels, ar-try, cart, checkout, orders.

**Features dir:** `features/{catalog,orders,creator,ar}`.

**Billing model:** one-time order payments + supplier payouts. **No subscriptions here.**

**Success metrics:** GMV, conversion rate, AOV, repeat rate, fulfillment SLA.

---

## Pillar B — Build (services & projects)

> Mental model: **one big decision over weeks/months**. High-consideration, lead-driven, SaaS.

**Scope:** architect / engineer / contractor / interior-designer marketplaces, AI House Builder, AI Material Estimator, Cost Calculator, Construction Project Management, design artifacts, pro subscriptions.

**Core flow:** discover pro → RFQ / consultation → proposal → hire → **project** (stages, milestones, design tabs, expenses, site reports) → milestone payments.

**Owns these tables:** `architect_profiles`, `engineer_profiles`, `contractor_profiles`, `interior_designer_profiles`, `pro_applications`, `rfqs`, `quotes`, `service_bookings`, `consultations`, `projects`, `project_milestones`, `project_materials`, `project_expenses`, `site_reports`, `design_artifacts`, `cost_breakdowns`, `house_builder_runs`, `material_estimate_runs`, `plans`, `subscriptions`, `subscription_usage`.

**Routes:** `(build)/*` — architects, engineers, contractors, interior-designers, projects, house-builder, estimator, cost-calculator; `(marketing)/plans`; `(dashboard)/subscription`.

**Features dir:** `features/{pros,projects,ai}` + `features/billing` (subscriptions).

**Billing model:** **recurring subscriptions** (the pricing tiers) for pros + milestone payments for projects.

**Success metrics:** qualified leads, project completions, subscription MRR, pro retention.

---

## Shared Kernel (both pillars depend on it; it depends on neither)

| Concern | Tables / modules |
|---|---|
| Identity | `profiles`, `addresses`, `user_devices`, `audit_logs`, roles, `lib/auth` |
| Payments rail | Razorpay client + webhook (`lib/razorpay`) — A uses orders, B uses subscriptions |
| Wallet & promos | `wallets`, `wallet_transactions`, `coupons`, `coupon_redemptions` |
| AI | `lib/ai` providers; `ai_conversations`, `ai_messages`, `estimates` |
| Messaging | `conversations`, `messages` |
| Reviews | `reviews` (polymorphic across both) |
| Notifications | `notifications` |

**Rule:** kernel code must never `import` from `features/catalog` or `features/projects`. Dependencies point *inward* to the kernel, never sideways between pillars.

---

## The Bridge (the only sanctioned cross-pillar contract)

This is the single reason the two platforms live in one app: **a Build project consumes Commerce inventory.**

```
Pillar B                          Bridge                         Pillar A
────────                          ──────                         ────────
project_materials   ──"order these materials"──►   creates  →   order + order_items
(planned BOM)                                                    (Commerce checkout)
        ▲                                                              │
        └──────────  order status / delivered_qty syncs back  ────────┘
```

**Contract surface** (to be implemented in `features/bridge/`):
- `createOrderFromProject(projectId, materialIds[])` → returns a Commerce `order`, links each `order_item` back to `project_materials.variant_id`.
- Order webhook updates `project_materials.ordered_qty` / `delivered_qty`.
- Affiliate/creator attribution is Commerce-internal and **must not** leak into project logic.

**Anything else that wants to cross pillars must add a typed function here — no ad-hoc cross-imports.**

---

## Decision checklist for a new feature

1. Is it *buy-a-thing*? → **Pillar A (Commerce)**.
2. Is it *hire-a-pro / run-a-project / subscribe*? → **Pillar B (Build)**.
3. Does both sides need it (login, pay, AI, review)? → **Shared Kernel**.
4. Does it move data from a project into a cart/order? → **Bridge** (and only the Bridge).

If a feature seems to need two of these at once, it's probably two features — split it.
