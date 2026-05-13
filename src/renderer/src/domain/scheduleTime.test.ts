import { describe, expect, it, vi } from 'vitest'
import { dayTimeToDate, getStickyLive, needsLiveSecondTick } from './scheduleTime'
import type { ScheduledItem } from './appData'

const item = (partial: Partial<ScheduledItem>): ScheduledItem => ({
  id: '1',
  dayKey: '2030-01-15',
  title: 'T',
  startTime: '10:00',
  endTime: '11:00',
  committed: true,
  ...partial
})

describe('scheduleTime', () => {
  it('dayTimeToDate matches local noon', () => {
    const d = dayTimeToDate('2030-06-02', '12:30')
    expect(d.getFullYear()).toBe(2030)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(2)
    expect(d.getHours()).toBe(12)
    expect(d.getMinutes()).toBe(30)
  })

  it('past when after endTime', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '12:00'))
    const live = getStickyLive(
      new Date(),
      item({ startTime: '09:00', endTime: '11:30' })
    )
    expect(live.stripe).toBe('past')
    expect(live.line).toBe('已结束')
    vi.useRealTimers()
  })

  it('beforeStart uses upcoming / soon thresholds', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '09:00'))
    let live = getStickyLive(new Date(), item({ startTime: '14:00', endTime: null }))
    expect(live.stripe).toBe('upcoming')
    vi.setSystemTime(dayTimeToDate('2030-01-15', '13:35'))
    live = getStickyLive(new Date(), item({ startTime: '14:00', endTime: null }))
    expect(live.stripe).toBe('soon')
    vi.useRealTimers()
  })

  it('needsLiveSecondTick when countdown window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '09:54'))
    const list = [item({ startTime: '10:00', endTime: null })]
    expect(needsLiveSecondTick(list, new Date())).toBe(true)
    vi.useRealTimers()
  })
})
