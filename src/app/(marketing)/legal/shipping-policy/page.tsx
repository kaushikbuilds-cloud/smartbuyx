export const metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <>
      <h1>Shipping Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

      <h2>1. Who ships your order</h2>
      <p>
        SmartBuyX is a marketplace — each item is shipped by its listing seller. An order with
        items from multiple sellers may arrive as separate shipments, each independently trackable
        from Dashboard → Orders.
      </p>

      <h2>2. Shipment stages</h2>
      <p>
        Every shipment moves through: <em>Processing → Ready to ship → Picked up → In transit →
        Out for delivery → Delivered</em>. You&apos;ll see live status and, where enabled, WhatsApp
        or push notifications at key stages.
      </p>

      <h2>3. Delivery timelines</h2>
      <p>
        Timelines vary by seller, item, and destination pincode, and are shown at checkout before
        you pay. Bulk construction materials (cement, tiles, etc.) may have longer lead times than
        standard commerce items due to freight logistics.
      </p>

      <h2>4. Shipping charges</h2>
      <p>
        Shipping charges, if any, are shown at checkout before payment. Some sellers offer free
        shipping above a minimum order value.
      </p>

      <h2>5. Delivery attempts and address accuracy</h2>
      <p>
        Please ensure your delivery address and pincode are accurate — this also determines which
        local suppliers and delivery windows are shown to you. Failed delivery attempts due to an
        incorrect address or unavailability may result in the order being returned to the seller
        and a restocking process initiated.
      </p>

      <h2>6. Delays</h2>
      <p>
        If a shipment is delayed beyond its estimated window, you can view live status in Dashboard
        → Orders or contact support for an update.
      </p>

      <h2>7. Contact</h2>
      <p>Shipping questions: support@smartbuyx.in</p>
    </>
  );
}
