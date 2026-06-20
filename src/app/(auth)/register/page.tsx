import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Join SmartBuyX — shop, build, and create"
      footer={<>Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link></>}
    >
      <RegisterForm />
    </AuthCard>
  );
}
