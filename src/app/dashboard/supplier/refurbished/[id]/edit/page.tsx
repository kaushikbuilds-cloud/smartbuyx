import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getMyRefurbishedProduct } from "@/features/refurbished/queries";
import { updateRefurbishedProduct, type ActionState } from "@/features/refurbished/actions";
import { RefurbishedForm } from "@/components/dashboard/seller/refurbished-form";

export const metadata = { title: "Edit Refurbished Item · Seller" };

export default async function EditRefurbishedProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const { id } = await params;
  const product = await getMyRefurbishedProduct(user.id, id);
  if (!product) notFound();

  const action = async (prev: ActionState, formData: FormData) => updateRefurbishedProduct(id, prev, formData);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit refurbished item</h1>
      <RefurbishedForm action={action} product={product} submitLabel="Save changes" />
    </main>
  );
}
