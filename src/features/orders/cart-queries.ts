import { createClient } from "@/lib/supabase/server";

export type CartLine = {
  itemId: string;
  variantId: string;
  quantity: number;
  sku: string;
  unitPrice: number;
  productId: string;
  title: string;
  slug: string;
  image: string | null;
  sellerId: string;
};

export type Cart = {
  lines: CartLine[];
  subtotal: number;
  itemCount: number;
};

export async function getCart(userId: string): Promise<Cart> {
  const supabase = await createClient();
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).single();
  if (!cart) return { lines: [], subtotal: 0, itemCount: 0 };

  const { data } = await supabase
    .from("cart_items")
    .select(
      `id, quantity, variant_id,
       product_variants!inner ( id, sku, price,
         products!inner ( id, title, slug, images, supplier_id ) )`
    )
    .eq("cart_id", cart.id);

  const lines: CartLine[] = (data ?? []).map((row) => {
    // Supabase returns nested relations as objects (single) here.
    const variant = row.product_variants as unknown as {
      id: string; sku: string; price: number;
      products: { id: string; title: string; slug: string; images: { url: string }[]; supplier_id: string };
    };
    const product = variant.products;
    return {
      itemId: row.id,
      variantId: row.variant_id,
      quantity: row.quantity,
      sku: variant.sku,
      unitPrice: Number(variant.price),
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: product.images?.[0]?.url ?? null,
      sellerId: product.supplier_id,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { lines, subtotal, itemCount };
}
