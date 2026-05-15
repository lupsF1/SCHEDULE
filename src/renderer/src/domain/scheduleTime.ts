import { sortItemsByStart, timeToMinutes, type ScheduledItem } from './appData'

export function dayTimeToDate(dayKey: string, hhmm: string): Date {
  const [ys = '0', mos = '0', ds = '0'] = dayKey.split('-')
  const [hs = '0', mins = '0'] = hhmm.split(':')
  return new Date(
    Number(ys),
    Number(mos) - 1,
    Number(ds),
    Number(hs),
    Number(mins),
    0,
    0
  )
}

export type StickyStripeKind = 'upcoming' | 'soon' | 'active' | 'past'

function formatElapsedPhrase(ms: number): string {
  const mm = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(mm / 60)
  const m = mm % 60
  if (h > 0 && m > 0) return `${h} 小时 ${m} 分`
  if (h > 0) return `${h} 小时`
  return `${Math.max(m, 0)} 分钟`
}

function formatRemainingPhrase(ms: number): string {
  if (ms <= 0) return '即将结束'
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `剩余 ${h} 小时 ${String(m).padStart(2, '0')} 分`
  if (m > 0) return `剩余 ${m} 分 ${String(s).padStart(2, '0')} 秒`
  return `剩余 ${s} 秒`
}

function formatUntilStartPhrase(ms: number): string {
  if (ms <= 60000) return '即将开始'
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  if (h > 0) return `距离开始还有 ${h} 小时 ${m} 分钟`
  if (m > 0) return `距离开始还有 ${m} 分钟`
  return '即将开始'
}

export function formatHMS(ms: number): string {
  const clamped = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(clamped / 3600)
  const m = Math.floor((clamped % 3600) / 60)
  const s = clamped % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export type StickyLive = {
  stripe: StickyStripeKind
  line: string
  /** True when countdown block should animate every second */
  showCountdown: boolean
  countdownText: string
}

const TEN_MS = 10 * 60 * 1000

/** Card display for committed items relative to ``now``. */
export function getStickyLive(now: Date, item: ScheduledItem): StickyLive {
  const nowMs = now.getTime()
  const startMs = dayTimeToDate(item.dayKey, item.startTime).getTime()
  const endMs = item.endTime ? dayTimeToDate(item.dayKey, item.endTime).getTime() : null

  if (endMs !== null && nowMs >= endMs) {
    return { stripe: 'past', line: '已结束', showCountdown: false, countdownText: '' }
  }

  if (nowMs < startMs) {
    const left = startMs - nowMs
    const minutesUntil = left / 60000
    const stripe: StickyStripeKind = minutesUntil <= 30 ? 'soon' : 'upcoming'
    const showCountdown = left <= TEN_MS
    return {
      stripe,
      line: formatUntilStartPhrase(left),
      showCountdown,
      countdownText: formatHMS(left)
    }
  }

  if (endMs !== null && nowMs >= startMs && nowMs < endMs) {
    const left = endMs - nowMs
    const showCountdown = left <= TEN_MS
    return {
      stripe: 'active',
      line: `进行中 · ${formatRemainingPhrase(left)}`,
      showCountdown,
      countdownText: formatHMS(left)
    }
  }

  if (endMs === null && nowMs >= startMs) {
    const elapsed = nowMs - startMs
    return {
      stripe: 'active',
      line: `进行中 · 已进行 ${formatElapsedPhrase(elapsed)}`,
      showCountdown: false,
      countdownText: ''
    }
  }

  return { stripe: 'past', line: '已结束', showCountdown: false, countdownText: '' }
}

/** Milliseconds until the next ticking deadline — start time (before begin) or end time (during interval). */
export function getRemainingMs(now: Date, item: ScheduledItem): number | null {
  const nowMs = now.getTime()
  const startMs = dayTimeToDate(item.dayKey, item.startTime).getTime()
  const endMs = item.endTime ? dayTimeToDate(item.dayKey, item.endTime).getTime() : null

  if (endMs !== null && nowMs >= endMs) return null

  if (nowMs < startMs) return startMs - nowMs

  if (endMs !== null && nowMs >= startMs && nowMs < endMs) return endMs - nowMs

  return null
}

/** True when any committed item shows the circular HMS clock (same as remainMs &gt; 0). */
export function needsLiveSecondTick(todayCommittedItems: ScheduledItem[], now: Date): boolean {
  return todayCommittedItems.some((item) => {
    const ms = getRemainingMs(now, item)
    return ms != null && ms > 0
  })
}

/**
 * Relative growth toward the current ticking deadline — 开满时为 1（与环形倒计时对齐）。
 * 等待开始：自当日 00:00 起至正式开始；进行中：自开始到结束。
 */
export function getPlantGrowthFraction(now: Date, item: ScheduledItem): number | null {
  if (getRemainingMs(now, item) == null) return null

  const nowMs = now.getTime()
  const startMs = dayTimeToDate(item.dayKey, item.startTime).getTime()
  const endMs = item.endTime ? dayTimeToDate(item.dayKey, item.endTime).getTime() : null
  const dayStartMs = dayTimeToDate(item.dayKey, '00:00').getTime()

  if (nowMs < startMs) {
    const span = Math.max(1, startMs - dayStartMs)
    return clamp01((nowMs - dayStartMs) / span)
  }

  if (endMs != null && nowMs >= startMs && nowMs < endMs) {
    const span = Math.max(1, endMs - startMs)
    return clamp01((nowMs - startMs) / span)
  }

  // 无 endTime 但已开始：用 4 小时作为默认生长周期
  if (endMs == null && nowMs >= startMs) {
    const span = 14_400_000 // 4 hours
    return clamp01((nowMs - startMs) / span)
  }

  return null
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/** 当前是否处于条目时间窗内的「进行中」状态（专注沉浸式等） */
export function isScheduleItemActiveNow(now: Date, item: ScheduledItem): boolean {
  return getStickyLive(now, item).stripe === 'active'
}

/** 当日已提交且正在进行中的条目（可用于专注重叠选择）。 */
export function listActiveCommittedScheduledItems(
  now: Date,
  items: ScheduledItem[],
  dayKey: string
): ScheduledItem[] {
  return sortItemsByStart(
    items.filter((i) => i.dayKey === dayKey && i.committed !== false && isScheduleItemActiveNow(now, i))
  )
}

export function sortItemsByUrgency(items: ScheduledItem[], now: Date): ScheduledItem[] {
  const priority = (item: ScheduledItem): number => {
    const live = getStickyLive(now, item)
    switch (live.stripe) {
      case 'active':
        return 0
      case 'soon':
        return 1
      case 'upcoming':
        return 2
      case 'past':
        return 3
    }
  }
  return [...items].sort((a, b) => {
    const pa = priority(a)
    const pb = priority(b)
    if (pa !== pb) return pa - pb
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })
}

export function getInstantPlantGrowthFraction(
  now: Date,
  sessionStartMs: number,
  durationMs: number = 3_600_000
): number {
  const elapsed = now.getTime() - sessionStartMs
  return Math.min(1, elapsed / durationMs)
}
