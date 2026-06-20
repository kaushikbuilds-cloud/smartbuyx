import Razorpay from "razorpay";

// Server-only Razorpay instance. Never import from client components.
let instance: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return instance;
}

// Razorpay works in the smallest currency unit (paise for INR).
export const toPaise = (rupees: number) => Math.round(rupees * 100);
export const toRupees = (paise: number) => paise / 100;
