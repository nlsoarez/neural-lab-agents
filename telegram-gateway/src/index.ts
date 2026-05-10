/**
 * Neural Lab Telegram Gateway
 *
 * Express server that bridges Telegram Bot API ↔ Paperclip issues.
 * Receives commands via webhook, creates issues, polls for completion,
 * and sends results back to Telegram.
 */

import 'dotenv/config'
import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import express from 'express'
import { TelegramClient, type TelegramUpdate } from './telegram.js'
import { PaperclipClient } from './paperclip-client.js'
import { parseCommand } from './commands.js'

// ── Config ──────────────────────────────────────────────

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const parsed = parseInt(raw, 10)
  if (!Number.isFinite(parsed)) {
    console.error(`Invalid ${name}=${raw}, must be an integer`)
    process.exit(1)
  }
  return parsed
}

const PORT = envInt('GATEWAY_PORT', envInt('PORT', 3200))
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL ?? 'http://localhost:3100'
const PAPERCLIP_AUTH_TOKEN = process.env.PAPERCLIP_AUTH_TOKEN

// Tunables — all optional, with safe defaults
const RATE_LIMIT_PER_MINUTE = envInt('RATE_LIMIT_PER_MINUTE', 10)
const POLL_INTERVAL_MS = envInt('POLL_INTERVAL_MS', 30_000)
const POLL_TIMEOUT_MS = envInt('POLL_TIMEOUT_MS', 600_000)
const POLL_STABLE_AFTER_MS = envInt('POLL_STABLE_AFTER_MS', 60_000)
const TELEGRAM_MAX_MESSAGE_LEN = envInt('TELEGRAM_MAX_MESSAGE_LEN', 3800)
const COMMAND_MAX_INPUT_LEN = envInt('COMMAND_MAX_INPUT_LEN', 4000)

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
  process.exit(1)
}

if (!PAPERCLIP_AUTH_TOKEN) {
  console.error('Missing PAPERCLIP_AUTH_TOKEN')
  process.exit(1)
}

const chatId = parseInt(TELEGRAM_CHAT_ID, 10)
if (!Number.isFinite(chatId)) {
  console.error(`Invalid TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}, must be an integer`)
  process.exit(1)
}

const telegram = new TelegramClient(TELEGRAM_BOT_TOKEN, chatId)
const paperclip = new PaperclipClient(PAPERCLIP_API_URL, PAPERCLIP_AUTH_TOKEN)

// ── Rate limiting (simple in-memory, sliding window) ────

const rateLimiter = {
  requests: [] as number[],
  maxPerMinute: RATE_LIMIT_PER_MINUTE,

  check(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(t => now - t < 60_000)
    if (this.requests.length >= this.maxPerMinute) return false
    this.requests.push(now)
    return true
  },
}

// ── Express app ─────────────────────────────────────────

const app = express()
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'neural-lab-telegram-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// Telegram webhook
app.post('/webhook/telegram', async (req, res) => {
  // Validate webhook secret if configured (constant-time compare)
  if (TELEGRAM_WEBHOOK_SECRET) {
    const provided = req.headers['x-telegram-bot-api-secret-token']
    if (typeof provided !== 'string' || !secretsMatch(provided, TELEGRAM_WEBHOOK_SECRET)) {
      console.warn('[Gateway] Invalid webhook secret')
      return res.sendStatus(401)
    }
  }

  const update: TelegramUpdate = req.body

  // Must respond 200 quickly to Telegram
  res.sendStatus(200)

  // Process asynchronously
  handleUpdate(update).catch(err => {
    console.error('[Gateway] Error handling update:', err)
  })
})

// ── Webhook handler ─────────────────────────────────────

async function handleUpdate(update: TelegramUpdate): Promise<void> {
  // Validate sender
  if (!telegram.isAllowed(update)) {
    console.warn(`[Gateway] Rejected message from chat ${telegram.getChatId(update)}`)
    return
  }

  const rawText = telegram.getText(update)
  if (!rawText) return

  // Rate limit
  if (!rateLimiter.check()) {
    await telegram.sendMessage(`Rate limit - max ${RATE_LIMIT_PER_MINUTE} comandos/minuto. Aguarde.`)
    return
  }

  // Truncate oversized input to keep token cost bounded
  const text = rawText.length > COMMAND_MAX_INPUT_LEN
    ? rawText.slice(0, COMMAND_MAX_INPUT_LEN)
    : rawText

  console.log(`[Gateway] Received: "${text.slice(0, 80)}"`)

  // Parse command
  const command = parseCommand(text)

  // Handle /help locally (no Paperclip needed)
  if (command.type === 'help') {
    await telegram.sendMessage(command.body)
    return
  }

  // Send typing indicator + acknowledgment
  await telegram.sendTyping()

  await telegram.sendMessage(
    `<b>Recebido!</b>\n\n` +
    `Agente: <code>${command.agent}</code>\n` +
    `Issue: ${escapeHtml(command.title)}\n\n` +
    `Criando issue e aguardando resposta...`,
  )

  try {
    // Create Paperclip issue
    const issue = await paperclip.createIssue({
      title: command.title,
      body: command.body,
      labels: command.labels,
      assignee: command.agent,
    })

    console.log(`[Gateway] Created issue #${issue.number} (${issue.id})`)

    const timeoutMinutes = Math.round(POLL_TIMEOUT_MS / 60_000)
    await telegram.sendMessage(
      `Issue <b>#${issue.number}</b> criada.\nAguardando resposta do agente (max ${timeoutMinutes}min)...`,
    )

    // Poll for completion
    const { issue: completed, timedOut } = await paperclip.waitForCompletion(issue.id, {
      intervalMs: POLL_INTERVAL_MS,
      timeoutMs: POLL_TIMEOUT_MS,
      stableAfterMs: POLL_STABLE_AFTER_MS,
    })

    if (timedOut) {
      await telegram.sendMessage(
        `<b>Timeout</b> - Issue #${issue.number} nao foi resolvida em ${timeoutMinutes} minutos.\n\n` +
        `O agente pode ainda estar processando. Verifique no Paperclip.`,
      )
      return
    }

    // Send result
    const lastComment = completed.comments[completed.comments.length - 1]
    const result = lastComment?.body ?? '(sem comentário do agente)'

    // Truncate if too long for Telegram (hard limit 4096 chars)
    const truncated = result.length > TELEGRAM_MAX_MESSAGE_LEN
      ? result.slice(0, TELEGRAM_MAX_MESSAGE_LEN) + '\n\n... (truncado — ver completo no Paperclip)'
      : result

    await telegram.sendMessage(
      `<b>Issue #${completed.number} - ${completed.state}</b>\n` +
      `${lastComment?.author ?? 'Agent'}\n\n` +
      `${escapeHtml(truncated)}`,
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[Gateway] Paperclip error:`, message)

    await telegram.sendMessage(
      `<b>Erro ao criar issue</b>\n\n` +
      `<code>${escapeHtml(message.slice(0, 500))}</code>\n\n` +
      `Verifique se o Paperclip esta rodando.`,
    )
  }
}

// ── Helpers ──────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function secretsMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

// ── Start server ────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Neural Lab Telegram Gateway running on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Webhook: POST /webhook/telegram`)
  console.log(`   Paperclip: ${PAPERCLIP_API_URL}`)
  console.log(`   Chat ID: ${TELEGRAM_CHAT_ID}`)
})
