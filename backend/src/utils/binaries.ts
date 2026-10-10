import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { config } from '../config/env';

let cachedYtDlpPath: string | null = null;
let cachedFfmpegPath: string | null = null;
let pathInitialized = false;

/**
 * Automatically ensure local 'bin' directory is prepended to process.env.PATH
 * so spawned child processes (including yt-dlp spawning ffmpeg) can resolve binaries.
 */
export function initBinaryPath(): void {
  if (pathInitialized) return;
  pathInitialized = true;

  const possibleBinDirs = [
    path.resolve(process.cwd(), 'bin'),
    path.resolve(process.cwd(), '..', 'bin'),
    path.resolve(__dirname, '..', '..', 'bin'),
  ];

  for (const binDir of possibleBinDirs) {
    if (fs.existsSync(binDir)) {
      const sep = process.platform === 'win32' ? ';' : ':';
      if (!process.env.PATH?.includes(binDir)) {
        process.env.PATH = `${binDir}${sep}${process.env.PATH || ''}`;
      }
      break;
    }
  }
}

/**
 * Resolve the path or command name to execute yt-dlp.
 */
export function getYtDlpCommand(): string {
  if (cachedYtDlpPath) return cachedYtDlpPath;
  initBinaryPath();

  // 1. Explicit env var
  if (config.ytdlpPath && fs.existsSync(config.ytdlpPath)) {
    cachedYtDlpPath = config.ytdlpPath;
    return cachedYtDlpPath;
  }

  // 2. Local bin directory
  const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const possibleLocalPaths = [
    path.resolve(process.cwd(), 'bin', binName),
    path.resolve(process.cwd(), '..', 'bin', binName),
    path.resolve(__dirname, '..', '..', 'bin', binName),
  ];

  for (const localPath of possibleLocalPaths) {
    if (fs.existsSync(localPath)) {
      cachedYtDlpPath = localPath;
      return cachedYtDlpPath;
    }
  }

  // 3. Fallback to youtube-dl-exec binary if installed
  try {
    const ytdlExecPath = path.resolve(
      process.cwd(),
      'node_modules',
      'youtube-dl-exec',
      'bin',
      binName
    );
    if (fs.existsSync(ytdlExecPath)) {
      cachedYtDlpPath = ytdlExecPath;
      return cachedYtDlpPath;
    }
  } catch {}

  // 4. Default to system PATH
  cachedYtDlpPath = 'yt-dlp';
  return cachedYtDlpPath;
}

/**
 * Resolve the path or command name to execute ffmpeg.
 */
export function getFfmpegCommand(): string {
  if (cachedFfmpegPath) return cachedFfmpegPath;
  initBinaryPath();

  // 1. Explicit env var
  if (config.ffmpegPath && fs.existsSync(config.ffmpegPath)) {
    cachedFfmpegPath = config.ffmpegPath;
    return cachedFfmpegPath;
  }

  // 2. Local bin directory
  const binName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const possibleLocalPaths = [
    path.resolve(process.cwd(), 'bin', binName),
    path.resolve(process.cwd(), '..', 'bin', binName),
    path.resolve(__dirname, '..', '..', 'bin', binName),
  ];

  for (const localPath of possibleLocalPaths) {
    if (fs.existsSync(localPath)) {
      cachedFfmpegPath = localPath;
      return cachedFfmpegPath;
    }
  }

  // 3. Default to system PATH
  cachedFfmpegPath = 'ffmpeg';
  return cachedFfmpegPath;
}

export function checkFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    initBinaryPath();
    const cmd = getFfmpegCommand();
    execFile(cmd, ['-version'], (error) => {
      resolve(!error);
    });
  });
}
