"""
AirTools — Remove Background API Service
==========================================

A small, self-hosted FastAPI service that removes image backgrounds using
the open-source `rembg` library (ONNX Runtime, runs on CPU — no GPU or
external API required).

This is a drop-in replacement for any provider-based background-removal
API: it accepts the exact same request shape AirTools' frontend already
sends, and returns a transparent PNG.

USAGE
-----
GET  /remove-background?imageUrl=https://example.com/photo.jpg
POST /remove-background   {"imageUrl": "https://example.com/photo.jpg"}
POST /remove-background   {"imageUrl": "data:image/png;base64,<...>"}

Response: image/png binary with the background removed (transparent).

DEPLOYMENT (Northflank, or any Docker host)
--------------------------------------------
1. Push this repo (or just the `services/remove-bg` folder) to your Git
   provider.
2. On Northflank: Create a new Service -> "Deployment from a Dockerfile" ->
   point it at `services/remove-bg/Dockerfile`.
3. Set the container port to 8000 (matches the Dockerfile's EXPOSE/CMD).
4. No environment variables or secrets are required — everything runs
   locally inside the container.
5. Once deployed, copy the public URL Northflank gives you, e.g.
   https://airtools-remove-bg--xxxx.code.run
6. Set that URL + "/remove-background" as the
   NEXT_PUBLIC_REMOVE_BG_API_URL environment variable in your AirTools
   Vercel project.

If this service is unreachable or NEXT_PUBLIC_REMOVE_BG_API_URL isn't set,
AirTools automatically falls back to removing the background on-device in
the browser, so the tool keeps working either way.
"""

import base64
import os
import re
from urllib.request import urlopen, Request as UrlRequest

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from rembg import new_session, remove

# u2netp is the lightweight model (~5MB, low memory footprint) so this
# fits comfortably on free-tier hosts (e.g. Render's 512MB limit). If your
# host has more RAM, set REMBG_MODEL=isnet-general-use for higher quality.
MODEL_NAME = os.environ.get("REMBG_MODEL", "u2netp")

session = new_session(MODEL_NAME)

app = FastAPI(title="AirTools Remove Background")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_URL_RE = re.compile(r"^data:image/[^;]+;base64,(.*)$", re.DOTALL)


def load_image_bytes(image_url: str) -> bytes:
    if image_url.startswith("http://") or image_url.startswith("https://"):
        req = UrlRequest(image_url, headers={"User-Agent": "AirTools-RemoveBG/1.0"})
        with urlopen(req, timeout=20) as resp:
            return resp.read()

    match = DATA_URL_RE.match(image_url)
    b64_data = match.group(1) if match else image_url
    return base64.b64decode(b64_data)


def run_removal(image_url: str):
    if not image_url:
        return JSONResponse({"error": "Parameter 'imageUrl' is required."}, status_code=400)

    try:
        input_bytes = load_image_bytes(image_url)
    except Exception:
        return JSONResponse({"error": "Failed to load the provided 'imageUrl'."}, status_code=400)

    try:
        output_bytes = remove(input_bytes, session=session)
    except Exception as e:
        return JSONResponse({"error": f"Background removal failed: {e}"}, status_code=502)

    return Response(
        content=output_bytes,
        media_type="image/png",
        headers={
            "X-Powered-By": "AirTools",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )


@app.get("/")
async def health():
    return {"status": "ok", "service": "airtools-remove-bg", "model": MODEL_NAME}


@app.get("/remove-background")
async def remove_background_get(imageUrl: str | None = None):
    return run_removal(imageUrl or "")


@app.post("/remove-background")
async def remove_background_post(request: Request):
    try:
        body = await request.json()
        image_url = body.get("imageUrl")
    except Exception:
        image_url = None

    return run_removal(image_url or "")
