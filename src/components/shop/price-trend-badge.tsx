import { TrendingDown, TrendingUp, Minus, Award } from "lucide-react";
import type { PriceTrend } from "@/features/catalog/price-trend";

export function PriceTrendBadge({ trend }: { trend: PriceTrend }) {
  if (trend.trend === "new") {
    return trend.pointCount === 0 ? null : (
      <p className="text-xs text-muted-foreground">We just started tracking this price.</p>
    );
  }

  if (trend.isLowestRecorded) {
    return (
      <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
        <Award className="h-3.5 w-3.5" /> Lowest price we've tracked
      </p>
    );
  }

  if (trend.trend === "flat" || trend.changePercent === null) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" /> Price steady over the last month
      </p>
    );
  }

  const isUp = trend.trend === "up";
  return (
    <p className={`flex items-center gap-1 text-xs font-medium ${isUp ? "text-rose-600" : "text-emerald-600"}`}>
      {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {isUp ? "Up" : "Down"} {Math.abs(trend.changePercent)}% in the last month
    </p>
  );
}
