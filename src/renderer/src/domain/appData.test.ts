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

  it('parseAppData reads focusTotalsMsByItemId', () => {
    const id = 'item-a'
    const parsed = parseAppData(
      JSON.stringify({
        version: 1,
        scheduledItems: [],
        noteBlocks: [],
        focusTotalsMsByItemId: { [id]: 65000, bad: -1, x: NaN }
      })
    )
    expect(parsed.scheduledItems).toHaveLength(0)
    expect(parsed.noteBlocks).toHaveLength(0)
    expect(parsed.focusTotalsMsByItemId?.[id]).toBe(65000)
    expect(parsed.focusTotalsMsByItemId?.bad).toBeUndefined()
  })

  it('serialize includes focusTotalsMsByItemId map', () => {
    const d = defaultAppData()
    const id = d.scheduledItems[0]!.id
    const withTotals = {
      ...d,
      focusTotalsMsByItemId: { [id]: 120000 }
    }
    const raw = serializeAppData(withTotals)
    const again = parseAppData(raw)
    expect(again.focusTotalsMsByItemId?.[id]).toBe(120000)
  })

  it('parseAppData returns defaults for invalid JSON', () => {
    const d = parseAppData('not json')
    expect(d.version).toBe(1)
    expect(Array.isArray(d.scheduledItems)).toBe(true)
  })
})
