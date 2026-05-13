import type { ScheduledItem } from './appData'

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

export function needsLiveSecondTick(todayCommittedItems: ScheduledItem[], now: Date): boolean {
  return todayCommittedItems.some((item) => getStickyLive(now, item).showCountdown)
}
