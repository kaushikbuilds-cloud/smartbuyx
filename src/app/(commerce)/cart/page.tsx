import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "@/features/orders/cart-queries";
import { formatINR } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CartLineItem } from "@/components/shop/cart-line-item";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const { user } = await requireUser();
  const cart = await getCart(user.id);

  if (cart.lines.length === 0) {
    return (
      <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-24 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button variant="gradient" asChild><Link href="/products">Start shopping</Link></Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Cart ({cart.itemCount})</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {cart.lines.map((line) => (
            <CartLineItem key={line.itemId} line={line} />
          ))}
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold">Order summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatINR(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between border-t pt-4 font-semibold">
              <span>Total</span>
              <span>{formatINR(cart.subtotal)}</span>
            </div>
            <Button variant="gradient" className="w-full" asChild>
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
