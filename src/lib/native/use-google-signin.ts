"use client";

import { useState } from "react";
import { getGoogleOAuthUrl, signInWithGoogle } from "@/features/auth/actions";
import { useIsNativeApp } from "./use-is-native-app";

// Returns a Google sign-in handler that does the right thing per platform:
//  - Web: the normal server-action redirect flow.
//  - Native app: open the OAuth URL in a system browser tab, wait for the
//    deep-link return (in.smartbuyx.app://callback?code=...), then load the
//    webview's own /callback route with that code so the server establishes
//    the cookie session -- the user lands back in the app, logged in.
export function useGoogleSignIn(): { signIn: () => void; pending: boolean } {
  const isNativeApp = useIsNativeApp();
  const [pending, setPending] = useState(false);

  async function nativeSignIn() {
    setPending(true);
    try {
      const { App } = await import("@capacitor/app");
      const { Browser } = await import("@capacitor/browser");

      const { url, error } = await getGoogleOAuthUrl();
      if (!url || error) {
        setPending(false);
        return;
      }

      // Register the deep-link listener before opening the browser.
      const listener = await App.addListener("appUrlOpen", async ({ url: returnUrl }) => {
        if (!returnUrl.startsWith("in.smartbuyx.app://")) return;
        await listener.remove();
        await Browser.close().catch(() => {});
        const code = new URL(returnUrl).searchParams.get("code");
        if (code) {
          window.location.href = `/callback?code=${encodeURIComponent(code)}`;
        } else {
          setPending(false);
        }
      });

      await Browser.open({ url });
    } catch {
      setPending(false);
    }
  }

  function signIn() {
    if (isNativeApp) {
      void nativeSignIn();
    } else {
      void signInWithGoogle();
    }
  }

  return { signIn, pending };
}
