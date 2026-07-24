import { z } from "zod";

export const refurbishedSchema = z.object({
  title: z.string().min(3, "Title is too short").max(140),
  brand: z.string().max(80).optional().or(z.literal("")),
  description: z.string().max(5000).optional().or(z.literal("")),
  basePrice: z.coerce.number().positive("Price must be greater than 0"),
  compareAtPrice: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative().default(0),
  images: z.array(z.string().url()).min(1, "Add at least one photo"),
  conditionGrade: z.enum(["excellent", "very_good", "good"], { message: "Select a condition grade" }),
  batteryHealth: z.coerce.number().int().min(0).max(100).optional(),
  warrantyMonths: z.coerce.number().int().nonnegative().default(0),
  accessoriesIncluded: z.string().max(300).optional().or(z.literal("")),
  serialOrImei: z.string().min(3, "Serial number or IMEI is required").max(60),
});

export type RefurbishedInput = z.infer<typeof refurbishedSchema>;
