/** Matches DESIGN.md — visual tokens applied via CSS variables in main.css */

export type ScheduledItem = {
  id: string
  dayKey: string
  title: string
  startTime: string
  endTime: string | null
  /** Saved as sticky card UI; drafts use false until user clicks Save */
  committed?: boolean
  /** 提前提醒分钟数，0 = 准时，默认 1 */
  reminderAdvance?: number
}

/** 立即专注会话（独立于日程卡片的时间段） */
export type FocusSession = {
  itemId: string
  startMs: number
  durationMs: number
}

export type NoteBlock = {
  id: string
  title: string
  body: string
  /** Calendar day (yyyy-mm-dd) when the note was last edited / saved. */
  savedDayKey?: string
}

export type AppDataV1 = {
  version: 1
  scheduledItems: ScheduledItem[]
  noteBlocks: NoteBlock[]
  /** Cumulative focused session time per schedule item id (ms). Optional for legacy payloads. */
  focusTotalsMsByItemId?: Record<string, number>
}

export function todayKey(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatNoteSavedDayLabel(dayKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return dayKey
  return `${dayKey.slice(0, 4)}年 ${dayKey.slice(5, 7)}月 ${dayKey.slice(8, 10)}日`
}

export function defaultAppData(): AppDataV1 {
  const day = todayKey()
  return {
    version: 1,
    focusTotalsMsByItemId: {},
    scheduledItems: [
      {
        id: crypto.randomUUID(),
        dayKey: day,
        title: '示例：晨会准备',
        startTime: '09:00',
        endTime: '09:30',
        committed: true
      }
    ],
    noteBlocks: [
      {
        id: crypto.randomUUID(),
        title: '随手记',
        body: ''
      }
    ]
  }
}

export function timeToMinutes(t: string): number {
  const [h = '0', m = '0'] = t.split(':')
  return Number.parseInt(h, 10) * 60 + Number.parseInt(m, 10)
}

export function sortItemsByStart(items: ScheduledItem[]): ScheduledItem[] {
  return [...items].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

export function parseAppData(raw: string | null): AppDataV1 {
  if (!raw?.trim()) return defaultAppData()
  try {
    const o = JSON.parse(raw) as Partial<AppDataV1>
    if (o.version !== 1 || !Array.isArray(o.scheduledItems) || !Array.isArray(o.noteBlocks)) {
      return defaultAppData()
    }
    const base = {
      version: 1 as const,
      scheduledItems: o.scheduledItems.map(normalizeScheduledItem),
      noteBlocks: o.noteBlocks.map(normalizeNoteBlock)
    }
    const extras = normalizeFocusTotalsField(o.focusTotalsMsByItemId)
    return { ...base, ...extras }
  } catch {
    return defaultAppData()
  }
}

function normalizeFocusTotalsField(
  raw: unknown
): { focusTotalsMsByItemId: Record<string, number> } | Record<string, never> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n =
      typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : null
    if (n !== null && n > 0) out[k] = n
  }
  return Object.keys(out).length ? { focusTotalsMsByItemId: out } : {}
}

function normalizeScheduledItem(x: ScheduledItem): ScheduledItem {
  const committed =
    typeof x.committed === 'boolean'
      ? x.committed
      : true /* legacy payloads without flag */

  return {
    id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
    dayKey: typeof x.dayKey === 'string' ? x.dayKey : todayKey(),
    title: typeof x.title === 'string' ? x.title : '',
    startTime: typeof x.startTime === 'string' ? x.startTime : '09:00',
    endTime: typeof x.endTime === 'string' || x.endTime === null ? x.endTime : null,
    ...(committed !== true ? { committed } : {})
  }
}

function normalizeNoteBlock(x: NoteBlock): NoteBlock {
  const savedDayKey =
    typeof x.savedDayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.savedDayKey)
      ? x.savedDayKey
      : undefined
  const base: NoteBlock = {
    id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
    title: typeof x.title === 'string' ? x.title : '',
    body: typeof x.body === 'string' ? x.body : ''
  }
  return savedDayKey !== undefined ? { ...base, savedDayKey } : base
}

export function serializeAppData(data: AppDataV1): string {
  return JSON.stringify(
    {
      version: data.version,
      scheduledItems: data.scheduledItems,
      noteBlocks: data.noteBlocks,
      focusTotalsMsByItemId: data.focusTotalsMsByItemId ?? {}
    },
    null,
    2
  )
}
