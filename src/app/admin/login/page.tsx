import LoginForm from "./login-form";
import { getAdminSession } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import "../admin.css";
export const metadata = {
  title: "Admin Login | Think Agri",
  robots: { index: false, follow: false },
};
export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return <LoginForm />;
}
