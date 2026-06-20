import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to your SmartBuyX account"
      footer={<>Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline">Sign up</Link></>}
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
