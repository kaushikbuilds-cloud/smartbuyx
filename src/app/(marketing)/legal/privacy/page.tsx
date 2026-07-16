export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

      <p>
        SmartBuyX (&quot;we&quot;, &quot;us&quot;) operates an e-commerce and construction-services
        marketplace at smartbuyx.in. This policy explains what data we collect, why, and how you
        can control it.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>Account details: name, email, phone number, date of birth (optional).</li>
        <li>Delivery addresses and, for Build-pillar services, project/RFQ details you submit.</li>
        <li>Order, payment, and return history. We do not store your card details — payments are processed by Razorpay, a PCI-DSS compliant processor, and we only receive a payment reference and status.</li>
        <li>Communications with our AI shopping assistant and support tools.</li>
        <li>Usage data (pages viewed, searches) to power recommendations and fraud detection.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To fulfil orders, process returns/refunds, and run the platform (wallet, notifications, RFQs, consultations).</li>
        <li>To power AI features you opt into: product recommendations, shopping assistant, listing generation for sellers.</li>
        <li>To detect fraud and abuse — we compute a buyer risk score from behavioural signals (return rate, cancellations) to decide return eligibility. This never affects your credit or is shared outside SmartBuyX.</li>
        <li>To send order and account notifications via email, SMS, push, or WhatsApp — only channels you enable in Settings → Notifications.</li>
      </ul>

      <h2>3. Data access and security</h2>
      <p>
        Your data is stored with Supabase (PostgreSQL) with row-level security enforced on every
        table — other users, and even most of our own systems, cannot query your data directly.
        Only authorised service roles (order fulfilment, fraud review, support) can access what&apos;s
        needed for their function.
      </p>

      <h2>4. Sharing with sellers and service providers</h2>
      <p>
        When you place an order or request a consultation, the relevant seller, supplier, or
        professional (architect/engineer/contractor) receives what&apos;s needed to fulfil it: your
        name, delivery address, and order details. We do not sell your data to third parties.
      </p>

      <h2>5. Your rights</h2>
      <ul>
        <li>View and edit your profile, addresses, and preferences any time in Settings.</li>
        <li>Control notification channels and AI recommendation preferences.</li>
        <li>Request account deletion by contacting support — we retain order records as required by Indian tax law (typically 8 years) even after account deletion.</li>
      </ul>

      <h2>6. Contact</h2>
      <p>Questions about this policy: privacy@smartbuyx.in</p>
    </>
  );
}
