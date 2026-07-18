"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Store, Upload } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { saveStoreLogo } from "@/features/seller/verification";

export function StoreLogoUploader({ userId, initialUrl }: { userId: string; initialUrl: string | null }) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logos/${userId}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (uploadError) {
      setUploading(false);
      e.target.value = "";
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    const { error } = await saveStoreLogo(data.publicUrl);
    setUploading(false);
    e.target.value = "";
    if (error) {
      toast.error(error);
      return;
    }
    setUrl(data.publicUrl);
    toast.success("Store logo updated");
  }

  return (
    <div className="flex items-center gap-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
        {url ? (
          <Image src={url} alt="Store logo" width={64} height={64} className="h-full w-full object-cover" />
        ) : (
          <Store className="h-7 w-7 text-muted-foreground" />
        )}
      </span>
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm hover:bg-accent">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Uploading…" : url ? "Change logo" : "Upload logo"}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
      </label>
    </div>
  );
}
