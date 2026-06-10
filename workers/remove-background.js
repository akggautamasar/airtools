/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           AirTools — Remove Background API Worker                ║
 * ║                                                                  ║
 * ║  Project   : AirTools (airtools.vercel.app)                     ║
 * ║  Version   : 1.0.0                                               ║
 * ║  Platform  : Cloudflare Workers                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * This worker proxies image background-removal requests to the
 * Hugging Face Inference API running the "briaai/RMBG-1.4" model
 * (a fast, high-quality background removal model). It returns the
 * full-resolution cutout PNG with no watermark and no "HD download"
 * paywall, unlike remove.bg's free tier.
 *
 * ─────────────────────────────────────────────────────────────────
 *  STEP 1 — Get a free Hugging Face API token
 * ─────────────────────────────────────────────────────────────────
 *  1. Create a free account at https://huggingface.co/join
 *  2. Go to https://huggingface.co/settings/tokens
 *  3. Click "New token" → type "Read" → create it, and copy it.
 *  4. (Recommended) Visit https://huggingface.co/briaai/RMBG-1.4 and
 *     click "Agree and access repository" once while logged in —
 *     some accounts need to accept the model's terms first.
 *
 * ─────────────────────────────────────────────────────────────────
 *  STEP 2 — Deploy this Worker
 * ─────────────────────────────────────────────────────────────────
 *
 *  OPTION A — Cloudflare Dashboard (easiest, no CLI needed)
 *  ─────────────────────────────────────────────────────────
 *  1. Go to https://workers.cloudflare.com and sign in (free account).
 *  2. Click "Create Application" → "Create Worker".
 *  3. Name it (e.g. "airtools-remove-bg") and click "Deploy".
 *  4. Click "Edit code", delete the default code, and paste THIS file.
 *  5. Click "Deploy".
 *  6. Go to Settings → Variables → Add a SECRET (not plain text):
 *       Name:  HF_TOKEN
 *       Value: <your Hugging Face token from Step 1>
 *  7. Save and re-deploy if prompted.
 *
 *     Your endpoint will be:
 *     https://<worker-name>.<your-subdomain>.workers.dev
 *
 * ─────────────────────────────────────────────────────────────────
 *
 *  OPTION B — Wrangler CLI
 *  ────────────────────────
 *  1. npm install -g wrangler
 *  2. wrangler login
 *  3. wrangler secret put HF_TOKEN --name airtools-remove-bg
 *     (paste your token when prompted)
 *  4. wrangler deploy remove-background.js --name airtools-remove-bg --compatibility-date 2024-01-01
 *
 * ─────────────────────────────────────────────────────────────────
 *
 *  USAGE
 *  ──────
 *  GET  ?imageUrl=https://example.com/photo.jpg
 *  POST {"imageUrl": "https://example.com/photo.jpg"}
 *  POST {"imageUrl": "data:image/png;base64,<base64string>"}
 *
 *  Response: raw PNG binary with the background removed (transparent)
 *
 *  After deploying, set the resulting Worker URL as the
 *  NEXT_PUBLIC_REMOVE_BG_API_URL environment variable in your
 *  AirTools Vercel project. If it isn't set (or a request fails),
 *  AirTools automatically falls back to removing the background
 *  on-device in the browser, so the tool keeps working either way.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── CORS & Custom Headers ────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma',
  'Access-Control-Expose-Headers': 'X-Powered-By, X-API-Version, X-Response-Time',
  'Access-Control-Max-Age': '86400',
  'X-Powered-By': 'AirTools',
  'X-API-Version': '1.0',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Access-Control-Allow-Credentials': 'false',
};

const HF_MODEL_URL = 'https://api-inference.huggingface.co/models/briaai/RMBG-1.4';
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 4000;

class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isApiError = true;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function inputToBuffer(imageUrl) {
  if (typeof imageUrl !== 'string') {
    throw new ApiError('Invalid input: must be a URL string or base64 string.', 400);
  }

  if (imageUrl.startsWith('http')) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new ApiError(`Failed to download image. Status: ${response.status}`, 400);
    }
    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) {
      throw new ApiError(`URL does not point to an image file. Found: ${contentType}`, 400);
    }
    return { buffer: await response.arrayBuffer(), contentType };
  }

  try {
    const match = imageUrl.match(/^data:(image\/.+?);base64,/);
    const base64Data = match ? imageUrl.substring(match[0].length) : imageUrl;
    const contentType = match ? match[1] : 'image/png';

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { buffer: bytes.buffer, contentType };
  } catch {
    throw new ApiError('Invalid base64 string.', 400);
  }
}

async function removeBackground(imageUrl, hfToken) {
  if (!hfToken) {
    throw new ApiError('Worker is missing the HF_TOKEN secret. See deployment instructions in this file.', 500);
  }

  const { buffer, contentType } = await inputToBuffer(imageUrl);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(HF_MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': contentType,
        Accept: 'image/png',
      },
      body: buffer,
    });

    if (response.ok) {
      const resultBuffer = await response.arrayBuffer();
      if (!resultBuffer || resultBuffer.byteLength === 0) {
        throw new ApiError('Model returned an empty response.', 502);
      }
      return resultBuffer;
    }

    // Model is cold-starting — wait and retry.
    if (response.status === 503 && attempt < MAX_RETRIES) {
      let waitMs = RETRY_DELAY_MS;
      try {
        const info = await response.json();
        if (info?.estimated_time) waitMs = Math.min(20000, Math.ceil(info.estimated_time * 1000));
      } catch {
        // ignore, use default delay
      }
      await sleep(waitMs);
      continue;
    }

    const message = await response.text().catch(() => '');
    throw new ApiError(
      `Background removal model returned an error (${response.status}): ${message.slice(0, 200)}`,
      response.status === 429 ? 429 : 502
    );
  }

  throw new ApiError('Background removal model is still warming up. Please try again shortly.', 503);
}

export default {
  async fetch(request, env) {
    const startTime = Date.now();

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!['GET', 'POST'].includes(request.method)) {
      return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    let imageUrl = null;

    try {
      if (request.method === 'POST') {
        const ct = request.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const body = await request.json();
          imageUrl = body.imageUrl ?? null;
        } else if (ct.includes('application/x-www-form-urlencoded')) {
          const params = new URLSearchParams(await request.text());
          imageUrl = params.get('imageUrl');
        } else {
          try {
            const body = await request.json();
            imageUrl = body.imageUrl ?? null;
          } catch {
            imageUrl = null;
          }
        }
      } else {
        imageUrl = new URL(request.url).searchParams.get('imageUrl');
      }

      if (!imageUrl) {
        return new Response(JSON.stringify({ error: "Parameter 'imageUrl' is required." }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const resultBuffer = await removeBackground(imageUrl, env.HF_TOKEN);
      const elapsed = Date.now() - startTime;

      return new Response(resultBuffer, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'image/png',
          'X-Response-Time': `${elapsed}ms`,
        },
      });

    } catch (err) {
      console.error('Worker Error:', err instanceof Error ? err.message : err);
      const elapsed = Date.now() - startTime;

      if (err instanceof ApiError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'X-Response-Time': `${elapsed}ms`,
          },
        });
      }

      return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'X-Response-Time': `${elapsed}ms`,
        },
      });
    }
  },
};
