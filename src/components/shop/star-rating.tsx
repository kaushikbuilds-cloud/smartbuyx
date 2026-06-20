import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function StarRating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
      {typeof count === "number" ? (
        <span className="text-xs text-muted-foreground">
          {value.toFixed(1)} ({count})
        </span>
      ) : null}
    </div>
  );
}
