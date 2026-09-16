import Link from "next/link";
import { MapPin, PackageCheck, ShieldCheck } from "lucide-react";
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
      <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <PackageCheck className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button variant="gradient" className="mt-4" asChild><Link href="/products">Shop now</Link></Button>
      </main>
    );
  }

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  return (
    <main className="container mx-auto px-4 py-8 lg:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review your address and complete your order.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <h2 className="font-semibold">Delivery address</h2>
              </div>

              {addresses.length > 0 ? (
                <ul className="mb-5 space-y-3">
                  {addresses.map((a) => (
                    <li
                      key={a.id}
                      className={`rounded-xl border p-4 text-sm transition-colors ${
                        a.is_default ? "border-primary/40 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{a.line1}</span>
                          {a.is_default ? <Badge variant="default">Default</Badge> : null}
                        </div>
                        <AddressRowActions id={a.id} isDefault={a.is_default} />
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {[a.line2, a.city, a.state, a.pincode].filter(Boolean).join(", ")}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-5 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Add a delivery address to continue.
                </p>
              )}
              <AddressForm />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <h2 className="font-semibold">Order summary</h2>
            <div className="space-y-2.5 border-b pb-4">
              {cart.lines.map((l) => (
                <div key={l.itemId} className="flex justify-between gap-3 text-sm">
                  <span className="line-clamp-1 text-muted-foreground">{l.title} × {l.quantity}</span>
                  <span className="shrink-0 font-medium">{formatINR(l.unitPrice * l.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatINR(cart.subtotal)}</span>
            </div>
            <CheckoutClient
              addressId={defaultAddress?.id ?? null}
              subtotal={cart.subtotal}
            />
            <div className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Secured by Shiprocket Checkout · UPI, cards, net banking, COD</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
