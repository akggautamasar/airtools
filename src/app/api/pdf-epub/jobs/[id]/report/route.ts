import { NextRequest, NextResponse } from "next/server";
import { authorizeJob, callEpubApi, jsonError, parseBackendError, upstreamErrorStatus } from "@/lib/pdf-epub-server";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!authorizeJob(request, id)) return jsonError("unauthorized_job", "This job belongs to another session or has expired.", 403);
  try {
    const upstream = await callEpubApi("/v1/jobs/" + id + "/report");
    if (!upstream.ok) return jsonError("upstream", await parseBackendError(upstream), upstreamErrorStatus(upstream.status));
    return NextResponse.json(await upstream.json(), { headers: { "Cache-Control": "no-store" } });
  } catch { return jsonError("unreachable", "Conversion report is currently unavailable.", 502); }
}
