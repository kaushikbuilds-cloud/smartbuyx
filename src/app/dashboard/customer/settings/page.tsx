import { redirect } from "next/navigation";

export default function SettingsIndex() {
  redirect("/dashboard/customer/settings/account");
}
