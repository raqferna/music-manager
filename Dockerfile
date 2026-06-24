FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Dependencias de quitar-voz (no usar el venv del host montado por volumen).
RUN pip3 install --no-cache-dir --break-system-packages \
    yt-dlp \
    audio-separator \
    onnxruntime \
    gradio \
    mutagen \
    pycryptodomex \
    faster-whisper

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5001
CMD ["npm", "run", "start", "--", "-p", "5001"]
