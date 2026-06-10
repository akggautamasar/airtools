# AirTools — Remove Background Service

A self-hosted background-removal API. Runs entirely on its own — no API
keys, no rate limits, no third-party dependency. Powered by
[`rembg`](https://github.com/danielgatis/rembg) (`isnet-general-use` model)
running on CPU via ONNX Runtime.

## API

| Method | Path                 | Body / Query                          | Response                |
| ------ | -------------------- | -------------------------------------- | ------------------------ |
| GET    | `/remove-background` | `?imageUrl=https://example.com/a.jpg`  | `image/png` (transparent) |
| POST   | `/remove-background` | `{"imageUrl": "https://... or data:image/...;base64,..."}` | `image/png` (transparent) |

## Deploy on Northflank

1. Push this repository to GitHub/GitLab (Northflank deploys from git).
2. In Northflank, create a new **Service** → **Combined service** (or
   "Deployment") → **Build from a Dockerfile**.
3. Set the **context/build path** to `services/remove-bg` (this folder
   contains the `Dockerfile`).
4. Set the **port** to `8000`.
5. No environment variables or secrets are needed.
6. Deploy. The first build takes a few minutes (it downloads and bakes in
   the ~170MB model). Subsequent deploys reuse the cached layer.
7. Once live, Northflank gives you a public URL, e.g.
   `https://airtools-remove-bg--xxxx.code.run`.
8. In your AirTools Vercel project, set:
   ```
   NEXT_PUBLIC_REMOVE_BG_API_URL=https://airtools-remove-bg--xxxx.code.run/remove-background
   ```

## Deploy anywhere else (Render, Railway, Fly.io, your own VPS)

This is a plain Docker container exposing port `8000` — any platform that
runs Dockerfiles works the same way:

```bash
docker build -t airtools-remove-bg .
docker run -p 8000:8000 airtools-remove-bg
```

## Local testing

```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

curl -X POST http://localhost:8000/remove-background \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/photo.jpg"}' \
  --output result.png
```

## Notes

- CPU inference takes roughly 1-3 seconds per image depending on size and
  the host's CPU.
- If `NEXT_PUBLIC_REMOVE_BG_API_URL` is unset, or this service is
  unreachable, AirTools automatically falls back to removing the
  background on-device in the browser — the tool always works.
