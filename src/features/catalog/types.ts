export type ListingKind = "product" | "material";

export type ProductImage = { url: string; alt?: string };

export type Product = {
  id: string;
  supplier_id: string;
  category_id: string | null;
  kind: ListingKind;
  title: string;
  slug: string;
  description: string | null;
  brand: string | null;
  unit: string | null;
  base_price: number;
  compare_at_price: number | null;
  currency: string;
  images: ProductImage[];
  attributes: Record<string, unknown>;
  status: string;
  rating_avg: number;
  rating_count: number;
  sales_count: number;
  is_featured: boolean;
  created_at: string;
  model_glb_url?: string | null;
  model_usdz_url?: string | null;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  options: Record<string, string>;
  price: number;
  stock?: number;
};

export type Review = {
  id: string;
  author_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
};
