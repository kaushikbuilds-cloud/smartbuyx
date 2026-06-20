import { requireRole } from "@/lib/auth/guards";
import { createProduct } from "@/features/catalog/actions";
import { ProductForm } from "@/components/dashboard/seller/product-form";

export default async function NewProductPage() {
  await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Add product</h1>
      <ProductForm action={createProduct} submitLabel="Create product" />
    </main>
  );
}
