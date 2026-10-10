import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  tempDir: process.env.TEMP_DIR
    ? (path.isAbsolute(process.env.TEMP_DIR)
        ? process.env.TEMP_DIR
        : path.resolve(process.cwd(), process.env.TEMP_DIR))
    : (process.env.NODE_ENV === 'production' && process.platform !== 'win32'
        ? '/tmp/flowfetch'
        : path.resolve(process.cwd(), 'temp')),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '2147483648', 10), // 2GB
  downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT || '3600000', 10), // 1 hour
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 mins
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  ytdlpPath: process.env.YTDLP_PATH || '',
  ffmpegPath: process.env.FFMPEG_PATH || '',
};
