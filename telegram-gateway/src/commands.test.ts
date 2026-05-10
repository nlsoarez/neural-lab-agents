import { describe, expect, it } from 'vitest'
import { parseCommand } from './commands.js'

describe('parseCommand', () => {
  it('returns help for /help', () => {
    const r = parseCommand('/help')
    expect(r.type).toBe('help')
    expect(r.body).toContain('Neural Lab')
  })

  it('returns help for /start', () => {
    const r = parseCommand('/start')
    expect(r.type).toBe('help')
  })

  it('maps /relatorio to Market Intel Agent', () => {
    const r = parseCommand('/relatorio')
    expect(r.type).toBe('command')
    expect(r.agent).toBe('Market Intel Agent')
    expect(r.labels).toContain('RELATORIO')
  })

  it('maps /proposta with args to Pricing & Proposals Agent', () => {
    const r = parseCommand('/proposta AcmeCorp budget 5k')
    expect(r.type).toBe('command')
    expect(r.agent).toBe('Pricing & Proposals Agent')
    expect(r.title).toContain('AcmeCorp')
    expect(r.body).toContain('AcmeCorp')
    expect(r.body).toContain('budget 5k')
  })

  it('handles /proposta with no args gracefully', () => {
    const r = parseCommand('/proposta')
    expect(r.type).toBe('command')
    expect(r.body).toContain('N/A')
  })

  it('is case-insensitive for command name', () => {
    const r = parseCommand('/RELATORIO')
    expect(r.type).toBe('command')
    expect(r.agent).toBe('Market Intel Agent')
  })

  it('routes free text to CEO Agent', () => {
    const r = parseCommand('como estao os agentes hoje?')
    expect(r.type).toBe('freetext')
    expect(r.agent).toBe('CEO Agent')
    expect(r.body).toContain('como estao os agentes hoje')
  })

  it('truncates the title body for long free text', () => {
    const long = 'a'.repeat(200)
    const r = parseCommand(long)
    expect(r.type).toBe('freetext')
    expect(r.title).toContain('...')
    // Title prefix is short; the variable body slice should be capped at 60 chars
    expect(r.title).not.toContain('a'.repeat(61))
    expect(r.body).toContain(long)
  })

  it('trims whitespace', () => {
    const r = parseCommand('   /status   ')
    expect(r.type).toBe('command')
    expect(r.agent).toBe('CEO Agent')
  })

  it('treats unknown slash command as free text', () => {
    const r = parseCommand('/desconhecido foo bar')
    expect(r.type).toBe('freetext')
    expect(r.agent).toBe('CEO Agent')
  })
})
