import { z } from "zod";

export const productSchema = z.object({
  kind: z.enum(["product", "material"]).default("product"),
  title: z.string().min(3, "Title is too short").max(140),
  description: z.string().max(5000).optional().or(z.literal("")),
  brand: z.string().max(80).optional().or(z.literal("")),
  unit: z.string().max(20).optional().or(z.literal("")),
  basePrice: z.coerce.number().positive("Price must be greater than 0"),
  compareAtPrice: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  images: z.array(z.string().url()).default([]),
  status: z.enum(["active", "draft", "archived"]).default("active"),
});

export type ProductInput = z.infer<typeof productSchema>;

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional().or(z.literal("")),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
