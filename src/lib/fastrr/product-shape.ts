// Shared response shape for the Fastrr catalog pull endpoints (products,
// collection-products). Fastrr's shopify.js channel script parses this as a
// real Shopify product resource, so field names must match Shopify's actual
// schema -- not invented equivalents (e.g. `inventory_quantity`, not
// `quantity`; `option1`/`option2`/`option3` per variant, not an
// `option_values` object; a top-level `images` array, not just `image`).
export type CatalogProductRow = {
  fastrr_numeric_id: number;
  title: string;
  slug: string;
  description: string | null;
  brand: string | null;
  compare_at_price: number | null;
  gst_rate: number | null;
  images: unknown;
  status: string;
  created_at: string;
  updated_at: string;
  weight_kg: number | null;
  categories: unknown;
  product_variants: unknown;
};

type VariantRow = {
  id: string;
  fastrr_numeric_id: number;
  sku: string;
  price: number;
  options: Record<string, string>;
  created_at: string;
  inventory: { quantity: number } | null;
};

export function toShopifyProduct(p: CatalogProductRow) {
  const images = (p.images as string[]) ?? [];
  const category = p.categories as unknown as { name: string } | null;
  const variants = (p.product_variants as unknown as VariantRow[]) ?? [];

  // Shopify variants carry their option values positionally (option1/2/3)
  // against the product's own `options` list, in that list's order -- not
  // as a free-form name->value map.
  const optionNames: string[] = [];
  const optionValues = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const name of Object.keys(v.options ?? {})) {
      if (!optionValues.has(name)) {
        optionValues.set(name, new Set());
        optionNames.push(name);
      }
      optionValues.get(name)!.add(v.options[name]);
    }
  }

  return {
    id: p.fastrr_numeric_id,
    title: p.title,
    body_html: p.description ?? "",
    vendor: p.brand ?? "",
    product_type: category?.name ?? "",
    created_at: p.created_at,
    handle: p.slug,
    updated_at: p.updated_at,
    tags: [p.brand, category?.name].filter(Boolean).join(", "),
    status: p.status === "active" ? "active" : "draft",
    variants: variants.map((v) => {
      const variant: Record<string, unknown> = {
        id: v.fastrr_numeric_id,
        product_id: p.fastrr_numeric_id,
        title: Object.values(v.options ?? {}).join(" / ") || "Default",
        price: Number(v.price).toFixed(2),
        compare_at_price: p.compare_at_price ? Number(p.compare_at_price).toFixed(2) : null,
        sku: v.sku,
        inventory_quantity: v.inventory?.quantity ?? 0,
        created_at: v.created_at,
        updated_at: v.created_at, // product_variants has no updated_at column
        taxable: Number(p.gst_rate ?? 0) > 0,
        grams: Math.round(Number(p.weight_kg ?? 0.5) * 1000),
        weight: Number(p.weight_kg ?? 0.5),
        weight_unit: "kg",
        image: images[0] ? { src: images[0] } : null,
      };
      optionNames.forEach((name, i) => {
        variant[`option${i + 1}`] = v.options?.[name] ?? null;
      });
      return variant;
    }),
    image: images[0] ? { src: images[0] } : null,
    images: images.map((src) => ({ src })),
    options: optionNames.map((name) => ({ name, values: [...optionValues.get(name)!] })),
  };
}

export const CATALOG_PRODUCT_SELECT =
  "id, fastrr_numeric_id, title, slug, description, brand, compare_at_price, gst_rate, images, status, created_at, updated_at, weight_kg, categories(name), product_variants(id, fastrr_numeric_id, sku, price, options, created_at, inventory(quantity))";
