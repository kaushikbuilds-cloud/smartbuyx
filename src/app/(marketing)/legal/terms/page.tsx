export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

      <p>
        By creating a SmartBuyX account or using smartbuyx.in, you agree to these terms. SmartBuyX
        is a marketplace connecting buyers with independent sellers, suppliers, and construction
        professionals — we are not the seller of record for third-party listings unless stated
        otherwise.
      </p>

      <h2>1. Accounts</h2>
      <ul>
        <li>You must provide accurate information and are responsible for activity under your account.</li>
        <li>Roles (customer, supplier, architect, engineer, contractor, interior designer, creator, D2C brand) come with role-specific obligations covered in their onboarding flows.</li>
      </ul>

      <h2>2. Orders and payments</h2>
      <ul>
        <li>Prices shown are GST-inclusive unless stated otherwise. Payments are processed via Razorpay.</li>
        <li>An order is confirmed once payment is captured and verified. Sellers are responsible for fulfilling orders within the stated timelines.</li>
        <li>SmartBuyX Wallet (Smart Coins) balances are non-transferable and can be used toward future purchases; they hold no cash-withdrawal value except where a refund is credited to wallet.</li>
      </ul>

      <h2>3. Returns, refunds, and exchanges</h2>
      <p>See our <a href="/legal/refund-policy" className="text-primary underline">Refund Policy</a> for the full return window, eligibility, and returnless-refund/instant-exchange rules.</p>

      <h2>4. Build-pillar services</h2>
      <ul>
        <li>RFQs, quotes, and consultations connect you directly with independent professionals and suppliers. SmartBuyX facilitates discovery and communication but is not a party to the resulting service contract unless an escrow or subscription plan states otherwise.</li>
        <li>Professionals listed (architects, engineers, contractors, interior designers) are independently verified for KYC/GSTIN where displayed, but SmartBuyX does not guarantee the quality of professional services rendered off-platform.</li>
      </ul>

      <h2>5. Seller obligations</h2>
      <ul>
        <li>Sellers must list accurate product information, honour prices and stock shown, and ship within committed windows.</li>
        <li>Fraudulent listings, counterfeit goods, or abuse of the returns system (on either side) may result in account suspension and, for buyers, exclusion from returnless-refund/instant-exchange eligibility based on our risk scoring.</li>
      </ul>

      <h2>6. Prohibited use</h2>
      <p>
        You may not use SmartBuyX to list illegal goods, circumvent payment processing, scrape data,
        or interfere with platform security. We reserve the right to suspend accounts that violate
        these terms.
      </p>

      <h2>7. Liability</h2>
      <p>
        SmartBuyX provides the marketplace &quot;as is&quot;. To the extent permitted by law, our liability
        for any claim is limited to the amount paid for the order or service giving rise to the claim.
      </p>

      <h2>8. Changes to these terms</h2>
      <p>We may update these terms; continued use after an update constitutes acceptance.</p>

      <h2>9. Contact</h2>
      <p>legal@smartbuyx.in</p>
    </>
  );
}
