import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

// Always uses the public-style marketplace chrome (top navbar + footer)
// regardless of auth state. Used for shopping-flow routes so the catalog,
// cart, and checkout feel like a real ecommerce site, not a SaaS dashboard.
export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
