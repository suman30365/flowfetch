import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit';
import analyzeRouter from './routes/analyze';
import downloadRouter from './routes/download';
import progressRouter from './routes/progress';
import { startCleanupJob } from './services/cleanup';
import { initBinaryPath } from './utils/binaries';

// Initialize binary path for subprocesses
initBinaryPath();

// Ensure temporary files directory exists on startup
try {
  fs.mkdirSync(path.join(config.tempDir, 'files'), { recursive: true });
} catch (err: any) {
  console.warn(`[FlowFetch] Warning ensuring temp directory: ${err.message}`);
}

const app = express();

// Parse and normalize allowed origins from FRONTEND_URL
const allowedOrigins = (config.frontendUrl || '')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server, curl, mobile, and native download requests without origin
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');

    // Allow local development on localhost or 127.0.0.1
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
      return callback(null, true);
    }

    // Allow wildcard if configured
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Check exact match with configured frontend URLs
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Allow Cloudflare Pages / Vercel preview URLs matching project domain
    const isAllowedPreview = allowedOrigins.some(allowed => {
      try {
        const allowedHost = new URL(allowed).hostname;
        const originHost = new URL(normalizedOrigin).hostname;
        return (
          originHost.endsWith(allowedHost) ||
          originHost.endsWith('.pages.dev') ||
          originHost.endsWith('.vercel.app')
        );
      } catch {
        return false;
      }
    });

    if (isAllowedPreview) {
      return callback(null, true);
    }

    callback(new Error(`CORS error: Origin ${origin} not allowed by Access-Control-Allow-Origin.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Content-Disposition', 'Accept-Ranges'],
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoints (excluded from rate limiter for platform health monitoring)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: config.env,
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Apply rate limiter to general API routes
app.use('/api/', rateLimiter);

app.use('/api/analyze', analyzeRouter);
app.use('/api/download', downloadRouter);
app.use('/api/progress', progressRouter);

app.use(errorHandler);

// Start background cleanup tasks
startCleanupJob();

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`FlowFetch backend running on port ${config.port} (0.0.0.0)`);
});

// Prevent Node.js from timing out connections during large streaming downloads.
server.setTimeout(0);        // no idle timeout on any socket
server.headersTimeout = 0;  // no timeout waiting for headers
server.keepAliveTimeout = 65000; // standard keep-alive
