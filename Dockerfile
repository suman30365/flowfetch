FROM node:20-bookworm-slim

# Install system dependencies: ffmpeg, python3, curl, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install latest standalone yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app/backend

# Copy backend dependency files
COPY backend/package*.json ./

# Install dependencies (including typescript)
RUN npm install

# Copy source code and configuration
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Compile TypeScript to dist
RUN npm run build

# Create temp storage directory
RUN mkdir -p /tmp/flowfetch/files

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV TEMP_DIR=/tmp/flowfetch

EXPOSE 3000

# Start production server
CMD ["node", "dist/server.js"]
