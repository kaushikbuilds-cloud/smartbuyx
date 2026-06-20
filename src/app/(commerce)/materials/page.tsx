import { listProducts, listCategories, type ListParams } from "@/features/catalog/queries";
import { getWishlistedIds } from "@/features/catalog/wishlist-queries";
import { getSession } from "@/lib/auth/guards";
import { ProductGrid } from "@/components/shop/product-grid";
import { CatalogToolbar } from "@/components/shop/catalog-toolbar";
import { CategoryChips } from "@/components/shop/category-chips";
import { Pagination } from "@/components/shop/pagination";

export const metadata = { title: "Construction Materials" };
const PAGE_SIZE = 24;

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: ListParams["sort"]; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { q, sort, category } = sp;
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ products, total }, categories, session] = await Promise.all([
    listProducts({ kind: "material", q, sort, categoryId: category, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    listCategories("material"),
    getSession(),
  ]);
  const wishlisted = session ? await getWishlistedIds(session.user.id) : undefined;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Construction Materials</h1>
        <p className="text-muted-foreground">{total} materials available</p>
      </div>
      <div className="mb-4"><CategoryChips categories={categories} /></div>
      <div className="mb-6"><CatalogToolbar placeholder="Search cement, steel, tiles..." /></div>
      <ProductGrid products={products} wishlisted={wishlisted} />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} searchParams={sp} basePath="/materials" />
    </main>
  );
}
