# Access Control (IDOR) Security Report

## Status: PASS (1 low-severity inconsistency found, fixed)

## Findings

Went through every Server Action that takes a resource ID as a parameter (order, shipment, consultation, project, subscription, price alert, address, payment method, product, return, purchase order, RFQ quote) and checked whether the current user's ownership of that resource is verified before the mutation runs.

**Explicit app-level ownership checks confirmed correct** on: `cancelOrder`, `confirmDelivery`, `updateShipmentStatus`, `cancelConsultation`, `advanceStage` (projects), `cancelSubscription`, `deletePriceAlert`, `deleteAddress`, `deletePaymentMethod`/`setDefaultPaymentMethod`, `updateProduct`/`deleteProduct`, `cancelReturn`, `disputeReturn`, `submitQuote` (RFQ), `updatePoStatus` (purchase orders). Every one of these either does a `.eq("owner_column", user.id)` on the mutation itself, or fetches the resource first and compares the owning column to `user.id` before proceeding.

**One inconsistency (not exploitable, RLS backstops it):** `addExpense`, `addSiteReport`, and `addProjectMaterial` (`features/projects/actions.ts`) check that the caller is logged in but never verify the `projectId` in the form data actually belongs to them — unlike the sibling function `advanceStage` in the same file, which does check explicitly (`allowed.includes(user.id)`). Confirmed this is still safe: the underlying tables' RLS policies (`"expenses via project"`, `"site reports via project"`, `"materials via project"`) are `for all using (exists(select 1 from projects p where p.id = project_id and (p.customer_id = auth.uid() or auth.uid() in (...))))`, and Postgres applies the `USING` expression as the `WITH CHECK` for INSERT when a `for all` policy doesn't specify one separately — so a cross-account insert attempt is rejected at the database layer even without the app-level check. It just fails silently/generically instead of returning a clear "not your project" error.

The 5 IDOR fixes already covered in the AUTH_MIDDLEWARE report (`listPaymentMethods`, `listMyReturns`, `listSellerReturns`, `getMyProApplication`, `listMyAlerts`) are cross-listed here since they're squarely IDOR issues on the read side — not repeated in full to avoid duplication.

## What's at risk

Nothing currently exploitable. The one inconsistency above is a code-quality gap, not a live hole — RLS is doing its job as the actual backstop.

## What's already secure

- Consistent ownership-check pattern across nearly every write path.
- RLS provides a genuine second layer on the project-family tables, catching the one place the app-level check was skipped.

## Recommendations

1. **Applied** — added the same explicit ownership check used in `advanceStage` to `addExpense`, `addSiteReport`, and `addProjectMaterial`, so a cross-account attempt now returns a clear "Project not found" error instead of a silent Postgres RLS rejection.
