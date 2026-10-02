// Platform commission: sellers enter the price they want to receive;
// everything buyers see/pay is that price plus our commission, computed
// automatically whenever a product is created or edited. Change the rate
// here to update it site-wide -- it is never configurable per-product today.
export const PLATFORM_COMMISSION_RATE = 0.08; // 8%

export function buyerPriceFromSellerPrice(sellerPrice: number): number {
  return Math.round(sellerPrice * (1 + PLATFORM_COMMISSION_RATE) * 100) / 100;
}
