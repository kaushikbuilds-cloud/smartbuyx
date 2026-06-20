import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Order placed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-24 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
      <h1 className="text-3xl font-bold">Order placed!</h1>
      <p className="max-w-md text-muted-foreground">
        Your payment was successful and your order is confirmed. You can track its status anytime.
      </p>
      <div className="mt-2 flex gap-3">
        {order ? (
          <Button variant="gradient" asChild><Link href={`/orders/${order}`}>Track order</Link></Button>
        ) : null}
        <Button variant="outline" asChild><Link href="/products">Continue shopping</Link></Button>
      </div>
    </main>
  );
}
