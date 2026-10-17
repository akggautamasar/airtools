import { NextRequest } from "next/server";
import { authorizeJob, callEpubApi, jsonError, parseBackendError, upstreamErrorStatus } from "@/lib/pdf-epub-server";

export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  if (!authorizeJob(request, id)) return jsonError("unauthorized_job", "This job belongs to another session or has expired.", 403);
  try {
    const upstream = await callEpubApi("/v1/jobs/" + id + "/download", { signal: AbortSignal.timeout(60000) });
    if (!upstream.ok) return jsonError("upstream", await parseBackendError(upstream), upstreamErrorStatus(upstream.status));
    if (!upstream.body) return jsonError("empty", "Conversion returned no EPUB data.", 502);
    // Stream the EPUB; never buffer or serialize it as JSON/base64 on Vercel.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": 'attachment; filename="converted.epub"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(upstream.headers.get("content-length") ? { "Content-Length": upstream.headers.get("content-length")! } : {}),
      },
    });
  } catch { return jsonError("unreachable", "EPUB download is currently unavailable.", 502); }
}
