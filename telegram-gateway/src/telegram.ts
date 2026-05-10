/**
 * Telegram Bot API helpers — zero dependencies, just fetch.
 */

const TELEGRAM_API = 'https://api.telegram.org'

interface TelegramMessage {
  message_id: number
  from: { id: number; first_name: string; username?: string }
  chat: { id: number; type: string }
  date: number
  text?: string
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

interface SendMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disable_notification?: boolean
  reply_to_message_id?: number
}

export class TelegramClient {
  private token: string
  private allowedChatId: number

  constructor(token: string, allowedChatId: number) {
    this.token = token
    this.allowedChatId = allowedChatId
  }

  /** Validate that the update comes from the allowed chat */
  isAllowed(update: TelegramUpdate): boolean {
    return update.message?.chat.id === this.allowedChatId
  }

  /** Extract text from update */
  getText(update: TelegramUpdate): string | null {
    return update.message?.text ?? null
  }

  /** Get chat ID from update */
  getChatId(update: TelegramUpdate): number | null {
    return update.message?.chat.id ?? null
  }

  /** Send a text message to the allowed chat */
  async sendMessage(text: string, options?: SendMessageOptions): Promise<void> {
    const body = {
      chat_id: this.allowedChatId,
      text,
      parse_mode: options?.parse_mode ?? 'HTML',
      disable_notification: options?.disable_notification ?? false,
      ...(options?.reply_to_message_id && { reply_to_message_id: options.reply_to_message_id }),
    }

    const res = await fetch(`${TELEGRAM_API}/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Telegram sendMessage ${res.status}: ${err}`)
    }
  }

  /** Send a "typing..." indicator. Best-effort — logs on failure, never throws. */
  async sendTyping(): Promise<void> {
    try {
      const res = await fetch(`${TELEGRAM_API}/bot${this.token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          chat_id: this.allowedChatId,
          action: 'typing',
        }),
      })
      if (!res.ok) {
        console.warn(`[Telegram] sendTyping failed: ${res.status}`)
      }
    } catch (err) {
      console.warn(`[Telegram] sendTyping error:`, err instanceof Error ? err.message : err)
    }
  }

  /** Register webhook URL with Telegram */
  async setWebhook(url: string, secret?: string): Promise<boolean> {
    const body: Record<string, unknown> = { url }
    if (secret) body.secret_token = secret

    const res = await fetch(`${TELEGRAM_API}/bot${this.token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Telegram setWebhook ${res.status}: ${text}`)
    }

    const data = await res.json() as { ok: boolean; description?: string }
    if (!data.ok) {
      throw new Error(`Telegram setWebhook rejected: ${data.description ?? 'unknown'}`)
    }
    return data.ok
  }

  /** Get current webhook info */
  async getWebhookInfo(): Promise<unknown> {
    const res = await fetch(`${TELEGRAM_API}/bot${this.token}/getWebhookInfo`)
    return res.json()
  }
}
