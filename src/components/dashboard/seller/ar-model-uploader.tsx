"use client";

import { useState } from "react";
import { Boxes, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  initialGlbUrl?: string | null;
  initialUsdzUrl?: string | null;
};

// Sellers upload the two files AR needs: .glb drives Android (Google Scene
// Viewer / ARCore) + the in-page 3D preview; .usdz drives iOS (AR Quick
// Look / ARKit). Either can be added alone -- AR just won't trigger on the
// platform missing its file.
export function ArModelUploader({ userId, initialGlbUrl, initialUsdzUrl }: Props) {
  const [glbUrl, setGlbUrl] = useState(initialGlbUrl ?? "");
  const [usdzUrl, setUsdzUrl] = useState(initialUsdzUrl ?? "");
  const [uploading, setUploading] = useState<"glb" | "usdz" | null>(null);
  const supabase = createClient();

  async function upload(kind: "glb" | "usdz", file: File) {
    setUploading(kind);
    const path = `${userId}/${crypto.randomUUID()}.${kind}`;
    const { error } = await supabase.storage.from("product-models").upload(path, file, { upsert: false });
    setUploading(null);
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from("product-models").getPublicUrl(path);
    if (kind === "glb") setGlbUrl(data.publicUrl);
    else setUsdzUrl(data.publicUrl);
    toast.success(`${kind.toUpperCase()} model uploaded`);
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Boxes className="h-4 w-4 text-purple-600" /> AR "View in My Room" (optional)
      </div>
      <p className="text-xs text-muted-foreground">
        Upload a 3D model so customers can preview this item in their own space via their phone camera.
      </p>

      <input type="hidden" name="modelGlbUrl" value={glbUrl} />
      <input type="hidden" name="modelUsdzUrl" value={usdzUrl} />

      <div className="grid gap-3 sm:grid-cols-2">
        <FileSlot
          label="Android model (.glb)"
          hint="Required for AR on Android + the 3D preview"
          accept=".glb"
          url={glbUrl}
          uploading={uploading === "glb"}
          onFile={(f) => upload("glb", f)}
          onClear={() => setGlbUrl("")}
        />
        <FileSlot
          label="iOS model (.usdz)"
          hint="Required for AR on iPhone/iPad — optional"
          accept=".usdz"
          url={usdzUrl}
          uploading={uploading === "usdz"}
          onFile={(f) => upload("usdz", f)}
          onClear={() => setUsdzUrl("")}
        />
      </div>
    </div>
  );
}

function FileSlot({
  label, hint, accept, url, uploading, onFile, onClear,
}: {
  label: string; hint: string; accept: string; url: string; uploading: boolean;
  onFile: (f: File) => void; onClear: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">{label}</p>
      {url ? (
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
          <span className="truncate">Uploaded ✓</span>
          <button type="button" onClick={onClear} className="text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs hover:bg-accent">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : "Choose file"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onFile(file);
            }}
          />
        </label>
      )}
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
