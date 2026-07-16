"use client";

import { useState } from "react";
import { Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function ReturnProofUploader() {
  const [url, setUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("return-proof").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from("return-proof").getPublicUrl(path);
    setUrl(data.publicUrl);
    toast.success("Proof uploaded");
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="videoUrl" value={url ?? ""} />
      {url ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Video className="h-4 w-4" /> Proof attached
          <button type="button" onClick={() => setUrl(null)} className="text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-xs hover:bg-accent">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : "Attach photo/video proof"}
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      )}
      <p className="text-[11px] text-muted-foreground">Speeds up approval for damaged/wrong-item returns.</p>
    </div>
  );
}
