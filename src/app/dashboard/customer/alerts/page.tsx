import Link from "next/link";
import Image from "next/image";
import { Bell, ImageOff, TrendingDown, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listMyAlerts } from "@/features/preferences/alerts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/dashboard/page-shell";
import { DeleteAlertButton } from "@/components/shop/delete-alert-button";
import { formatINR } from "@/lib/utils/format";

export const metadata = { title: "Price Alerts" };

export default async function PriceAlertsPage() {
  const { user } = await requireUser();
  const alerts = await listMyAlerts(user.id);

  return (
    <PageShell
      title="Price Alerts"
      description="Get notified when prices drop on products you watch."
      actions={<Button variant="outline" asChild><Link href="/products">Browse to add</Link></Button>}
    >
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10" />
            <p>No alerts yet. Visit any product and tap &quot;Track price&quot; to add one.</p>
            <Button variant="gradient" asChild><Link href="/products">Browse products</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const triggered = !!a.triggered_at;
            return (
              <Card key={a.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Link href={`/products/${a.slug}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {a.image ? (
                      <Image src={a.image} alt={a.title} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${a.slug}`} className="line-clamp-1 font-medium hover:underline">
                      {a.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Target: <strong className="text-foreground">{formatINR(a.target_price)}</strong></span>
                      <span>·</span>
                      <span>Current: {formatINR(a.current_price)}</span>
                      {triggered ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Triggered
                        </Badge>
                      ) : a.current_price <= a.target_price ? (
                        <Badge variant="success">Within target</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <TrendingDown className="h-3 w-3" /> Waiting
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DeleteAlertButton id={a.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
