export const metadata = { title: "Refund & Returns Policy" };

export default function RefundPolicyPage() {
  return (
    <>
      <h1>Refund &amp; Returns Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

      <h2>1. Return window</h2>
      <p>
        Most items can be returned within <strong>7 days</strong> of delivery. The item must be
        eligible for the reason selected (damaged, wrong item, not as described, size/fit,
        no longer needed, found a better price, or other).
      </p>

      <h2>2. Returnless refunds</h2>
      <p>
        For low-value items (₹300 or less), from buyers with a good return history, and where the
        reason isn&apos;t &quot;found a better price&quot;, we may approve an instant refund to your
        SmartBuyX Wallet without requiring you to send the item back. This keeps costs down for
        everyone and gets your money back the fastest way possible.
      </p>

      <h2>3. Instant exchange</h2>
      <p>
        Instead of a refund, eligible buyers can request an instant exchange — a replacement ships
        automatically with no pickup required, under the same trust criteria as a returnless refund.
      </p>

      <h2>4. Standard returns</h2>
      <p>
        Returns that don&apos;t qualify for the above go through pickup and inspection. Once the
        returned item is received and verified, the refund is issued to your original payment
        method or SmartBuyX Wallet, typically within 5–7 business days.
      </p>

      <h2>5. Proof and disputes</h2>
      <p>
        You can attach a photo or short video when filing a damaged/wrong-item return — this speeds
        up approval. If a seller believes a return is fraudulent or abusive, they can flag it for
        our team to review; disputed returns are held pending manual review rather than auto-resolved.
      </p>

      <h2>6. Non-returnable items</h2>
      <p>
        Custom/made-to-order items, perishables, and items explicitly marked non-returnable on the
        product page cannot be returned unless defective on arrival.
      </p>

      <h2>7. Cancellations</h2>
      <p>
        Orders can be cancelled before they ship. Once shipped, cancel via a return request instead.
      </p>

      <h2>8. Build-pillar services and materials</h2>
      <p>
        Bulk construction materials follow the same return window where physically returnable;
        custom-fabricated items and professional consultation fees are non-refundable once the
        service has been delivered, except where the professional failed to deliver as agreed.
      </p>

      <h2>9. Contact</h2>
      <p>Return questions: support@smartbuyx.in, or via Dashboard → My Returns.</p>
    </>
  );
}
