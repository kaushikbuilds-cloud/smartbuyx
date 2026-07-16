import { Sparkles, Boxes, Ruler } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/layout/page-hero";
import { HouseBuilderForm } from "@/components/build/house-builder-form";

export const metadata = { title: "AI House Builder" };

export default async function HouseBuilderPage() {
  await requireUser();
  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      <PageHero
        variant="build"
        badge="AI-generated"
        title="AI House Builder"
        description="Upload a plot sketch or photo → AI generates a floor plan layout, bill of materials, and cost estimate in seconds."
        icon={Sparkles}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="font-semibold">Floor plan layout</h3>
            <p className="text-sm text-muted-foreground">Room-by-room breakdown with approximate sizing per floor.</p>
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
            <p className="text-sm text-muted-foreground">India-market ₹/sqft range based on your inputs.</p>
          </CardContent>
        </Card>
      </div>

      <HouseBuilderForm />
    </main>
  );
}
