/**
 * Shared error classifier for yt-dlp stderr output.
 *
 * Centralises all error-pattern matching so that ytdlp.ts, downloader.ts,
 * and any future callers stay consistent without code duplication.
 *
 * Guidelines:
 *  - Patterns must never test for cookies, auth headers, or session tokens.
 *  - Log the raw stderr at call sites; this module only classifies.
 *  - Truncation of large stderr is the caller's responsibility before logging.
 */

/** Maximum characters of raw stderr to include in server logs. */
export const STDERR_LOG_LIMIT = 1000;

/** Human-facing error categories surfaced to the API consumer. */
export type YtDlpErrorKind =
  | 'BOT_PROTECTION'
  | 'VIDEO_UNAVAILABLE'
  | 'UNSUPPORTED_URL'
  | 'GENERIC';

export interface ClassifiedError {
  kind: YtDlpErrorKind;
  /**
   * Ready-to-send user-facing message.  Does NOT contain raw stderr or
   * internal paths.
   */
  message: string;
  /**
   * Suggested HTTP status code for the API response.
   * - 403 for bot-protection / blocked access
   * - 422 for video unavailable (server understood but cannot process)
   * - 400 for unsupported URL (caller error)
   * - 500 for all other failures
   */
  httpStatus: 400 | 403 | 422 | 500;
}

/**
 * Inspect yt-dlp stderr and exit code, then return a structured error.
 *
 * @param stderr  Full stderr output from the child process.
 * @param code    Process exit code (may be null if killed by signal).
 */
export function classifyYtDlpError(
  stderr: string,
  code: number | null,
): ClassifiedError {
  // Match both ASCII straight apostrophe (') and Unicode right-single-quotation-mark (\u2019)
  // YouTube's challenge message has been observed with both variants depending on
  // the locale / encoding of the yt-dlp output.
  if (/Sign in to confirm (you're|you\u2019re) not a bot/i.test(stderr)) {
    return {
      kind: 'BOT_PROTECTION',
      message:
        'YouTube blocked the request due to bot protection. ' +
        'Cloud hosting platforms are commonly blocked by YouTube\u2019s datacenter IP filters. ' +
        'Try running FlowFetch locally, or use a non-YouTube URL (e.g. SoundCloud, Dailymotion).',
      httpStatus: 403,
    };
  }

  if (
    stderr.includes('Video unavailable') ||
    stderr.includes('This video is unavailable')
  ) {
    return {
      kind: 'VIDEO_UNAVAILABLE',
      message: 'The requested video is unavailable, private, or region-locked.',
      httpStatus: 422,
    };
  }

  if (stderr.includes('Unsupported URL')) {
    return {
      kind: 'UNSUPPORTED_URL',
      message: 'This URL is not supported or not recognized by yt-dlp.',
      httpStatus: 400,
    };
  }

  // Generic fallback: extract the first ERROR: line, strip internal paths.
  const match = stderr.match(/ERROR:\s*(.*)/);
  const detail = match ? match[1].trim() : stderr.split('\n')[0].trim();
  return {
    kind: 'GENERIC',
    message: `Extraction failed: ${detail || 'Unknown error'} (exit code ${code ?? 'unknown'})`,
    httpStatus: 500,
  };
}

/**
 * Return at most STDERR_LOG_LIMIT characters of stderr for server logging.
 * Avoids flooding log storage with enormous error payloads while preserving
 * the first (most relevant) lines.
 */
export function truncateStderr(stderr: string): string {
  if (stderr.length <= STDERR_LOG_LIMIT) return stderr.trim();
  return stderr.slice(0, STDERR_LOG_LIMIT).trim() + ' \u2026 [truncated]';
}
