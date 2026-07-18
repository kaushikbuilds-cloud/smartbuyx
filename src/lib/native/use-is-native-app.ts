"use client";

import { useEffect, useState } from "react";

// True only when running inside the Capacitor native shell (the installed
// Android/iOS app), false in any regular browser. Used to hide flows that
// can't work in a webview -- notably Google OAuth, which Google blocks in
// embedded webviews (disallowed_useragent) and force-opens in the system
// browser. Resolves after mount, so callers get `false` on first paint.
export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!cancelled) setIsNative(Capacitor.isNativePlatform());
      } catch {
        // @capacitor/core not resolvable in this context -> treat as web.
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return isNative;
}
