import { CheckCircle2 } from "lucide-react";
import { StarRating } from "./star-rating";
import { Badge } from "@/components/ui/badge";
import type { Review } from "@/features/catalog/types";

export function ReviewList({ reviews, avg, count }: { reviews: Review[]; avg: number; count: number }) {
  if (count === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review after purchase.</p>;
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">{avg.toFixed(1)}</div>
        <div>
          <StarRating value={avg} />
          <p className="text-sm text-muted-foreground">{count} ratings</p>
        </div>
      </div>
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <StarRating value={r.rating} />
              {r.verified_purchase ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </Badge>
              ) : null}
            </div>
            {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
            {r.comment ? <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p> : null}
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString("en-IN")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
