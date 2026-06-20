import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="We'll email you a link to reset it"
      footer={<Link href="/login" className="text-primary hover:underline">Back to login</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
