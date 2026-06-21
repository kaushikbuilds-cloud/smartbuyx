import { Calculator, HardHat, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";

export const metadata = { title: "Cost Calculator" };

const RATES = { basic: 1450, standard: 1800, premium: 2400, luxury: 3500 };

export default async function CostCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ sqft?: string }>;
}) {
  const sp = await searchParams;
  const sqft = Math.max(100, Number(sp.sqft) || 1200);

  const rows = (Object.keys(RATES) as (keyof typeof RATES)[]).map((tier) => ({
    tier,
    rate: RATES[tier],
    total: sqft * RATES[tier],
  }));

  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      <PageHero
        variant="build"
        badge="Quick estimate"
        title="Cost Calculator"
        description="Get a ball-park budget for your construction by plot size and finish tier."
        icon={Calculator}
        actions={
          <Button asChild className="bg-white text-orange-700 hover:bg-white/90">
            <Link href="/estimator">Detailed BOQ <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-6">
          <form className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="sqft" className="text-sm font-medium">Built-up area (sqft)</label>
              <input
                id="sqft"
                name="sqft"
                type="number"
                min={100}
                defaultValue={sqft}
                className="h-10 w-48 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <Button type="submit" variant="gradient">Recalculate</Button>
          </form>

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left">Finish tier</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Estimated cost</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.tier} className="border-t">
                    <td className="px-4 py-3 capitalize">{r.tier}</td>
                    <td className="px-4 py-3 text-right">{inr(r.rate)}/sqft</td>
                    <td className="px-4 py-3 text-right font-semibold">{inr(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <HardHat className="mr-1 inline h-3 w-3" />
            Includes materials &amp; labour. Excludes land, architect fees, interiors. Regional variation ±10-20%.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
