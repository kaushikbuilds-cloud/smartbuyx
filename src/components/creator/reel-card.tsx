import Link from "next/link";
import Image from "next/image";
import { PlayCircle, ShoppingBag, ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";
import type { ReelFeedItem } from "@/features/creator/queries";

export function ReelCard({ reel }: { reel: ReelFeedItem }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[9/16] max-h-96 w-full bg-black">
        {reel.thumbnailUrl ? (
          <Image src={reel.thumbnailUrl} alt={reel.title ?? "Reel"} fill className="object-cover opacity-90" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/60">
            <PlayCircle className="h-12 w-12" />
          </div>
        )}
        <a
          href={reel.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100"
        >
          <PlayCircle className="h-14 w-14 text-white" />
        </a>
      </div>
      <CardContent className="space-y-2 p-4">
        <div>
          <p className="font-medium">{reel.title ?? "Untitled reel"}</p>
          <p className="text-xs text-muted-foreground">
            by {reel.creatorName ?? "Creator"} · {reel.views} views
          </p>
        </div>
        {reel.caption ? <p className="line-clamp-2 text-sm text-muted-foreground">{reel.caption}</p> : null}

        {reel.taggedProducts.length > 0 ? (
          <div className="space-y-1.5 border-t pt-2">
            <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <ShoppingBag className="h-3 w-3" /> Shop this
            </p>
            {reel.taggedProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.image ? (
                    <Image src={p.image} alt={p.title} fill sizes="40px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-3 w-3" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{p.title}</p>
                  <p className="text-xs font-bold">{formatINR(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
