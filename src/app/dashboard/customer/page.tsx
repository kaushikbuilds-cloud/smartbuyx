import { redirect } from "next/navigation";

// Dashboard home moved to `/`. This route just redirects.
export default function CustomerDashboardRedirect() {
  redirect("/");
}
