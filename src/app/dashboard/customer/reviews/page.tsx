import { Star } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/dashboard/page-shell";
import { StarRating } from "@/components/shop/star-rating";

export const metadata = { title: "My Reviews" };

export default async function MyReviewsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, title, comment, verified_purchase, target_id, target_type, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <PageShell title="My Reviews" description={`You've written ${reviews?.length ?? 0} reviews.`}>
      {(reviews ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
            <Star className="h-10 w-10" />
            <p>You haven&apos;t reviewed anything yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(reviews ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} />
                  {r.verified_purchase ? <Badge variant="success">Verified</Badge> : null}
                </div>
                {r.title ? <p className="font-medium">{r.title}</p> : null}
                {r.comment ? <p className="text-sm text-muted-foreground">{r.comment}</p> : null}
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
