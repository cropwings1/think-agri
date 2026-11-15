import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ section: string }> }) {
  const backend = process.env.BACKEND_API_URL;
  if (!backend) return NextResponse.json({ success: false, error: { message: "Backend API URL is not configured." } }, { status: 503 });
  const { section } = await context.params;
  const language = request.nextUrl.searchParams.get("language") || "en";
  try {
    const response = await fetch(
      `${backend.replace(/\/$/, "")}/api/public/content/${encodeURIComponent(section)}?language=${encodeURIComponent(language)}`,
      { cache: "no-store" }
    );
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ success: false, error: { message: "Unable to connect to content service." } }, { status: 502 });
  }
}
