import type { CapacitorConfig } from "@capacitor/cli";

// SmartBuyX is a server-rendered app (auth cookies, server actions, live DB
// reads) -- not a static site -- so the native shell loads the real deployed
// site directly (server.url) instead of bundling a static export. webDir is
// still required by the Capacitor CLI even though its contents are unused.
const config: CapacitorConfig = {
  appId: "in.smartbuyx.app",
  appName: "SmartBuyX",
  webDir: "capacitor-www",
  server: {
    // smartbuyx.in (apex) issues an HTTP 308 redirect to www.smartbuyx.in at
    // the Vercel domain level. Capacitor compares the request host against
    // this url's host BEFORE following any redirect, so pointing at the apex
    // domain meant the very first page load ever attempted -- host mismatch
    // -> immediately kicked out to the system browser on every launch.
    url: "https://www.smartbuyx.in",
    androidScheme: "https",
    cleartext: false,
    // Without this, any navigation to a domain other than www.smartbuyx.in
    // gets kicked out to the system browser instead of staying in the app's
    // WebView -- this is what broke login (redirects through Supabase Auth's
    // own domain) and would have broken checkout (Razorpay) the same way.
    allowNavigation: [
      "smartbuyx.in",
      "*.supabase.co",
      "checkout.razorpay.com",
      "api.razorpay.com",
      "*.razorpay.com",
    ],
  },
  backgroundColor: "#ffffff",
  android: {
    backgroundColor: "#ffffff",
  },
  ios: {
    backgroundColor: "#ffffff",
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#9333ea",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
