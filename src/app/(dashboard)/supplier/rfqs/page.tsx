import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { listSupplierRfqs } from "@/features/rfq/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Incoming RFQs" };

export default async function SupplierRfqsPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const rfqs = await listSupplierRfqs(user.id);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Incoming RFQs</h1>

      {rfqs.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Inbox className="h-10 w-10" />
          No RFQs in your inbox yet.
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
                      {r.pincode ? `${r.pincode} · ` : ""}
                      {r.budget_min || r.budget_max
                        ? `Budget ${r.budget_min ? formatINR(Number(r.budget_min)) : "—"}–${r.budget_max ? formatINR(Number(r.budget_max)) : "—"}`
                        : "Budget open"}
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
