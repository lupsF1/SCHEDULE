/** Threshold for persisting totals and showing celebration (ms). */
export const MIN_FOCUS_SESSION_CELEBRATION_MS = 3000

export function formatFocusSessionCn(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m > 0 && r > 0) return `${m} 分 ${r} 秒`
  if (m > 0) return `${m} 分钟`
  return `${r} 秒`
}

/** Accumulated totals copy (minutes-heavy, as in 「累计 Xm」). */
export function formatFocusAccumulatedCn(ms: number): string {
  const mTotal = Math.floor(ms / 60000)
  if (mTotal < 1) return `${Math.max(0, Math.ceil(ms / 1000))} 秒`
  if (mTotal < 60) return `${mTotal} 分钟`
  const h = Math.floor(mTotal / 60)
  const mm = mTotal % 60
  return mm > 0 ? `${h} 小时 ${mm} 分` : `${h} 小时`
}
