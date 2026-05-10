/**
 * Paperclip REST API client — creates issues and polls for completion.
 */

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
    const res = await fetch(url, {
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
   * Poll an issue until it closes or times out.
   * Returns the final issue state with comments.
   */
  async waitForCompletion(
    issueId: string,
    options: { intervalMs?: number; timeoutMs?: number } = {},
  ): Promise<{ issue: PaperclipIssue; timedOut: boolean }> {
    const interval = options.intervalMs ?? 30_000  // 30s default
    const timeout = options.timeoutMs ?? 600_000   // 10min default
    const start = Date.now()

    while (Date.now() - start < timeout) {
      const issue = await this.getIssue(issueId)

      if (issue.state === 'closed') {
        return { issue, timedOut: false }
      }

      // Check if there are new comments (agent responded but didn't close)
      if (issue.comments.length > 0) {
        const lastComment = issue.comments[issue.comments.length - 1]
        const commentAge = Date.now() - new Date(lastComment.created_at).getTime()
        // If the last comment is recent (<2min) and from an agent, return it
        if (commentAge < 120_000 && lastComment.author !== 'human') {
          return { issue, timedOut: false }
        }
      }

      await new Promise(resolve => setTimeout(resolve, interval))
    }

    const finalIssue = await this.getIssue(issueId)
    return { issue: finalIssue, timedOut: true }
  }
}
