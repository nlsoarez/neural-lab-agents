import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PaperclipClient, type PaperclipIssue } from './paperclip-client.js'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function makeIssue(overrides: Partial<PaperclipIssue> = {}): PaperclipIssue {
  return {
    id: 'i1',
    number: 1,
    title: 't',
    body: 'b',
    state: 'open',
    labels: [],
    comments: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('PaperclipClient.waitForCompletion', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
    vi.useRealTimers()
  })

  it('returns immediately when the issue is already closed', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(makeIssue({ state: 'closed' })))

    const client = new PaperclipClient('http://test', 'tok')
    const result = await client.waitForCompletion('i1')

    expect(result.timedOut).toBe(false)
    expect(result.issue.state).toBe('closed')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('returns when an agent comment is stable across polls and idle long enough', async () => {
    // Comment originally posted 90s ago. After 30s of polling, age = 120s > 60s default.
    const commentTime = new Date(Date.now() - 90_000).toISOString()
    const issue = makeIssue({
      comments: [{ id: 'c1', body: 'ok', author: 'agent', created_at: commentTime }],
    })

    fetchSpy.mockImplementation(async () => jsonResponse(issue))

    const client = new PaperclipClient('http://test', 'tok')
    const promise = client.waitForCompletion('i1', {
      intervalMs: 30_000,
      timeoutMs: 600_000,
      stableAfterMs: 60_000,
    })

    // Poll 1: prevCount=-1, count=1 → not stable yet, sleeps 30s.
    // Poll 2: count==prevCount, age=120s, agent → returns.
    await vi.advanceTimersByTimeAsync(31_000)
    const result = await promise

    expect(result.timedOut).toBe(false)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('does not return early when comment count keeps growing', async () => {
    // Each poll returns one more comment, simulating a streaming agent.
    const comments = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i + 1}`,
      body: `chunk ${i + 1}`,
      author: 'agent',
      created_at: new Date(Date.now() - 1_000).toISOString(),
    }))

    let count = 1
    fetchSpy.mockImplementation(async () =>
      jsonResponse(makeIssue({ comments: comments.slice(0, count++) })),
    )

    const client = new PaperclipClient('http://test', 'tok')
    const promise = client.waitForCompletion('i1', {
      intervalMs: 10_000,
      timeoutMs: 40_000, // tight timeout — count never stabilizes, so we should hit it
      stableAfterMs: 5_000,
    })

    await vi.advanceTimersByTimeAsync(45_000)
    const result = await promise

    expect(result.timedOut).toBe(true)
    // 5 polls total: 4 inside the loop + 1 final getIssue after timeout
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(4)
  })

  it('does not return early on a stable human-only comment', async () => {
    const commentTime = new Date(Date.now() - 90_000).toISOString()
    const issue = makeIssue({
      comments: [{ id: 'c1', body: 'hi', author: 'human', created_at: commentTime }],
    })

    fetchSpy.mockImplementation(async () => jsonResponse(issue))

    const client = new PaperclipClient('http://test', 'tok')
    const promise = client.waitForCompletion('i1', {
      intervalMs: 10_000,
      timeoutMs: 25_000,
      stableAfterMs: 5_000,
    })

    await vi.advanceTimersByTimeAsync(30_000)
    const result = await promise

    expect(result.timedOut).toBe(true)
  })
})
