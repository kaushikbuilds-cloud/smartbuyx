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
    url: "https://smartbuyx.in",
    androidScheme: "https",
    cleartext: false,
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
