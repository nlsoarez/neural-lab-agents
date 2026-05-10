/**
 * Shared structured logger. Pino writes one JSON line per event, which is what
 * Railway's log viewer and any downstream collector expect.
 */

import { pino } from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'neural-lab-telegram-gateway' },
})

export type Logger = typeof logger
