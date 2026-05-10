/**
 * Neural Lab Telegram Gateway
 *
 * Express server that bridges Telegram Bot API ↔ Paperclip issues.
 * Receives commands via webhook, creates issues, polls for completion,
 * and sends results back to Telegram.
 */

import 'dotenv/config'
import express from 'express'
import { TelegramClient, type TelegramUpdate } from './telegram.js'
import { PaperclipClient } from './paperclip-client.js'
import { parseCommand } from './commands.js'

// ── Config ──────────────────────────────────────────────

const PORT = parseInt(process.env.GATEWAY_PORT ?? process.env.PORT ?? '3200', 10)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET
const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL ?? 'http://localhost:3100'
const PAPERCLIP_AUTH_TOKEN = process.env.PAPERCLIP_AUTH_TOKEN

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
  process.exit(1)
}

if (!PAPERCLIP_AUTH_TOKEN) {
  console.error('❌ Missing PAPERCLIP_AUTH_TOKEN')
  process.exit(1)
}

const telegram = new TelegramClient(TELEGRAM_BOT_TOKEN, parseInt(TELEGRAM_CHAT_ID, 10))
const paperclip = new PaperclipClient(PAPERCLIP_API_URL, PAPERCLIP_AUTH_TOKEN)

// ── Rate limiting (simple in-memory) ────────────────────

const rateLimiter = {
  requests: [] as number[],
  maxPerMinute: 10,

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
  // Validate webhook secret if configured
  if (TELEGRAM_WEBHOOK_SECRET) {
    const secret = req.headers['x-telegram-bot-api-secret-token']
    if (secret !== TELEGRAM_WEBHOOK_SECRET) {
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

  const text = telegram.getText(update)
  if (!text) return

  // Rate limit
  if (!rateLimiter.check()) {
    await telegram.sendMessage('Rate limit - max 10 comandos/minuto. Aguarde.')
    return
  }

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

    await telegram.sendMessage(
      `Issue <b>#${issue.number}</b> criada.\nAguardando resposta do agente (max 10min)...`,
    )

    // Poll for completion
    const { issue: completed, timedOut } = await paperclip.waitForCompletion(issue.id, {
      intervalMs: 30_000,
      timeoutMs: 600_000,
    })

    if (timedOut) {
      await telegram.sendMessage(
        `<b>Timeout</b> - Issue #${issue.number} nao foi resolvida em 10 minutos.\n\n` +
        `O agente pode ainda estar processando. Verifique no Paperclip.`,
      )
      return
    }

    // Send result
    const lastComment = completed.comments[completed.comments.length - 1]
    const result = lastComment?.body ?? '(sem comentário do agente)'

    // Truncate if too long for Telegram (max 4096 chars)
    const maxLen = 3800
    const truncated = result.length > maxLen
      ? result.slice(0, maxLen) + '\n\n... (truncado — ver completo no Paperclip)'
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
}

// ── Start server ────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Neural Lab Telegram Gateway running on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Webhook: POST /webhook/telegram`)
  console.log(`   Paperclip: ${PAPERCLIP_API_URL}`)
  console.log(`   Chat ID: ${TELEGRAM_CHAT_ID}`)
})
