import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "SmartBuyX", template: "%s · SmartBuyX" },
  description: "AI-powered marketplace for products, materials, and building professionals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
