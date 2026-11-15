import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const backend = process.env.BACKEND_API_URL;
  if (!backend)
    return NextResponse.json(
      { error: "Backend API URL is not configured." },
      { status: 503 }
    );
  try {
    const response = await fetch(
      `${backend.replace(/\/$/, "")}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await request.json()),
        cache: "no-store",
      }
    );
    const body = await response
      .json()
      .catch(() => ({ error: "Invalid backend response." }));
    const result = NextResponse.json(body, { status: response.status });
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
