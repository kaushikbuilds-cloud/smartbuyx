"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { createWarehouse, isDelhiveryConfigured } from "@/lib/delhivery/client";

export type PickupState = { error?: string; success?: string } | null;

const pickupSchema = z.object({
  name: z.string().min(2, "Contact name is required").max(120),
  phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number"),
  email: z.string().email("Enter a valid email"),
  addressLine1: z.string().min(4, "Address is required").max(200),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

// Registers (or re-registers, if the address changed) this seller's pickup
// address as a distinct named warehouse on our single Delhivery client
// account -- Delhivery has no concept of per-seller sub-accounts, so every
// seller's address lives as a distinct named warehouse on our one account
// instead (same reasoning as the earlier Shiprocket integration this
// replaced).
export async function savePickupAddress(_prev: PickupState, formData: FormData): Promise<PickupState> {
  const { user } = await requireUser();
  if (!isDelhiveryConfigured()) return { error: "Shipping is not configured yet." };

  const parsed = pickupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const pickupLocationCode = `sbx-${user.id.replace(/-/g, "").slice(0, 12)}`;
  const result = await createWarehouse({
    name: pickupLocationCode,
    registeredName: d.name,
    address: [d.addressLine1, d.addressLine2].filter(Boolean).join(", "),
    city: d.city,
    state: d.state,
    pincode: d.pincode,
    phone: d.phone,
    email: d.email,
  });
  if (!result.ok) return { error: `Could not register with our courier partner: ${result.error}` };

  const supabase = await createClient();
  const { error } = await supabase
    .from("supplier_profiles")
    .update({
      pickup_name: d.name,
      pickup_phone: d.phone,
      pickup_email: d.email,
      pickup_address_line1: d.addressLine1,
      pickup_address_line2: d.addressLine2 || null,
      pickup_city: d.city,
      pickup_state: d.state,
      pickup_pincode: d.pincode,
      pickup_location_code: pickupLocationCode,
      pickup_registered: true,
    })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/supplier/verification");
  return { success: "Pickup address saved — courier bookings will now use this address." };
}

export type PickupAddress = {
  pickup_name: string | null;
  pickup_phone: string | null;
  pickup_email: string | null;
  pickup_address_line1: string | null;
  pickup_address_line2: string | null;
  pickup_city: string | null;
  pickup_state: string | null;
  pickup_pincode: string | null;
  pickup_registered: boolean;
} | null;

export async function getMyPickupAddress(userId: string): Promise<PickupAddress> {
  const { user } = await requireUser();
  if (user.id !== userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_profiles")
    .select("pickup_name, pickup_phone, pickup_email, pickup_address_line1, pickup_address_line2, pickup_city, pickup_state, pickup_pincode, pickup_registered")
    .eq("user_id", userId)
    .maybeSingle();
  return data as PickupAddress;
}
