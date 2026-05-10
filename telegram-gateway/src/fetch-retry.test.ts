import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWithRetry } from './fetch-retry.js'

function jsonResponse(status: number, body: unknown = { ok: true }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('fetchWithRetry', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.useRealTimers()
  })

  it('returns immediately on first 2xx', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200))
    const res = await fetchWithRetry('https://example.test/ok')
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('returns immediately on non-retryable 4xx (e.g. 400)', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(400, { error: 'bad' }))
    const res = await fetchWithRetry('https://example.test/bad')
    expect(res.status).toBe(400)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('retries on 503 then succeeds', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200))

    const promise = fetchWithRetry('https://example.test/x', undefined, { baseDelayMs: 10 })
    await vi.advanceTimersByTimeAsync(10)
    const res = await promise
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('retries on 429 (rate limit)', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(429))
      .mockResolvedValueOnce(jsonResponse(200))

    const promise = fetchWithRetry('https://example.test/r', undefined, { baseDelayMs: 10 })
    await vi.advanceTimersByTimeAsync(10)
    await promise
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('retries on thrown network error then succeeds', async () => {
    fetchSpy
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(jsonResponse(200))

    const promise = fetchWithRetry('https://example.test/n', undefined, { baseDelayMs: 10 })
    await vi.advanceTimersByTimeAsync(10)
    const res = await promise
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('gives up and returns the last 5xx after exhausting retries', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(500))

    const promise = fetchWithRetry('https://example.test/f', undefined, {
      retries: 3,
      baseDelayMs: 10,
    })
    await vi.advanceTimersByTimeAsync(1000)
    const res = await promise
    expect(res.status).toBe(500)
    expect(fetchSpy).toHaveBeenCalledTimes(4)
  })

  it('throws the last network error when all retries fail', async () => {
    const err = new TypeError('fetch failed')
    fetchSpy.mockRejectedValue(err)

    const promise = fetchWithRetry('https://example.test/n', undefined, {
      retries: 2,
      baseDelayMs: 10,
    })
    // Catch on the original promise immediately so an early rejection
    // can't trigger an unhandled-rejection warning while timers advance.
    const settled = promise.then(
      v => ({ ok: true as const, v }),
      e => ({ ok: false as const, e }),
    )
    await vi.advanceTimersByTimeAsync(1000)
    const result = await settled
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.e).toBe(err)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })
})
