import { describe, expect, it } from 'vitest'
import { defaultAppData, parseAppData, serializeAppData, timeToMinutes } from './appData'

describe('appData', () => {
  it('timeToMinutes parses HH:mm', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('23:59')).toBe(23 * 60 + 59)
  })

  it('parse + serialize roundtrip preserves version', () => {
    const d = defaultAppData()
    const again = parseAppData(serializeAppData(d))
    expect(again.version).toBe(1)
    expect(again.scheduledItems.length).toBe(d.scheduledItems.length)
    expect(again.noteBlocks.length).toBe(d.noteBlocks.length)
  })

  it('parseAppData returns defaults for invalid JSON', () => {
    const d = parseAppData('not json')
    expect(d.version).toBe(1)
    expect(Array.isArray(d.scheduledItems)).toBe(true)
  })
})
