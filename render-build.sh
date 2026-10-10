#!/usr/bin/env bash
set -e

echo "=== FlowFetch Render Root Build Script ==="

cd backend
npm install
npm run build

BIN_DIR="$(pwd)/bin"
mkdir -p "$BIN_DIR"

if ! command -v yt-dlp &> /dev/null && [ ! -f "$BIN_DIR/yt-dlp" ]; then
  echo "Downloading latest yt-dlp Linux standalone binary..."
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$BIN_DIR/yt-dlp"
  chmod a+rx "$BIN_DIR/yt-dlp"
  echo "yt-dlp installed to $BIN_DIR/yt-dlp"
fi

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
  fi
fi

mkdir -p "$BIN_DIR/../temp/files"

echo "=== Build finished ==="
