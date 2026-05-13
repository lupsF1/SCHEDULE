import type { ScheduledItem } from '../domain/appData'
import { sortItemsByStart } from '../domain/appData'
import { getStickyLive } from '../domain/scheduleTime'
import { useScheduleLiveClock } from '../hooks/useScheduleLiveClock'
import { useCallback, useEffect, useState, type ReactElement } from 'react'

function StickyScheduleEditor({
  item,
  isDraft,
  onSave,
  onCancel
}: {
  item: ScheduledItem
  isDraft: boolean
  onSave: (patch: Pick<ScheduledItem, 'title' | 'startTime' | 'endTime' | 'committed'>) => void
  onCancel: () => void
}): ReactElement {
  const [title, setTitle] = useState(item.title)
  const [start, setStart] = useState(item.startTime)
  const [end, setEnd] = useState(item.endTime ?? '')

  useEffect(() => {
    setTitle(item.title)
    setStart(item.startTime)
    setEnd(item.endTime ?? '')
  }, [item.id, item.title, item.startTime, item.endTime])

  const save = useCallback(() => {
    onSave({
      title: title.trim() || '未命名',
      startTime: start,
      endTime: end.trim() ? end : null,
      committed: true
    })
  }, [title, start, end, onSave])

  return (
    <article className="sticky-editor app-no-drag" aria-label={isDraft ? '新便签草稿' : '编辑便签'}>
      <div className="sticky-editor-grid">
        <label className="sticky-field">
          <span className="sticky-field-label">开始</span>
          <input
            type="time"
            className="sticky-input-time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="sticky-field">
          <span className="sticky-field-label">结束</span>
          <input
            type="time"
            className="sticky-input-time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <label className="sticky-field sticky-field-full">
        <span className="sticky-field-label">标题</span>
        <input
          className="sticky-input-title"
          value={title}
          placeholder="写什么？"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              save()
            }
          }}
        />
      </label>
      <div className="sticky-editor-actions">
        <button type="button" className="btn-mini btn-mini-primary" onClick={save}>
          保存
        </button>
        <button type="button" className="btn-mini btn-mini-ghost" onClick={onCancel}>
          {isDraft ? '取消草稿' : '取消'}
        </button>
      </div>
    </article>
  )
}

function StickyScheduleCard({
  item,
  now,
  onEdit,
  onRemove
}: {
  item: ScheduledItem
  now: Date
  onEdit: () => void
  onRemove: () => void
}): ReactElement {
  const live = getStickyLive(now, item)
  const endPart = item.endTime ? `\u2003–\u2003${item.endTime}` : ''
  const timeBand = `${item.startTime}${endPart}`

  return (
    <article
      className={`sticky-note sticky-note--${live.stripe} app-no-drag`}
      aria-label={`便签 ${item.title}`}
    >
      <div className="sticky-note-accent" aria-hidden />
      <div className="sticky-note-timeband">{timeBand}</div>
      <h2 className="sticky-note-title">{item.title}</h2>
      <p className="sticky-note-line">{live.line}</p>
      {live.showCountdown ? (
        <div className="sticky-note-countdown" aria-live="polite">
          {live.countdownText}
        </div>
      ) : null}
      <div className="sticky-note-actions">
        <button type="button" className="btn-icon" title="编辑" onClick={onEdit}>
          编
        </button>
        <button type="button" className="btn-icon btn-icon-danger" title="删除" onClick={onRemove}>
          删
        </button>
      </div>
    </article>
  )
}

export function ScheduleStickySection({
  day,
  items,
  setItems
}: {
  day: string
  items: ScheduledItem[]
  setItems: (fn: (prev: ScheduledItem[]) => ScheduledItem[]) => void
}): ReactElement {
  const todayItems = sortItemsByStart(items.filter((i) => i.dayKey === day))

  const committedForClock = todayItems.filter((i) => i.committed !== false)
  useScheduleLiveClock(committedForClock)

  const [draftStart, setDraftStart] = useState('10:00')
  const [draftEnd, setDraftEnd] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const now = new Date()

  const updateItem = useCallback(
    (id: string, patch: Partial<ScheduledItem>) => {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    },
    [setItems]
  )

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((x) => x.id !== id))
      setEditingId((e) => (e === id ? null : e))
    },
    [setItems]
  )

  const startDraftFromComposer = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        dayKey: day,
        title: draftTitle.trim() || '未命名',
        startTime: draftStart,
        endTime: draftEnd.trim() ? draftEnd : null,
        committed: false
      }
    ])
    setDraftTitle('')
    setDraftEnd('')
  }, [draftEnd, draftStart, draftTitle, day, setItems])

  return (
    <section className="sticky-board">
      <h2 className="sticky-board-heading">此刻安排</h2>
      <div className="sticky-notes-stack">
        {todayItems.length === 0 ? (
          <p className="sticky-board-hint">下面贴一张新备忘，保存后会变成便签视图。</p>
        ) : null}
        {todayItems.map((row, index) => {
          const skew = index % 2 === 0 ? 'sticky-slot--skewL' : 'sticky-slot--skewR'
          const showEditor = editingId === row.id || row.committed === false

          return (
            <div className={`sticky-slot ${skew}`} key={row.id}>
              {showEditor ? (
                <StickyScheduleEditor
                  item={row}
                  isDraft={row.committed === false}
                  onSave={(patch) => {
                    updateItem(row.id, patch)
                    setEditingId(null)
                  }}
                  onCancel={() => {
                    if (row.committed === false) removeItem(row.id)
                    else setEditingId(null)
                  }}
                />
              ) : (
                <StickyScheduleCard
                  item={row}
                  now={now}
                  onEdit={() => setEditingId(row.id)}
                  onRemove={() => removeItem(row.id)}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="sticky-composer sticky-note sticky-note--sheet app-no-drag">
        <span className="sticky-composer-caption">再加一张</span>
        <div className="sticky-editor-grid">
          <input
            type="time"
            className="sticky-input-time"
            aria-label="新条目的开始时间"
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
          />
          <input
            type="time"
            className="sticky-input-time"
            aria-label="新条目的结束时间（可选）"
            value={draftEnd}
            onChange={(e) => setDraftEnd(e.target.value)}
          />
        </div>
        <input
          className="sticky-input-title"
          placeholder="标题……"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') startDraftFromComposer()
          }}
        />
        <button type="button" className="btn-mini btn-mini-primary sticky-composer-btn" onClick={startDraftFromComposer}>
          贴上来
        </button>
      </div>
    </section>
  )
}
