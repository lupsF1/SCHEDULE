import type { ScheduledItem } from './domain/appData'
import {
  parseAppData,
  serializeAppData,
  sortItemsByStart,
  defaultAppData,
  todayKey,
  type NoteBlock,
  type AppDataV1
} from './domain/appData'
import { useCallback, useEffect, useState, type ReactElement } from 'react'

function Toolbar({
  pinned,
  onPinnedChange,
  onClose,
  subtitle
}: {
  pinned: boolean
  onPinnedChange: (v: boolean) => void
  onClose: () => void
  subtitle: string
}): ReactElement {
  return (
    <header className="toolbar app-drag">
      <span className="toolbar-title">Schedule · {subtitle}</span>
      <label className="checkbox-row app-no-drag">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => void onPinnedChange(e.target.checked)}
        />
        <span>置顶</span>
      </label>
      <button type="button" className="icon-btn-toolbar app-no-drag" title="隐藏窗口" onClick={onClose}>
        &#8212;
      </button>
    </header>
  )
}

function ScheduleRows({
  day,
  items,
  setItems,
  onAddItem
}: {
  day: string
  items: ScheduledItem[]
  setItems: (fn: (prev: ScheduledItem[]) => ScheduledItem[]) => void
  onAddItem: (
    draft: Omit<ScheduledItem, 'id' | 'dayKey'>
  ) => void
}): ReactElement {
  const todayItems = sortItemsByStart(items.filter((i) => i.dayKey === day))

  const [draftTitle, setDraftTitle] = useState('')
  const [draftStart, setDraftStart] = useState('10:00')
  const [draftEnd, setDraftEnd] = useState<string>('')

  const updateItem = useCallback(
    (id: string, patch: Partial<ScheduledItem>) => {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    },
    [setItems]
  )

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((x) => x.id !== id))
    },
    [setItems]
  )

  const add = useCallback(() => {
    onAddItem({
      title: draftTitle.trim() || '未命名',
      startTime: draftStart,
      endTime: draftEnd.trim() ? draftEnd : null
    })
    setDraftTitle('')
    setDraftEnd('')
  }, [draftTitle, draftStart, draftEnd, onAddItem])

  return (
    <section className="surface scroll-y">
      <div className="label-caps">今日时间线</div>
      {todayItems.length === 0 ? (
        <div className="empty">还没有安排——在下方表单添加第一段。</div>
      ) : (
        todayItems.map((row) => (
          <div className="item-row app-no-drag" key={row.id}>
            <input
              aria-label={`${row.title} 开始`}
              type="time"
              className="input"
              style={{ padding: '6px', minHeight: '36px', fontVariantNumeric: 'tabular-nums' }}
              value={row.startTime}
              onChange={(e) => updateItem(row.id, { startTime: e.target.value })}
            />
            <input
              aria-label={`${row.title} 结束`}
              type="time"
              className="input"
              style={{ padding: '6px', minHeight: '36px', fontVariantNumeric: 'tabular-nums' }}
              value={row.endTime ?? ''}
              onChange={(e) =>
                updateItem(row.id, { endTime: e.target.value ? e.target.value : null })
              }
            />
            <input
              className="input"
              aria-label={`${row.startTime} 标题`}
              value={row.title}
              onChange={(e) => updateItem(row.id, { title: e.target.value })}
            />
            <button type="button" className="btn btn-secondary" onClick={() => removeItem(row.id)}>
              删除
            </button>
          </div>
        ))
      )}
      <div style={{ marginTop: 12 }}>
        <div className="label-caps">添加条目</div>
        <div className="item-row">
          <input
            aria-label="新事项开始时间"
            type="time"
            className="input"
            style={{ padding: '6px', minHeight: '36px' }}
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
          />
          <input
            aria-label="新事项结束（可选）"
            type="time"
            className="input"
            style={{ padding: '6px', minHeight: '36px' }}
            value={draftEnd}
            onChange={(e) => setDraftEnd(e.target.value)}
          />
          <input
            className="input"
            placeholder="标题（如：例会 / 深度学习）"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add()
            }}
          />
          <button type="button" className="btn btn-primary" onClick={add}>
            添加
          </button>
        </div>
      </div>
    </section>
  )
}

function NoteBlocksSection({
  blocks,
  setBlocks
}: {
  blocks: NoteBlock[]
  setBlocks: (fn: (prev: NoteBlock[]) => NoteBlock[]) => void
}): ReactElement {
  return (
    <section className="surface scroll-y">
      <div className="label-caps">可编辑版块</div>
      {blocks.map((b) => (
        <div key={b.id} style={{ marginBottom: 16 }}>
          <input
            className="input note-card-title"
            value={b.title}
            onChange={(e) =>
              setBlocks((prev) => prev.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x)))
            }
          />
          <textarea
            className="textarea"
            aria-label={`版块 ${b.title} 正文`}
            value={b.body}
            onChange={(e) =>
              setBlocks((prev) => prev.map((x) => (x.id === b.id ? { ...x, body: e.target.value } : x)))
            }
          />
        </div>
      ))}
      <div className="row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            setBlocks((prev) => [
              ...prev,
              { id: crypto.randomUUID(), title: `版块 ${prev.length + 1}`, body: '' }
            ])
          }
        >
          + 版块
        </button>
        {blocks.length > 1 ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setBlocks((prev) => prev.slice(0, -1))}
          >
            移除最后一个版块
          </button>
        ) : null}
      </div>
    </section>
  )
}

export default function App(): ReactElement {
  const [, setMinuteTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => {
      setMinuteTick((n) => n + 1)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const day = todayKey()
  const [data, setData] = useState<AppDataV1>(() => defaultAppData())
  const [ready, setReady] = useState(false)
  const [pinned, setPinned] = useState(true)

  useEffect(() => {
    ;(async () => {
      const raw = await window.desktop.loadState()
      setData(parseAppData(raw))
      const top = await window.desktop.getAlwaysOnTop().catch(() => true)
      setPinned(top)
      setReady(true)
    })().catch(console.error)
  }, [])

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      void window.desktop.saveState(serializeAppData(data)).catch(console.error)
    }, 420)
    return () => clearTimeout(timer)
  }, [data, ready])

  const setItems = useCallback((fn: (prev: ScheduledItem[]) => ScheduledItem[]) => {
    setData((d) => ({ ...d, scheduledItems: fn(d.scheduledItems) }))
  }, [])

  const setBlocks = useCallback((fn: (prev: NoteBlock[]) => NoteBlock[]) => {
    setData((d) => ({ ...d, noteBlocks: fn(d.noteBlocks) }))
  }, [])

  const handleAddScheduled = useCallback(
    (draft: Omit<ScheduledItem, 'id' | 'dayKey'>) => {
      setItems((prev) => [...prev, { id: crypto.randomUUID(), dayKey: todayKey(), ...draft }])
    },
    [setItems]
  )

  const dateLabel = `${day.slice(0, 4)}年 ${day.slice(5, 7)}月 ${day.slice(8, 10)}日`

  const onPinnedChange = useCallback(async (next: boolean) => {
    setPinned(next)
    await window.desktop.setAlwaysOnTop(next)
  }, [])

  if (!ready) {
    return (
      <div className="content-pad">
        <p className="muted">载入中…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Toolbar
        pinned={pinned}
        onPinnedChange={onPinnedChange}
        onClose={() => void window.desktop.closeWindow()}
        subtitle={dateLabel}
      />
      <main className="content-pad scroll-y">
        <p className="muted" style={{ margin: 0 }}>
          拖拽窗口边角调整大小 · 勾选「置顶」保持在其他窗口之上 · 条目按开始时间排序
        </p>
        <ScheduleRows
          day={day}
          items={data.scheduledItems}
          setItems={setItems}
          onAddItem={handleAddScheduled}
        />
        <NoteBlocksSection blocks={data.noteBlocks} setBlocks={setBlocks} />
      </main>
    </div>
  )
}
