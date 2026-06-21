import Link from "next/link";
import { FilePlus, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listMyRfqs } from "@/features/rfq/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CatalogBreadcrumb } from "@/components/shop/catalog-breadcrumb";

export const metadata = { title: "My RFQs" };

export default async function RfqListPage() {
  const { user } = await requireUser();
  const rfqs = await listMyRfqs(user.id);

  return (
    <main className="container mx-auto space-y-4 px-4 py-4">
      <CatalogBreadcrumb trail={[{ label: "Get Quotes" }]} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Requests for Quotation</h1>
          <p className="text-xs text-muted-foreground">Post once — reach 100+ verified suppliers automatically.</p>
        </div>
        <Button variant="gradient" size="sm" asChild>
          <Link href="/rfq/new"><FilePlus className="h-4 w-4" /> New RFQ</Link>
        </Button>
      </div>

      {rfqs.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <FileText className="h-10 w-10" />
          No RFQs yet. Post one to get supplier quotes within hours.
        </Card>
      ) : (
        <div className="space-y-2">
          {rfqs.map((r) => (
            <Link key={r.id} href={`/rfq/${r.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Sent to {r.target_supplier_count} suppliers · {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <Badge variant={r.status === "open" ? "default" : "success"}>{r.status}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
