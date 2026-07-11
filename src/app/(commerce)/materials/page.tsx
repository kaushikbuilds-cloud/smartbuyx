import { Sparkles } from "lucide-react";
import { listProducts, listCategories, type ListParams } from "@/features/catalog/queries";
import { getWishlistedIds } from "@/features/catalog/wishlist-queries";
import { getSession } from "@/lib/auth/guards";
import { parseSmartQuery, looksNatural } from "@/features/ai/smart-search";
import { formatINR } from "@/lib/utils/format";
import { ProductGrid } from "@/components/shop/product-grid";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { Pagination } from "@/components/shop/pagination";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { CatalogBreadcrumb } from "@/components/shop/catalog-breadcrumb";

export const metadata = { title: "Construction Materials" };
const PAGE_SIZE = 24;

type SP = {
  q?: string;
  sort?: ListParams["sort"];
  category?: string;
  page?: string;
  min?: string;
  max?: string;
  rating?: string;
};

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { q, sort, category } = sp;
  const page = Math.max(1, Number(sp.page) || 1);

  const parsed = q && looksNatural(q) ? await parseSmartQuery(q) : null;
  const effectiveQ = parsed?.keywords || q;
  const minPrice = Number(sp.min) || parsed?.minPrice || undefined;
  const maxPrice = Number(sp.max) || parsed?.maxPrice || undefined;
  const minRating = Number(sp.rating) || parsed?.minRating || undefined;

  const [{ products, total }, categories, session] = await Promise.all([
    listProducts({
      kind: "material", q: effectiveQ, sort, categoryId: category,
      minPrice, maxPrice, minRating,
      limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE,
    }),
    listCategories("material"),
    getSession(),
  ]);
  const wishlisted = session ? await getWishlistedIds(session.user.id) : undefined;

  const aiApplied = parsed && (parsed.maxPrice || parsed.minPrice || parsed.minRating || parsed.keywords !== q);

  return (
    <main className="container mx-auto px-4 py-4">
      <div className="mb-4 space-y-2">
        <CatalogBreadcrumb trail={[{ label: "Construction Materials" }]} />
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">Construction Materials</h1>
            {aiApplied ? (
              <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <Sparkles className="h-3 w-3" />
                AI understood: {parsed.keywords}
                {parsed.maxPrice ? ` · under ${formatINR(parsed.maxPrice)}` : ""}
                {parsed.minRating ? ` · ${parsed.minRating}★ & up` : ""}
              </p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString("en-IN")} results{q ? ` for "${q}"` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <FilterSidebar categories={categories} />
        </div>

        <div className="min-w-0 space-y-4">
          <CatalogToolbar placeholder="Search cement, steel, tiles..." />
          <ProductGrid products={products} wishlisted={wishlisted} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={sp} basePath="/materials" />
        </div>
      </div>
    </main>
  );
}
