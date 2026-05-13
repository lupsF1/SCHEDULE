import { describe, expect, it, vi } from 'vitest'
import {
  dayTimeToDate,
  getPlantGrowthFraction,
  getRemainingMs,
  getStickyLive,
  isScheduleItemActiveNow,
  listActiveCommittedScheduledItems,
  needsLiveSecondTick
} from './scheduleTime'
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

  it('needsLiveSecondTick when inside former 10-minute window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '09:54'))
    const list = [item({ startTime: '10:00', endTime: null })]
    expect(needsLiveSecondTick(list, new Date())).toBe(true)
    vi.useRealTimers()
  })

  it('needsLiveSecondTick when more than 10 minutes remain but clock is shown', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '09:00'))
    const list = [item({ startTime: '10:00', endTime: '11:00' })]
    expect(needsLiveSecondTick(list, new Date())).toBe(true)
    vi.useRealTimers()
  })

  it('needsLiveSecondTick false when no remaining window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '12:00'))
    const list = [item({ startTime: '10:00', endTime: '11:00' })]
    expect(needsLiveSecondTick(list, new Date())).toBe(false)

    vi.setSystemTime(dayTimeToDate('2030-01-15', '10:30'))
    expect(needsLiveSecondTick([item({ startTime: '10:00', endTime: null })], new Date())).toBe(false)
    vi.useRealTimers()
  })

  it('getRemainingMs before start is ms to start', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '09:30'))
    const ms = getRemainingMs(new Date(), item({ startTime: '10:00', endTime: '11:00' }))
    expect(ms).toBe(30 * 60 * 1000)
    vi.useRealTimers()
  })

  it('getRemainingMs during interval is ms to end; null after end', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '10:15'))
    expect(getRemainingMs(new Date(), item({ startTime: '10:00', endTime: '11:00' }))).toBe(45 * 60 * 1000)

    vi.setSystemTime(dayTimeToDate('2030-01-15', '12:00'))
    expect(getRemainingMs(new Date(), item({ startTime: '10:00', endTime: '11:00' }))).toBeNull()

    vi.setSystemTime(dayTimeToDate('2030-01-15', '10:15'))
    expect(getRemainingMs(new Date(), item({ startTime: '10:00', endTime: null }))).toBeNull()

    vi.useRealTimers()
  })

  it('getPlantGrowthFraction toward start and end', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '05:00'))
    expect(getPlantGrowthFraction(new Date(), item({ startTime: '10:00', endTime: '11:00' }))).toBeCloseTo(0.5, 4)

    vi.setSystemTime(dayTimeToDate('2030-01-15', '10:30'))
    expect(getPlantGrowthFraction(new Date(), item({ startTime: '10:00', endTime: '11:00' }))).toBeCloseTo(0.5, 4)

    vi.setSystemTime(dayTimeToDate('2030-01-15', '12:00'))
    expect(getPlantGrowthFraction(new Date(), item({ startTime: '10:00', endTime: '11:00' }))).toBeNull()

    vi.useRealTimers()
  })

  it('isScheduleItemActiveNow only for in-window with end or open interval', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '10:15'))
    expect(isScheduleItemActiveNow(new Date(), item({ startTime: '10:00', endTime: '11:00' }))).toBe(true)
    expect(isScheduleItemActiveNow(new Date(), item({ startTime: '10:00', endTime: null }))).toBe(true)
    vi.setSystemTime(dayTimeToDate('2030-01-15', '09:00'))
    expect(isScheduleItemActiveNow(new Date(), item({ startTime: '10:00', endTime: '11:00' }))).toBe(false)
    vi.useRealTimers()
  })

  it('listActiveCommittedScheduledItems filters day and active', () => {
    vi.useFakeTimers()
    vi.setSystemTime(dayTimeToDate('2030-01-15', '10:15'))
    const list = [
      item({ id: 'a', dayKey: '2030-01-15', startTime: '10:00', endTime: '11:00', committed: true }),
      item({ id: 'b', dayKey: '2030-01-15', startTime: '10:00', endTime: '10:45', committed: true }),
      item({ id: 'c', dayKey: '2030-01-15', startTime: '14:00', endTime: '15:00', committed: true }),
      item({ id: 'd', dayKey: '2030-01-16', startTime: '10:00', endTime: '11:00', committed: true }),
      item({ id: 'e', dayKey: '2030-01-15', startTime: '10:00', endTime: '11:00', committed: false })
    ]
    const active = listActiveCommittedScheduledItems(new Date(), list, '2030-01-15')
    expect(active.map((x) => x.id).sort()).toEqual(['a', 'b'])
    vi.useRealTimers()
  })
})
