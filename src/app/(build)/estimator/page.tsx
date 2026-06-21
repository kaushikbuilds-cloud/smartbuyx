import Link from "next/link";
import { Boxes, Upload, FileText, Calculator } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";

export const metadata = { title: "AI Material Estimator" };

export default async function EstimatorPage() {
  await requireUser();
  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      <PageHero
        variant="build"
        badge="AI vision"
        title="Material Estimator"
        description="Upload a CAD file, blueprint or floor plan — get an accurate Bill of Quantities with live supplier prices."
        icon={Boxes}
        actions={
          <Button className="bg-white text-orange-700 hover:bg-white/90">
            <Upload className="h-4 w-4" /> Upload blueprint
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: FileText, title: "CAD / Blueprint", desc: "Upload PDF, DWG, or image" },
          { icon: Calculator, title: "AI parses it", desc: "Cement, steel, bricks, tiles, paint" },
          { icon: Boxes, title: "BOQ + prices", desc: "Quantities + supplier quotes ranked" },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent className="space-y-2 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
          <Boxes className="h-12 w-12 text-orange-500" />
          <p className="text-base font-semibold text-foreground">Coming online very soon</p>
          <p className="max-w-md text-sm">Add Gemini Vision keys in env to enable AI parsing. UI shell ready.</p>
          <Button variant="outline" asChild>
            <Link href="/cost-calculator">Use quick Cost Calculator</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
