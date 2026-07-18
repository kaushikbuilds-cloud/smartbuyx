import Link from "next/link";
import { listAllProducts } from "@/features/admin/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductStatusToggle } from "@/components/admin/product-status-toggle";
import { ProductFeaturedToggle } from "@/components/admin/product-featured-toggle";

export const metadata = { title: "Products · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await listAllProducts(q);

  return (
    <main className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Products</h1>
        <form action="/dashboard/admin/products">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search title..."
            className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm"
          />
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Sold</th>
                <th className="p-3">Status</th>
                <th className="p-3">Featured</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link href={`/products/${p.slug}`} className="font-medium hover:underline">{p.title}</Link>
                  </td>
                  <td className="p-3 text-right">{formatINR(p.base_price)}</td>
                  <td className="p-3 text-right">{p.sales_count}</td>
                  <td className="p-3">
                    <Badge variant={p.status === "active" ? "success" : "secondary"}>{p.status}</Badge>
                  </td>
                  <td className="p-3"><ProductFeaturedToggle id={p.id} featured={p.is_featured} /></td>
                  <td className="p-3 text-right"><ProductStatusToggle id={p.id} status={p.status} /></td>
                </tr>
              ))}
              {products.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No products found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
