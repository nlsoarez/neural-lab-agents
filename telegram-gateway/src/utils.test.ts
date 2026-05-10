import { describe, expect, it } from 'vitest'
import { escapeHtml, secretsMatch } from './utils.js'

describe('escapeHtml', () => {
  it('escapes &, <, > in that order', () => {
    expect(escapeHtml('<a href="x">&y</a>'))
      .toBe('&lt;a href=&quot;x&quot;&gt;&amp;y&lt;/a&gt;')
  })

  it('escapes single and double quotes', () => {
    expect(escapeHtml(`he said "ok" and 'go'`))
      .toBe('he said &quot;ok&quot; and &#39;go&#39;')
  })

  it('returns input unchanged when no special chars', () => {
    expect(escapeHtml('plain text 123')).toBe('plain text 123')
  })

  it('escapes & exactly once (no double-encoding)', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('secretsMatch', () => {
  it('returns true for identical strings', () => {
    expect(secretsMatch('hunter2', 'hunter2')).toBe(true)
  })

  it('returns false for different strings of same length', () => {
    expect(secretsMatch('abcdef', 'abcdez')).toBe(false)
  })

  it('returns false for different lengths', () => {
    expect(secretsMatch('short', 'longer-secret')).toBe(false)
  })

  it('returns false when one side is empty', () => {
    expect(secretsMatch('', 'x')).toBe(false)
    expect(secretsMatch('x', '')).toBe(false)
  })

  it('handles non-ASCII (UTF-8 byte length) correctly', () => {
    expect(secretsMatch('café', 'café')).toBe(true)
    // 'café' is 5 bytes (é = 2 bytes), 'cafe' is 4 — must reject
    expect(secretsMatch('café', 'cafe')).toBe(false)
  })
})
