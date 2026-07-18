import { ShieldOff } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Account Suspended" };

export default function SuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldOff className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Your account has been suspended</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This account is currently restricted from accessing SmartBuyX. If you believe this is a
              mistake, contact support at support@smartbuyx.in.
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline">Log out</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
