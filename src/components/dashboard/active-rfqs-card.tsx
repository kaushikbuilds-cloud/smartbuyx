import Link from "next/link";
import { FileText, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RfqSummary } from "@/features/rfq/queries";

export function ActiveRfqsCard({ rfqs }: { rfqs: RfqSummary[] }) {
  const open = rfqs.filter((r) => r.status === "open");
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Active RFQs</h3>
          {open.length > 0 ? <Badge>{open.length} open</Badge> : null}
        </div>

        {rfqs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p className="text-xs">Post once → reach 100 verified suppliers</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rfqs.slice(0, 3).map((r) => (
              <li key={r.id}>
                <Link href={`/rfq/${r.id}`} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.target_supplier_count} suppliers reached</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/rfq/new"><Plus className="h-4 w-4" /> New RFQ</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
