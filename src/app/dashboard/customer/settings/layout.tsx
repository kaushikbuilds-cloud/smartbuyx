import { SettingsNav } from "@/components/dashboard/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto grid gap-6 p-6 lg:grid-cols-[240px,1fr]">
      <SettingsNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
