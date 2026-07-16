import Link from "next/link";

const COLUMNS = [
  { title: "Commerce", links: [["Shop", "/products"], ["Materials", "/materials"], ["Suppliers", "/suppliers"], ["Reels", "/reels"]] },
  { title: "Build", links: [["Architects", "/architects"], ["Contractors", "/contractors"], ["AI House Builder", "/house-builder"], ["Estimator", "/estimator"]] },
  { title: "Company", links: [["Pricing", "/plans"], ["About", "/about"], ["Careers", "/careers"], ["Contact", "/contact"]] },
  { title: "Legal", links: [["Privacy Policy", "/legal/privacy"], ["Terms of Service", "/legal/terms"], ["Refund Policy", "/legal/refund-policy"], ["Shipping Policy", "/legal/shipping-policy"]] },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold">SmartBuyX</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            India&apos;s AI-powered Commerce + Construction ecosystem.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SmartBuyX. All rights reserved.
      </div>
    </footer>
  );
}
