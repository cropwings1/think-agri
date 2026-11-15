import { NextResponse } from "next/server";
export async function POST(request: Request) {
  const backend = process.env.BACKEND_API_URL;
  if (!backend) return NextResponse.json({ error: "Registration service is not configured." }, { status: 503 });
  try {
    const response = await fetch(`${backend.replace(/\/$/, "")}/api/registration`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(await request.json()), cache: "no-store",
    });
    const body = await response.json().catch(() => ({ error: "Invalid registration response." }));
    return NextResponse.json(body, { status: response.status });
  } catch { return NextResponse.json({ error: "Unable to connect to registration service. Please try again." }, { status: 502 }); }
}
