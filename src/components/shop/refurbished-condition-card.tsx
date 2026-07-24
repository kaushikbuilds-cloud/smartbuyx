import { BatteryMedium, ShieldCheck, PackageCheck, Award } from "lucide-react";
import { CONDITION_LABELS, type ConditionGrade } from "@/features/refurbished/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RefurbishedConditionCard({
  details,
}: {
  details: {
    condition_grade: string;
    battery_health: number | null;
    warranty_months: number;
    accessories_included: string | null;
  };
}) {
  return (
    <Card className="border-teal-200 dark:border-teal-900/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-teal-600" />
          <p className="text-sm font-semibold">Refurbished — Quality Inspected</p>
          <Badge variant="success" className="ml-auto">{CONDITION_LABELS[details.condition_grade as ConditionGrade] ?? details.condition_grade}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-3">
          {details.battery_health != null ? (
            <div className="flex items-center gap-1.5">
              <BatteryMedium className="h-3.5 w-3.5" /> {details.battery_health}% battery health
            </div>
          ) : null}
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> {details.warranty_months > 0 ? `${details.warranty_months} month warranty` : "No warranty"}
          </div>
          {details.accessories_included ? (
            <div className="flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5" /> {details.accessories_included}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
