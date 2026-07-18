import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import { NativeAppBridge } from "@/components/shared/native-app-bridge";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = "https://smartbuyx.in";
const SITE_NAME = "SmartBuyX";
const SITE_DESCRIPTION =
  "India's AI-powered commerce and construction super-app. Shop products, materials, and hire verified architects, engineers, and contractors — all in one place, with AI search, price comparison, and instant material cost estimates.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SmartBuyX — India's AI Commerce + Construction Super-App",
    template: "%s · SmartBuyX",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "SmartBuyX",
    "online shopping India",
    "construction materials online",
    "buy cement online",
    "hire architect India",
    "hire contractor online",
    "AI shopping assistant",
    "house construction cost estimator",
    "AI house builder",
    "verified suppliers India",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "SmartBuyX — India's AI Commerce + Construction Super-App",
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartBuyX — India's AI Commerce + Construction Super-App",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/icon", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <NativeAppBridge />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
