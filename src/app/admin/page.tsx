import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import AdminDashboard from "./admin-dashboard";
import "./admin.css";

export const metadata = {
  title: "Admin Dashboard | Think Agri",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <AdminDashboard adminEmail={session.sub} />;
}
