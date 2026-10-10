# Railway Deployment Guide

This document outlines how to safely deploy the FlowFetch backend to Railway, serving as an alternative to Render (useful if Render's IPs are blocked by YouTube bot protection).

## 1. Project Configuration
The existing `backend/Dockerfile` is already 100% compatible with Railway and correctly handles:
- **Node.js**: Uses `node:20-bookworm-slim`
- **FFmpeg & Python3**: Installed natively via `apt-get`
- **yt-dlp**: Always fetches the latest standalone Linux binary during the Docker build phase.
- **Dockerfile Path**: Automatically detected by Railway when Root Directory is set to `backend`.
- **Start Command**: Executed via the Dockerfile's `CMD ["node", "dist/server.js"]`.
- **Port Binding**: Railway dynamically assigns the `PORT` environment variable. Our Express server securely binds to `0.0.0.0` automatically.
- **Health Check Endpoint**: Available at `/health` and `/api/health`.

## 2. Deployment Steps

1. Log into your [Railway Dashboard](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select the `suman30365/flowfetch` repository.
4. Do **not** deploy immediately. Click **Add variables** or go to the service settings.
5. **Critical Configuration (Settings Tab):**
   - **Root Directory**: `backend` (This ensures Railway uses `backend/Dockerfile` and sets the correct build context).
   - **Environment**: Docker (Railway will auto-detect the Dockerfile).
   - **Healthcheck Path**: `/health`
   - **Healthcheck Timeout**: `100` seconds
6. **Environment Variables (Variables Tab):**
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://flowfetch.pages.dev` (The Cloudflare pages URL for CORS)
7. Click **Deploy**.

## 3. Post-Deployment (Frontend Update)

Once Railway finishes building, it will generate a public domain (e.g., `flowfetch-production.up.railway.app`).
1. Go to your Cloudflare Pages dashboard for the frontend.
2. Update the `VITE_API_BASE_URL` environment variable to point to your new Railway URL.
3. Redeploy the frontend.

## Important Security & Bot Protection Notes
- **YouTube Bot Protection is NOT Guaranteed to be Fixed by Railway.** Changing cloud hosting providers (Render -> Railway) only changes your datacenter IP. If Railway's IP blocks are also recognized by YouTube as datacenters, you will still encounter "Sign in to confirm you're not a bot" errors.
- **Never commit cookies, account credentials, or tokens.** If Railway fails, the ultimate solution is hosting on a residential IP or a private VPS. **Do not** upload a personal `cookies.txt` or session tokens to public repositories or cloud dashboards to bypass access controls.
- There are no hardcoded secrets or credentials in the `.env.example` or Dockerfile.
