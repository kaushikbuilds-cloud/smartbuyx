import { requireRole } from "@/lib/auth/guards";
import { createRefurbishedProduct } from "@/features/refurbished/actions";
import { RefurbishedForm } from "@/components/dashboard/seller/refurbished-form";

export const metadata = { title: "List a Refurbished Item · Seller" };

export default async function NewRefurbishedProductPage() {
  await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">List a refurbished item</h1>
      <RefurbishedForm action={createRefurbishedProduct} submitLabel="Submit for inspection" />
    </main>
  );
}
