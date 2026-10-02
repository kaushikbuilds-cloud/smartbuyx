-- Platform commission: sellers enter the price they want to receive
-- (products.seller_price); the buyer-facing price (products.base_price /
-- product_variants.price) is that plus our commission, computed
-- automatically at listing time (see src/lib/config/commission.ts). This
-- column records what the seller actually gets so escrow and admin revenue
-- reporting can split the two back apart instead of assuming the full order
-- total belongs to the seller.
alter table products add column seller_price numeric(12,2);
update products set seller_price = base_price where seller_price is null;
alter table products alter column seller_price set not null;

-- Same split carried onto each order line, frozen at the moment of purchase
-- (a later commission-rate change must never reprice a past order). Existing
-- rows predate commission: backfill to the full total so historical escrow/
-- reporting isn't retroactively changed.
alter table order_items add column seller_amount numeric(12,2);
update order_items set seller_amount = total where seller_amount is null;
alter table order_items alter column seller_amount set not null;
