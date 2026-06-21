import Link from "next/link";
import { Sparkles, ArrowRight, Upload, Boxes, Ruler } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/layout/page-hero";

export const metadata = { title: "AI House Builder" };

export default async function HouseBuilderPage() {
  await requireUser();
  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      <PageHero
        variant="build"
        badge="AI-generated"
        title="AI House Builder"
        description="Sketch a plot → AI generates floor plans, elevations, 3D models, BOQ and cost estimates in minutes."
        icon={Sparkles}
        actions={
          <Button className="bg-white text-orange-700 hover:bg-white/90">
            <Upload className="h-4 w-4" /> Upload sketch / plot
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="font-semibold">Floor plans + 3D</h3>
            <p className="text-sm text-muted-foreground">Multiple layout options with elevations and a 360° tour.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Boxes className="h-5 w-5" />
            </span>
            <h3 className="font-semibold">Bill of materials</h3>
            <p className="text-sm text-muted-foreground">Cement, steel, tiles, paint — quantities computed automatically.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Ruler className="h-5 w-5" />
            </span>
            <h3 className="font-semibold">Cost estimate</h3>
            <p className="text-sm text-muted-foreground">Range with seller pricing across your region.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 text-purple-500" />
          <p className="text-base font-semibold text-foreground">Coming online very soon</p>
          <p className="max-w-md text-sm">Gemini / OpenAI keys plug in here and your sketches start generating plans within seconds.</p>
          <Button variant="outline" asChild>
            <Link href="/estimator">Try Material Estimator <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
