FROM python:3.11-slim

WORKDIR /app

# libgl1 is required by opencv-python-headless (a rembg dependency)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the AI model into the image so containers start instantly with no
# runtime download. u2netp is the lightweight model — fits free-tier hosts
# (e.g. Render's 512MB limit). Override with --build-arg REMBG_MODEL=... for
# a higher-quality model on hosts with more RAM.
ARG REMBG_MODEL=u2netp
ENV REMBG_MODEL=${REMBG_MODEL}
RUN python -c "import os; from rembg import new_session; new_session(os.environ['REMBG_MODEL'])"

COPY app.py .

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
