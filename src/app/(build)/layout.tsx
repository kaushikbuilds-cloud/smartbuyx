import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
