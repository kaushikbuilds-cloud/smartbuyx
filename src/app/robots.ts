import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/checkout", "/cart", "/orders/"],
      },
    ],
    sitemap: "https://smartbuyx.in/sitemap.xml",
  };
}
