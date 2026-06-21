import { listProducts, listCategories, type ListParams } from "@/features/catalog/queries";
import { getWishlistedIds } from "@/features/catalog/wishlist-queries";
import { getSession } from "@/lib/auth/guards";
import { ProductGrid } from "@/components/shop/product-grid";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { Pagination } from "@/components/shop/pagination";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { AIAssistantHero } from "@/components/dashboard/ai-assistant-hero";
import { QuickActionsRow } from "@/components/dashboard/quick-actions-row";
import { PromoBannersRow } from "@/components/dashboard/promo-banners-row";
import { PopularCategoriesRow } from "@/components/dashboard/popular-categories-row";
import { TopBrandsRow } from "@/components/dashboard/top-brands-row";

export const metadata = { title: "Shop" };
const PAGE_SIZE = 24;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: ListParams["sort"]; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { q, sort, category } = sp;
  const page = Math.max(1, Number(sp.page) || 1);
  const isBrowsing = Boolean(q || category || sp.page); // hide hero sections while actively filtering

  const [{ products, total }, categories, session] = await Promise.all([
    listProducts({ kind: "product", q, sort, categoryId: category, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    listCategories("product"),
    getSession(),
  ]);
  const wishlisted = session ? await getWishlistedIds(session.user.id) : undefined;

  return (
    <main className="space-y-6 p-4 md:p-6">
      {/* Rich storefront header — same design language as the home dashboard */}
      {!isBrowsing ? (
        <>
          <AIAssistantHero />
          <QuickActionsRow />
          <PopularCategoriesRow />
          <PromoBannersRow />
          <TopBrandsRow />
        </>
      ) : null}

      {/* Catalog */}
      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold">{q ? `Results for "${q}"` : "All Products"}</h2>
          <p className="text-xs text-muted-foreground">{total.toLocaleString("en-IN")} items</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
          <div className="lg:sticky lg:top-4 lg:self-start">
            <FilterSidebar categories={categories} />
          </div>
          <div className="min-w-0 space-y-4">
            <CatalogToolbar />
            <ProductGrid products={products} wishlisted={wishlisted} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={sp} basePath="/products" />
          </div>
        </div>
      </section>
    </main>
  );
}
