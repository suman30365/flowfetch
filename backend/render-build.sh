#!/usr/bin/env bash
set -e

echo "=== FlowFetch Render Build Script ==="

# 1. Install Node dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Create local bin directory
BIN_DIR="$(pwd)/bin"
mkdir -p "$BIN_DIR"

# 4. Download yt-dlp binary if not found
if ! command -v yt-dlp &> /dev/null && [ ! -f "$BIN_DIR/yt-dlp" ]; then
  echo "Downloading latest yt-dlp Linux standalone binary..."
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$BIN_DIR/yt-dlp"
  chmod a+rx "$BIN_DIR/yt-dlp"
  echo "yt-dlp installed to $BIN_DIR/yt-dlp"
else
  echo "yt-dlp is available."
fi

# 5. Download FFmpeg static build if not found
if ! command -v ffmpeg &> /dev/null && [ ! -f "$BIN_DIR/ffmpeg" ]; then
  echo "Downloading static FFmpeg build for Linux..."
  mkdir -p /tmp/ffmpeg-download
  curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg-download/ffmpeg.tar.xz || true
  if [ -f /tmp/ffmpeg-download/ffmpeg.tar.xz ]; then
    tar -xf /tmp/ffmpeg-download/ffmpeg.tar.xz -C /tmp/ffmpeg-download/
    cp /tmp/ffmpeg-download/ffmpeg-*-amd64-static/ffmpeg "$BIN_DIR/ffmpeg"
    cp /tmp/ffmpeg-download/ffmpeg-*-amd64-static/ffprobe "$BIN_DIR/ffprobe"
    chmod a+rx "$BIN_DIR/ffmpeg" "$BIN_DIR/ffprobe" 2>/dev/null || true
    rm -rf /tmp/ffmpeg-download
    echo "FFmpeg installed to $BIN_DIR/ffmpeg"
  else
    echo "Warning: Could not download static FFmpeg archive; checking fallback."
  fi
else
  echo "FFmpeg is available."
fi

# 6. Ensure temporary files folder exists
mkdir -p "$BIN_DIR/../temp/files"

echo "=== Render build complete ==="
