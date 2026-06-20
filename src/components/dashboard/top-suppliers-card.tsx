import Link from "next/link";
import { Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrustScoreBadge } from "@/components/shop/trust-score-badge";
import type { SupplierListItem } from "@/features/suppliers/queries";

export function TopSuppliersCard({ suppliers }: { suppliers: SupplierListItem[] }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Top-Rated Suppliers</h3>
          <Link href="/suppliers" className="text-xs text-primary hover:underline">View All</Link>
        </div>

        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
            <Store className="h-8 w-8" />
            <p className="text-xs">No verified suppliers yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {suppliers.slice(0, 4).map((s) => (
              <li key={s.user_id}>
                <Link href={`/suppliers/${s.user_id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <Store className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.business_name}</p>
                    <TrustScoreBadge score={s.trust_score} verified={s.gstin_verified} size="sm" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
