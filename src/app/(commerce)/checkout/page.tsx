import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { getCart } from "@/features/orders/cart-queries";
import { listAddresses } from "@/features/account/address-queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckoutClient } from "@/components/shop/checkout-client";
import { AddressForm } from "@/components/shop/address-form";
import { AddressRowActions } from "@/components/shop/address-row-actions";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { user } = await requireUser();
  const [cart, addresses] = await Promise.all([getCart(user.id), listAddresses(user.id)]);

  if (cart.lines.length === 0) {
    return (
      <main className="container mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button variant="gradient" className="mt-4" asChild><Link href="/products">Shop now</Link></Button>
      </main>
    );
  }

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 font-semibold">Delivery address</h2>
              {addresses.length > 0 ? (
                <ul className="mb-4 space-y-2">
                  {addresses.map((a) => (
                    <li key={a.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.line1}</span>
                          {a.is_default ? <Badge variant="secondary">Default</Badge> : null}
                        </div>
                        <AddressRowActions id={a.id} isDefault={a.is_default} />
                      </div>
                      <p className="text-muted-foreground">
                        {[a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 text-sm text-muted-foreground">Add a delivery address to continue.</p>
              )}
              <AddressForm />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold">Order summary</h2>
            {cart.lines.map((l) => (
              <div key={l.itemId} className="flex justify-between text-sm">
                <span className="line-clamp-1 text-muted-foreground">{l.title} × {l.quantity}</span>
                <span>{formatINR(l.unitPrice * l.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatINR(cart.subtotal)}</span>
            </div>
            <CheckoutClient
              addressId={defaultAddress?.id ?? null}
              subtotal={cart.subtotal}
            />
            <p className="text-center text-xs text-muted-foreground">Secured by PayU · UPI, cards, net banking</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
