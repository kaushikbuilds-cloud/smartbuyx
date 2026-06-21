import { createClient } from "@/lib/supabase/server";
import { listOrders } from "@/features/orders/order-queries";
import { getWalletBalance } from "@/features/account/wallet-queries";
import { listProducts, getTrending } from "@/features/catalog/queries";
import { getWishlistedIds } from "@/features/catalog/wishlist-queries";

import { AIAssistantHero } from "@/components/dashboard/ai-assistant-hero";
import { QuickActionsRow } from "@/components/dashboard/quick-actions-row";
import { MyOrdersRow } from "@/components/dashboard/my-orders-row";
import { PromoBannersRow } from "@/components/dashboard/promo-banners-row";
import { RecommendedRow } from "@/components/dashboard/recommended-row";
import { PopularCategoriesRow } from "@/components/dashboard/popular-categories-row";
import { TopBrandsRow } from "@/components/dashboard/top-brands-row";
import { HelpBar } from "@/components/dashboard/help-bar";

import { AccountOverviewCard } from "@/components/dashboard/account-overview-card";
import { GoldBenefitsCard } from "@/components/dashboard/gold-benefits-card";
import { PriceAlertsCard } from "@/components/dashboard/price-alerts-card";
import { RecentlyViewedCard } from "@/components/dashboard/recently-viewed-card";
import { MoreWithSmartBuyxCard } from "@/components/dashboard/more-with-smartbuyx-card";

export async function CustomerDashboardHome({ userId, firstName }: { userId: string; firstName: string }) {
  const supabase = await createClient();

  const [orders, wallet, trending, deals, wishlistedIds] = await Promise.all([
    listOrders(userId),
    getWalletBalance(userId),
    getTrending(8),
    listProducts({ kind: "product", sort: "rating", limit: 8 }),
    getWishlistedIds(userId),
  ]);

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const moneySaved = Math.round(totalSpent * 0.07);

  const recommendedProductIds = trending.map((p) => p.id);
  const { data: variants } = recommendedProductIds.length
    ? await supabase
        .from("product_variants")
        .select("id, product_id, price")
        .in("product_id", recommendedProductIds)
    : { data: [] };
  const defaultVariantByProduct: Record<string, string> = {};
  for (const v of variants ?? []) {
    if (!defaultVariantByProduct[v.product_id]) defaultVariantByProduct[v.product_id] = v.id;
  }

  return (
    <main className="grid gap-6 p-6 xl:grid-cols-[1fr,360px]">
      {/* Main column */}
      <div className="min-w-0 space-y-6">
        <AIAssistantHero firstName={firstName} />
        <QuickActionsRow />
        <MyOrdersRow orders={orders} />
        <PromoBannersRow />
        <RecommendedRow
          products={trending}
          defaultVariantByProduct={defaultVariantByProduct}
          wishlisted={wishlistedIds}
        />
        <PopularCategoriesRow />
        <TopBrandsRow />
        <HelpBar />
      </div>

      {/* Right rail */}
      <aside className="space-y-4">
        <AccountOverviewCard
          totalSpent={totalSpent}
          ordersCount={orders.length}
          moneySaved={moneySaved}
          smartCoins={Math.round(wallet)}
        />
        <GoldBenefitsCard saved={moneySaved} />
        <PriceAlertsCard products={deals.products} />
        <RecentlyViewedCard products={trending} />
        <MoreWithSmartBuyxCard />
      </aside>
    </main>
  );
}
