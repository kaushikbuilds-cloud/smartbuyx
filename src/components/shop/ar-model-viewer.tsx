"use client";

import { useEffect, useState } from "react";
import { Boxes } from "lucide-react";

// Registers the <model-viewer> custom element as a side effect of import.
// Loaded client-side only (dynamic-free here since this file is already
// "use client") -- the element itself handles Android (Scene Viewer /
// ARCore) vs iOS (AR Quick Look / ARKit) automatically based on which of
// src/ios-src is present and the visiting device.
export function ArModelViewer({
  glbUrl,
  usdzUrl,
  title,
  posterUrl,
}: {
  glbUrl: string;
  usdzUrl?: string | null;
  title: string;
  posterUrl?: string | null;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-xl border bg-muted">
        <Boxes className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  return (
    <model-viewer
      src={glbUrl}
      ios-src={usdzUrl ?? undefined}
      alt={`3D view of ${title}`}
      poster={posterUrl ?? undefined}
      ar
      ar-modes="scene-viewer quick-look webxr"
      camera-controls
      auto-rotate
      shadow-intensity="1"
      loading="lazy"
      reveal="auto"
      style={{ width: "100%", height: "18rem", borderRadius: "0.75rem", background: "hsl(var(--muted))" }}
    />
  );
}
