import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getSellerProduct } from "@/features/catalog/queries";
import { updateProduct, type ActionState } from "@/features/catalog/actions";
import { ProductForm } from "@/components/dashboard/seller/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const { id } = await params;
  const product = await getSellerProduct(user.id, id);
  if (!product) notFound();

  const action = async (prev: ActionState, formData: FormData) => updateProduct(id, prev, formData);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit product</h1>
      <ProductForm action={action} product={product} submitLabel="Save changes" />
    </main>
  );
}
