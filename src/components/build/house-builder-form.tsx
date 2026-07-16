"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, Home, Boxes, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { HouseBuilderUploader } from "./house-builder-uploader";
import { generateHouseBuilderPlan, type HouseBuilderOutput } from "@/features/ai/house-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";

export function HouseBuilderForm() {
  const [sketchUrl, setSketchUrl] = useState("");
  const [plotSize, setPlotSize] = useState("1200");
  const [floors, setFloors] = useState("2");
  const [requirements, setRequirements] = useState("");
  const [output, setOutput] = useState<HouseBuilderOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    if (!sketchUrl) {
      toast.error("Upload a plot sketch or photo first");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await generateHouseBuilderPlan({
        sketchUrl,
        plotSizeSqft: plotSize,
        floors,
        requirements,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOutput(res.output);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <HouseBuilderUploader onUploaded={setSketchUrl} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="plotSize">Plot size (sqft)</Label>
                <Input id="plotSize" type="number" min="1" value={plotSize} onChange={(e) => setPlotSize(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="floors">Floors</Label>
                <Input id="floors" type="number" min="1" max="10" value={floors} onChange={(e) => setFloors(e.target.value)} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="requirements">Requirements (optional)</Label>
                <textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={2}
                  placeholder="e.g. 3 bedrooms, home office, vastu-compliant entrance"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <Button variant="gradient" onClick={generate} disabled={pending || !sketchUrl}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate floor plan
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {output ? (
        <div className="space-y-4">
          <Card className="border-purple-200 bg-purple-50/40 dark:border-purple-900 dark:bg-purple-950/20">
            <CardContent className="p-4 text-sm">{output.summary}</CardContent>
          </Card>

          {output.floorPlans.map((fp) => (
            <Card key={fp.floor}>
              <CardContent className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><Home className="h-4 w-4 text-purple-600" /> {fp.floor}</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {fp.rooms.map((r, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{r.name} <span className="text-muted-foreground">· {r.approxSqft} sqft</span></p>
                      {r.notes ? <p className="text-xs text-muted-foreground">{r.notes}</p> : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><Boxes className="h-4 w-4 text-emerald-600" /> Bill of materials</h3>
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="pb-2">Material</th><th className="pb-2">Quantity</th><th className="pb-2">Notes</th></tr>
                </thead>
                <tbody>
                  {output.materialEstimate.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2">{m.material}</td>
                      <td className="py-2">{m.quantity}</td>
                      <td className="py-2 text-muted-foreground">{m.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <IndianRupee className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Estimated cost</p>
                <p className="text-xl font-bold">{formatINR(output.costEstimate.low)} – {formatINR(output.costEstimate.high)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
