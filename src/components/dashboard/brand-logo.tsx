"use client";

import { useState } from "react";

// Renders a brand logo from the Simple Icons CDN; falls back to an initials
// circle if the brand has no icon (e.g. boAt). Plain <img> avoids next/image
// remote-host config for these tiny SVGs.
export function BrandLogo({ name, slug }: { name: string; slug?: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = slug && !failed;

  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-full border bg-card shadow-sm transition-shadow group-hover:shadow-md">
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://cdn.simpleicons.org/${slug}`}
          alt={name}
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xl font-bold text-foreground/80">{name[0]}</span>
      )}
    </span>
  );
}
