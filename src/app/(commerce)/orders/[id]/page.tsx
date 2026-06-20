import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getOrder } from "@/features/orders/order-queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { ReviewForm } from "@/components/shop/review-form";
import { CancelOrderButton } from "@/components/shop/cancel-order-button";
import { ConfirmDeliveryButton } from "@/components/shop/confirm-delivery-button";
import { ReturnPopover } from "@/components/shop/return-popover";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

const CANCELLABLE = ["pending", "paid", "processing"];

const STAGES = ["pending", "paid", "processing", "shipped", "delivered"];

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await params;
  const order = await getOrder(user.id, id);
  if (!order) notFound();

  // Resolve product slugs for variant → product links (for reviews after delivery).
  const supabase = await createClient();
  const variantIds = order.items.map((i) => i.variant_id);
  const [variantsRes, shipmentsRes, escrowRes] = await Promise.all([
    supabase.from("product_variants").select("id, products(id, slug)").in("id", variantIds),
    supabase.from("shipments").select("id, status, seller_id").eq("order_id", order.id),
    supabase.from("escrow_holds").select("amount, status").eq("order_id", order.id),
  ]);
  const productByVariant = new Map<string, { id: string; slug: string }>();
  for (const v of variantsRes.data ?? []) {
    const p = v.products as unknown as { id: string; slug: string };
    if (p) productByVariant.set(v.id, p);
  }
  const shipments = shipmentsRes.data ?? [];
  const heldEscrow = (escrowRes.data ?? []).filter((e) => e.status === "held");
  const heldTotal = heldEscrow.reduce((sum, e) => sum + Number(e.amount), 0);

  const currentStage = STAGES.indexOf(order.status);
  const delivered = order.status === "delivered";

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {order.status !== "pending" && order.status !== "cancelled" ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/orders/${order.id}/invoice`}><FileText className="h-4 w-4" /> Invoice</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {heldTotal > 0 ? (
        <div className="mb-4">
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> {formatINR(heldTotal)} held in escrow — released when you confirm delivery
          </Badge>
        </div>
      ) : null}

      {/* Per-shipment confirm delivery (releases escrow to that seller). */}
      {shipments.some((s) => s.status === "delivered") ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {shipments.filter((s) => s.status === "delivered").map((s) => (
            <ConfirmDeliveryButton key={s.id} shipmentId={s.id} />
          ))}
        </div>
      ) : null}

      {CANCELLABLE.includes(order.status) ? (
        <div className="mb-6"><CancelOrderButton orderId={order.id} /></div>
      ) : null}

      {/* Status timeline */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  i <= currentStage && currentStage >= 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm capitalize">{stage}</span>
              </div>
            ))}
          </div>
          {order.status === "pending" ? (
            <p className="mt-3 text-sm text-amber-600">Awaiting payment confirmation.</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {order.items.map((item) => {
            const product = productByVariant.get(item.variant_id);
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatINR(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">{formatINR(item.total)}</span>
                  </div>
                  {delivered ? (
                    <div className="mt-3">
                      <ReturnPopover orderItemId={item.id} />
                    </div>
                  ) : null}
                  {delivered && product ? (
                    <div className="mt-4">
                      <ReviewForm productId={product.id} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-2 p-6 text-sm">
            <h2 className="font-semibold">Payment</h2>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatINR(order.tax)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatINR(order.shipping)}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatINR(order.total)}</span></div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
