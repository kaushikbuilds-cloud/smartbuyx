import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { getSellerProducts } from "@/features/catalog/queries";

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

// Multi-Platform Selling: a Google Merchant / Meta-Shops-compatible product
// feed the seller can download and import into other marketplaces.
export async function GET() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const products = await getSellerProducts(user.id);

  const header = ["id", "title", "description", "availability", "price", "brand", "image_link", "link"];
  const rows = products.map((p) => {
    const image = (p.images as unknown as { url: string }[] | null)?.[0]?.url ?? "";
    return [
      p.id,
      p.title,
      (p.description ?? "").slice(0, 5000),
      p.status === "active" ? "in stock" : "out of stock",
      `${p.base_price} INR`,
      p.brand ?? "",
      image,
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/product/${p.slug}`,
    ]
      .map((v) => csvEscape(String(v)))
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="smartbuyx-product-feed.csv"`,
    },
  });
}
