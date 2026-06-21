import { listProducts, listCategories, type ListParams } from "@/features/catalog/queries";
import { getWishlistedIds } from "@/features/catalog/wishlist-queries";
import { getSession } from "@/lib/auth/guards";
import { ProductGrid } from "@/components/shop/product-grid";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { Pagination } from "@/components/shop/pagination";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { CatalogBreadcrumb } from "@/components/shop/catalog-breadcrumb";

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

  const [{ products, total }, categories, session] = await Promise.all([
    listProducts({ kind: "product", q, sort, categoryId: category, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    listCategories("product"),
    getSession(),
  ]);
  const wishlisted = session ? await getWishlistedIds(session.user.id) : undefined;

  return (
    <main className="container mx-auto px-4 py-4">
      {/* Slim header — breadcrumb + title + result count */}
      <div className="mb-4 space-y-2">
        <CatalogBreadcrumb trail={[{ label: "Shop" }]} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-bold">Shop</h1>
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString("en-IN")} results{q ? ` for "${q}"` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        {/* Left filter sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <FilterSidebar categories={categories} />
        </div>

        {/* Right — toolbar + grid */}
        <div className="min-w-0 space-y-4">
          <CatalogToolbar />
          <ProductGrid products={products} wishlisted={wishlisted} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={sp} basePath="/products" />
        </div>
      </div>
    </main>
  );
}
