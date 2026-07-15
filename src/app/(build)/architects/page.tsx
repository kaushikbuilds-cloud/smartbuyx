import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listPros } from "@/features/pros/queries";
import { ProGrid } from "@/components/shop/pro-grid";
import { CatalogBreadcrumb } from "@/components/shop/catalog-breadcrumb";

export const metadata = { title: "Architects" };

export default async function ArchitectsPage() {
  const pros = await listPros("architect");
  return (
    <main className="container mx-auto space-y-4 px-4 py-4">
      <CatalogBreadcrumb trail={[{ label: "Hire a Pro", href: "/architects" }, { label: "Architects" }]} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Architects</h1>
          <p className="text-xs text-muted-foreground">Floor plans, elevations, BIM design and structural planning.</p>
        </div>
        <Button variant="gradient" size="sm" asChild><Link href="/rfq/new">Post a brief</Link></Button>
      </div>
      <ProGrid pros={pros} rfqCta="Find architects for me" role="architect" />
    </main>
  );
}
