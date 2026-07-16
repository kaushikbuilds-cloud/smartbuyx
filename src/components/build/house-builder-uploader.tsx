"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function HouseBuilderUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("house-plans").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from("house-plans").getPublicUrl(path);
    setUrl(data.publicUrl);
    onUploaded(data.publicUrl);
    toast.success("Sketch uploaded");
  }

  if (url) {
    return (
      <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-xl border">
        <Image src={url} alt="Plot sketch" fill className="object-cover" />
        <button
          type="button"
          onClick={() => {
            setUrl(null);
            onUploaded("");
          }}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <label className="flex w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center hover:bg-accent">
      {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
      <p className="text-sm font-medium">{uploading ? "Uploading..." : "Upload plot sketch / photo"}</p>
      <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 10MB</p>
      <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
    </label>
  );
}
