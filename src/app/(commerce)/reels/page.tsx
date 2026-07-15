import { Video } from "lucide-react";
import { getPublishedReels } from "@/features/creator/queries";
import { Card, CardContent } from "@/components/ui/card";
import { ReelCard } from "@/components/creator/reel-card";

export const metadata = { title: "Creator Reels" };

export default async function ReelsPage() {
  const reels = await getPublishedReels();

  return (
    <main className="container mx-auto space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Creator Reels</h1>
        <p className="text-sm text-muted-foreground">Shoppable videos from SmartBuyX creators.</p>
      </div>

      {reels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-16 text-center text-muted-foreground">
            <Video className="h-10 w-10" />
            No reels published yet. Check back soon!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reels.map((r) => <ReelCard key={r.id} reel={r} />)}
        </div>
      )}
    </main>
  );
}
