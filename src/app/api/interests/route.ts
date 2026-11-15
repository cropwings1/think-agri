import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const backend = process.env.BACKEND_API_URL;
  if (!backend)
    return NextResponse.json(
      {
        success: false,
        error: { message: "Backend API URL is not configured." },
      },
      { status: 503 }
    );
  try {
    const response = await fetch(
      `${backend.replace(/\/$/, "")}/api/public/interests`,
      { cache: "no-store" }
    );
    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Unable to connect to backend." } },
      { status: 502 }
    );
  }
}
