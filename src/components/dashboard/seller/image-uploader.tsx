"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { enhanceProductImage } from "@/features/ai/image-enhancement";

export function ImageUploader({ initial = [] }: { initial?: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  function enhance(url: string) {
    setEnhancing(url);
    startTransition(async () => {
      const result = await enhanceProductImage(url);
      setEnhancing(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        setUrls((prev) => prev.map((u) => (u === url ? result.url! : u)));
        toast.success("Image enhanced");
      }
    });
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    const next: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      next.push(data.publicUrl);
    }
    setUrls((prev) => [...prev, ...next]);
    setUploading(false);
    if (next.length) toast.success(`${next.length} image(s) uploaded`);
  }

  function remove(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      {/* The product form reads this hidden field. */}
      <input type="hidden" name="images" value={urls.join("\n")} />

      {urls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border">
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90"
              >
                <X className="h-3 w-3" />
              </button>
              <button
                type="button"
                title="Enhance with AI"
                disabled={isPending}
                onClick={() => enhance(url)}
                className="absolute bottom-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/90"
              >
                {enhancing === url ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm hover:bg-accent">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Uploading..." : "Upload images"}
        <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={uploading} />
      </label>
      <p className="text-xs text-muted-foreground">First image is the cover. JPEG/PNG/WebP.</p>
    </div>
  );
}
