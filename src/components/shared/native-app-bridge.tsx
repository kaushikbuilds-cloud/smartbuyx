"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Only does anything when the page is loaded inside the Capacitor native
// shell (in.smartbuyx.app) -- regular browser visitors to smartbuyx.in are
// completely unaffected. Hides the native splash once the page is ready,
// tints the status bar to match the brand, and makes the Android hardware
// back button navigate the app's own history instead of closing the app.
export function NativeAppBridge() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const { SplashScreen } = await import("@capacitor/splash-screen");
      void SplashScreen.hide();

      const { StatusBar, Style } = await import("@capacitor/status-bar");
      void StatusBar.setBackgroundColor({ color: "#9333EA" }).catch(() => {});
      void StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) router.back();
        else App.exitApp();
      });
      cleanup = () => void listener.remove();
    })();

    return () => cleanup?.();
  }, [router]);

  return null;
}
