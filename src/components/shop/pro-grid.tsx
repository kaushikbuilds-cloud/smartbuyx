import Link from "next/link";
import { Briefcase, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import type { ProListing } from "@/features/pros/queries";

export function ProGrid({ pros, rfqCta }: { pros: ProListing[]; rfqCta: string }) {
  if (pros.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
          <Briefcase className="h-10 w-10" />
          <p>No profiles yet. Post an RFQ and we&apos;ll reach out to the right pros for you.</p>
          <Button variant="gradient" asChild>
            <Link href="/rfq/new">{rfqCta}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {pros.map((p) => (
        <Card key={p.user_id} className="transition-shadow hover:shadow-md">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                <Briefcase className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.display_name}</p>
                {p.experience ? (
                  <p className="text-xs text-muted-foreground">{p.experience} years experience</p>
                ) : null}
              </div>
              {p.rate_label ? <Badge variant="secondary">{p.rate_label}</Badge> : null}
            </div>

            {p.bio ? <p className="line-clamp-2 text-sm text-muted-foreground">{p.bio}</p> : null}

            {p.meta.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {p.meta.slice(0, 4).map((m) => (
                  <Badge key={m} variant="outline" className="text-xs capitalize">{m}</Badge>
                ))}
              </div>
            ) : null}

            <div className="flex items-center justify-between border-t pt-3">
              {p.rating_count > 0 ? (
                <StarRating value={p.rating_avg} count={p.rating_count} />
              ) : (
                <span className="text-xs text-muted-foreground">No reviews yet</span>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link href="/rfq/new"><MessageSquare className="h-3.5 w-3.5" /> Get Quote</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
