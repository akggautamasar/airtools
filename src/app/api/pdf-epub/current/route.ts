import { NextRequest, NextResponse } from "next/server";
import { PDF_EPUB_ID_REGEX } from "@/lib/pdf-epub-contract";
import { authorizeJob, callEpubApi, jsonError } from "@/lib/pdf-epub-server";

export const runtime = "nodejs";

/** The signed HttpOnly cookie is the sole source of job identity. Never accept
 * arbitrary IDs from the URL or browser storage for this recovery route. */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("airtools_epub_job")?.value;
  const id = token?.split(".")[0];
  if (!id || !PDF_EPUB_ID_REGEX.test(id) || !authorizeJob(request, id)) {
    return jsonError("no_job", "No active or recoverable conversion in this browser session.", 404);
  }
  try {
    const upstream = await callEpubApi("/v1/jobs/" + id);
    if (!upstream.ok) return jsonError("unavailable", "Saved conversion could not be retrieved.", upstream.status === 404 ? 404 : 502);
    return NextResponse.json(await upstream.json(), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return jsonError("unavailable", "Conversion status is temporarily unavailable.", 502);
  }
}
