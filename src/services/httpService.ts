/**
 * httpService.ts
 * Enterprise-grade HTTP Request Time Out (RTO) Service
 * Provides AbortController-backed request timeouts and generic promise timeout wrappers.
 */

export class TimeoutError extends Error {
  public url?: string;
  public timeoutMs: number;
  public isRto: boolean;

  constructor(message: string, timeoutMs: number = 4000, url?: string) {
    super(message);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    this.url = url;
    this.isRto = true;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
}

export const DEFAULT_RTO_MS = 4000; // 4.0 Seconds Default Request Time Out

/**
 * Executes a native fetch with explicit Request Time Out (RTO) protection via AbortController.
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_RTO_MS, signal: userSignal, ...fetchOptions } = options;

  const controller = new AbortController();
  let isTimedOut = false;

  const timeoutId = setTimeout(() => {
    isTimedOut = true;
    controller.abort();
  }, timeoutMs);

  // Allow caller to pass their own signal as well
  if (userSignal) {
    userSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (isTimedOut || err.name === 'AbortError') {
      throw new TimeoutError(
        `Request Time Out (RTO): Endpoint [${url}] failed to respond within ${timeoutMs}ms`,
        timeoutMs,
        url
      );
    }
    throw err;
  }
}

/**
 * Wraps any Promise (e.g. Firestore async operations, third-party library calls)
 * with a strict Request Time Out (RTO) timer.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_RTO_MS,
  customErrorMessage?: string
): Promise<T> {
  let timerId: any = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timerId = setTimeout(() => {
      reject(
        new TimeoutError(
          customErrorMessage || `Operation Timed Out (RTO): Exceeded threshold of ${timeoutMs}ms`,
          timeoutMs
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timerId) clearTimeout(timerId);
  });
}
