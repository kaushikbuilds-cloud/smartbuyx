"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HardHat, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BuildEstimatorCard() {
  const router = useRouter();
  const [sqft, setSqft] = useState(1200);
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            <HardHat className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold">Build Cost Estimator</h3>
            <p className="text-xs text-muted-foreground">Plan your construction smartly and get accurate material calculation</p>
          </div>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/cost-calculator?sqft=${sqft}`);
          }}
        >
          <div className="relative flex-1">
            <Input
              type="number"
              min={100}
              value={sqft}
              onChange={(e) => setSqft(Number(e.target.value))}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">sqft</span>
          </div>
          <Button type="submit" variant="gradient" size="icon"><ArrowRight className="h-4 w-4" /></Button>
        </form>
        <Button variant="gradient" className="w-full" onClick={() => router.push(`/cost-calculator?sqft=${sqft}`)}>
          Calculate Now <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
