-- Fastrr confirmed (via their support team) that product/variant/collection
-- "id" fields must be numeric, matching Shopify's convention (their own
-- example: "id": 632910392). Our schema uses UUIDs everywhere -- a UUID
-- string sent as a JSON "id" likely fails silently on their side, which
-- would explain the persistent generic 500 from the access-token API
-- despite catalog sync, auth, and wallet all being independently confirmed
-- working. These numeric ids exist purely for the Fastrr wire format; every
-- internal reference stays on the real uuid primary key.
alter table products add column if not exists fastrr_numeric_id bigint generated always as identity unique;
alter table product_variants add column if not exists fastrr_numeric_id bigint generated always as identity unique;
alter table categories add column if not exists fastrr_numeric_id bigint generated always as identity unique;
