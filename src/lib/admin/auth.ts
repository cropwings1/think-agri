import { cookies } from "next/headers";

export async function getAdminSession(): Promise<{ sub: string } | null> {
  const backend = process.env.BACKEND_API_URL;
  if (!backend) return null;
  try {
    const jar = await cookies();
    const token = jar.get("ta_admin_session")?.value;
    if (!token) return null;
    const response = await fetch(`${backend.replace(/\/$/, "")}/api/auth/me`, {
      headers: { cookie: `ta_admin_session=${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.success && body?.data?.email ? { sub: body.data.email } : null;
  } catch {
    return null;
  }
}
