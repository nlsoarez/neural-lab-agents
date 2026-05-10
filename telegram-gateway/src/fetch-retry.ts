/**
 * fetch with exponential backoff for transient network errors and 5xx/429 responses.
 *
 * Retries are NOT attempted for non-retryable status codes (4xx other than 429),
 * because those won't get better by waiting.
 */

export interface FetchRetryOptions {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

const DEFAULT_RETRIES = 3
const DEFAULT_BASE_DELAY_MS = 500
const DEFAULT_MAX_DELAY_MS = 8_000

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
  input: string | URL,
  init?: RequestInit,
  opts: FetchRetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? DEFAULT_RETRIES
  const baseDelay = opts.baseDelayMs ?? DEFAULT_BASE_DELAY_MS
  const maxDelay = opts.maxDelayMs ?? DEFAULT_MAX_DELAY_MS

  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init)
      if (res.ok || !isRetryableStatus(res.status) || attempt === retries) {
        return res
      }
      lastErr = new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastErr = err
      if (attempt === retries) throw err
    }

    const delay = Math.min(baseDelay * 2 ** attempt, maxDelay)
    await sleep(delay)
  }

  throw lastErr ?? new Error('fetchWithRetry: exhausted retries')
}
