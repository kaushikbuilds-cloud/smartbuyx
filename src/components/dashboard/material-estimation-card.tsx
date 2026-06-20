import Link from "next/link";
import { Boxes, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Quick reference estimate for a typical residential build.
function roughEstimate(sqft: number) {
  return {
    cement: Math.round(sqft * 0.2),   // bags
    steel: Math.round(sqft * 0.002 * 10) / 10,   // tons
    sand: Math.round(sqft * 0.015),   // units
    bricks: Math.round(sqft * 5),     // count
  };
}

export function MaterialEstimationCard({ sqft = 1200 }: { sqft?: number }) {
  const e = roughEstimate(sqft);
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Material Estimation ({sqft} sqft)</h3>
          <Boxes className="h-5 w-5 text-amber-500" />
        </div>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Cement</dt><dd className="text-right font-medium">{e.cement} bags</dd>
          <dt className="text-muted-foreground">Steel</dt><dd className="text-right font-medium">{e.steel} tons</dd>
          <dt className="text-muted-foreground">Sand</dt><dd className="text-right font-medium">{e.sand} units</dd>
          <dt className="text-muted-foreground">Bricks</dt><dd className="text-right font-medium">{e.bricks.toLocaleString("en-IN")} nos</dd>
        </dl>
        <Link href="/rfq/new" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Get Quotes from Suppliers <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
