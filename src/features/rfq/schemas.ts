import { z } from "zod";

export const rfqSchema = z.object({
  title: z.string().min(3, "Title is too short").max(140),
  description: z.string().max(5000).optional().or(z.literal("")),
  categories: z.string().optional(),                 // comma-separated category slugs
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode").optional().or(z.literal("")),
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
});

export type RfqInput = z.infer<typeof rfqSchema>;

export const quoteSchema = z.object({
  rfqId: z.string().uuid(),
  amount: z.coerce.number().positive("Quote amount required"),
  message: z.string().max(2000).optional().or(z.literal("")),
});
