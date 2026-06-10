FROM python:3.11-slim

WORKDIR /app

# libgl1 is required by opencv-python-headless (a rembg dependency)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the AI model into the image so containers start instantly with no
# runtime download.
RUN python -c "from rembg import new_session; new_session('isnet-general-use')"

COPY app.py .

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
