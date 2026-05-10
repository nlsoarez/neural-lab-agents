/**
 * Paperclip REST API client — creates issues and polls for completion.
 */

import { fetchWithRetry } from './fetch-retry.js'

export interface PaperclipIssue {
  id: string
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  labels: string[]
  comments: PaperclipComment[]
  created_at: string
  updated_at: string
  closed_at?: string
}

export interface PaperclipComment {
  id: string
  body: string
  author: string
  created_at: string
}

interface CreateIssueParams {
  title: string
  body: string
  labels: string[]
  assignee?: string
}

export class PaperclipClient {
  private baseUrl: string
  private authToken: string

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.authToken = authToken
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const res = await fetchWithRetry(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options?.headers,
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Paperclip API ${res.status}: ${text}`)
    }

    return res.json() as Promise<T>
  }

  /** Create a new issue */
  async createIssue(params: CreateIssueParams): Promise<PaperclipIssue> {
    return this.request<PaperclipIssue>('/api/issues', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /** Get issue by ID */
  async getIssue(id: string): Promise<PaperclipIssue> {
    return this.request<PaperclipIssue>(`/api/issues/${id}`)
  }

  /** Get issue comments */
  async getIssueComments(id: string): Promise<PaperclipComment[]> {
    return this.request<PaperclipComment[]>(`/api/issues/${id}/comments`)
  }

  /** List recent issues (latest first) */
  async listIssues(limit = 10, state?: 'open' | 'closed'): Promise<PaperclipIssue[]> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (state) params.set('state', state)
    return this.request<PaperclipIssue[]>(`/api/issues?${params}`)
  }

  /**
   * Poll an issue until it closes or the agent's output stabilizes.
   *
   * Stability rule: when the issue is still open, we only return early if the
   * comment count is unchanged between two consecutive polls AND the last
   * comment is from an agent AND it has been quiet for at least
   * `stableAfterMs`. This prevents bailing out mid-stream when an agent
   * posts multiple comments in sequence.
   */
  async waitForCompletion(
    issueId: string,
    options: { intervalMs?: number; timeoutMs?: number; stableAfterMs?: number } = {},
  ): Promise<{ issue: PaperclipIssue; timedOut: boolean }> {
    const interval = options.intervalMs ?? 30_000
    const timeout = options.timeoutMs ?? 600_000
    const stableAfter = options.stableAfterMs ?? 60_000
    const start = Date.now()
    let prevCommentCount = -1

    while (Date.now() - start < timeout) {
      const issue = await this.getIssue(issueId)

      if (issue.state === 'closed') {
        return { issue, timedOut: false }
      }

      const count = issue.comments.length
      if (count > 0 && count === prevCommentCount) {
        const lastComment = issue.comments[count - 1]
        const commentAge = Date.now() - new Date(lastComment.created_at).getTime()
        if (commentAge >= stableAfter && lastComment.author !== 'human') {
          return { issue, timedOut: false }
        }
      }
      prevCommentCount = count

      await new Promise(resolve => setTimeout(resolve, interval))
    }

    const finalIssue = await this.getIssue(issueId)
    return { issue: finalIssue, timedOut: true }
  }
}
