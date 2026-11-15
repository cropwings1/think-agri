import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  const backend = process.env.BACKEND_API_URL;
  if (!backend)
    return NextResponse.json(
      { error: "Backend API URL is not configured." },
      { status: 503 }
    );
  try {
    const response = await fetch(
      `${backend.replace(/\/$/, "")}/api/auth/logout`,
      {
        method: "POST",
        headers: { cookie: request.headers.get("cookie") || "" },
        cache: "no-store",
      }
    );
    const result = NextResponse.json(
      await response.json().catch(() => ({ success: response.ok })),
      { status: response.status }
    );
    const cookie = response.headers.get("set-cookie");
    if (cookie) result.headers.append("set-cookie", cookie);
    return result;
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to authentication service." },
      { status: 502 }
    );
  }
}
