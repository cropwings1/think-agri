import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const backend = process.env.BACKEND_API_URL;
  if (!backend) return NextResponse.json({ success: false, error: { message: "BACKEND_API_URL is not configured." } }, { status: 503 });
  const { path } = await context.params;
  const incoming = new URL(request.url);
  const target = `${backend.replace(/\/$/, "")}/api/${path.join("/")}${incoming.search}`;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") || "application/json");
  try {
    const init: RequestInit = { method: request.method, headers, cache: "no-store", redirect: "manual" };
    if (!["GET", "HEAD"].includes(request.method)) init.body = await request.arrayBuffer();
    const upstream = await fetch(target, init);
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("content-type", upstreamType);
    const disposition = upstream.headers.get("content-disposition");
    if (disposition) responseHeaders.set("content-disposition", disposition);
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) responseHeaders.append("set-cookie", setCookie);
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ success: false, error: { message: "Unable to connect to backend service." } }, { status: 502 });
  }
}
export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
