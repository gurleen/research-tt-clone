/** HTMLMediaElement error codes (MediaError). Numeric so tests don't need a DOM. */
export const MEDIA_ERR_ABORTED = 1;
export const MEDIA_ERR_NETWORK = 2;
export const MEDIA_ERR_DECODE = 3;
export const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

export const VIDEO_LOAD_MAX_RETRIES = 3;
export const VIDEO_LOAD_RETRY_BASE_MS = 500;
export const VIDEO_LOAD_RETRY_QUERY_PARAM = "_r";

export function isRetryableMediaError(
  code: number | null | undefined,
): boolean {
  // 1 aborted — browser cancelled a fetch (contention, radio blip).
  // 2 network — the actual transient failure.
  // 4 src not supported — Chrome reports this when the GET failed before it
  //   could sniff a MIME type (dropped connections, 5xx, empty body).
  // 3 decode is a local bitstream problem; retrying will not help.
  if (code == null) return true;
  return (
    code === MEDIA_ERR_ABORTED ||
    code === MEDIA_ERR_NETWORK ||
    code === MEDIA_ERR_SRC_NOT_SUPPORTED
  );
}

export function videoLoadRetryDelayMs(nextAttempt: number): number {
  const attempt = Math.max(1, nextAttempt);
  return VIDEO_LOAD_RETRY_BASE_MS * 2 ** (attempt - 1);
}

export function shouldRetryVideoLoad(
  failedAttemptCount: number,
  errorCode: number | null | undefined,
  maxRetries = VIDEO_LOAD_MAX_RETRIES,
): boolean {
  if (failedAttemptCount >= maxRetries) return false;
  return isRetryableMediaError(errorCode);
}

export function withVideoLoadRetryCacheBust(
  src: string,
  attempt: number,
): string {
  try {
    const url = new URL(src, "http://localhost");
    url.searchParams.set(VIDEO_LOAD_RETRY_QUERY_PARAM, String(attempt));
    if (/^[a-z][a-z0-9+.-]*:/i.test(src)) {
      return url.toString();
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return src;
  }
}

export function videoSrcForLoadAttempt(
  src: string,
  failedAttemptCount: number,
): string {
  if (failedAttemptCount <= 0) return src;
  return withVideoLoadRetryCacheBust(src, failedAttemptCount);
}
