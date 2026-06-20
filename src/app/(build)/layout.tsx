import { AppShell } from "@/components/layout/app-shell";

export default function BuildLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
