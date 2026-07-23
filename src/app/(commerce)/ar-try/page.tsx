import { ScanLine } from "lucide-react";
import { getArEnabledProducts } from "@/features/catalog/queries";
import { ProductGrid } from "@/components/shop/product-grid";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "AR Try Room" };

export default async function ARTryRoomPage() {
  const products = await getArEnabledProducts();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-md">
          <ScanLine className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">AR Try Room</h1>
          <p className="text-sm text-muted-foreground">
            Preview these items in your own space using your phone's camera — open any product below and tap "View in your space."
          </p>
        </div>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No AR-ready items yet — sellers can add a 3D model to their listings from the product editor.
          </CardContent>
        </Card>
      )}
    </main>
  );
}
