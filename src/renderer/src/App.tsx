import type { ScheduledItem } from './domain/appData'
import {
  parseAppData,
  serializeAppData,
  defaultAppData,
  todayKey,
  type NoteBlock,
  type AppDataV1
} from './domain/appData'
import { ScheduleStickySection } from './components/ScheduleStickySection'
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
    <header className="toolbar strip-toolbar app-drag">
      <span className="toolbar-title strip-toolbar-brand">Schedule · {subtitle}</span>
      <label className="toolbar-check app-no-drag">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => void onPinnedChange(e.target.checked)}
        />
        <span>置顶</span>
      </label>
      <button type="button" className="btn-icon-soft app-no-drag" title="收起窗口" onClick={onClose}>
        −
      </button>
    </header>
  )
}

function MemoStickySection({
  blocks,
  setBlocks
}: {
  blocks: NoteBlock[]
  setBlocks: (fn: (prev: NoteBlock[]) => NoteBlock[]) => void
}): ReactElement {
  return (
    <section className="sticky-board memo-board">
      <h2 className="sticky-board-heading">纸片备忘</h2>
      <div className="memo-stack">
        {blocks.map((b, idx) => {
          const skew = idx % 2 === 0 ? 'sticky-slot--skewL' : 'sticky-slot--skewR'
          return (
            <div className={`sticky-slot ${skew}`} key={b.id}>
              <article className="sticky-note sticky-note--sheet memo-block app-no-drag">
                <div className="sticky-note-accent memo-accent" aria-hidden />
                <label className="memo-title-wrap">
                  <span className="sr-only">版块标题</span>
                  <input
                    className="memo-title-input"
                    value={b.title}
                    placeholder="这一块叫什么"
                    onChange={(e) =>
                      setBlocks((prev) =>
                        prev.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x))
                      )
                    }
                  />
                </label>
                <textarea
                  className="memo-body"
                  aria-label={`${b.title} 正文`}
                  value={b.body}
                  placeholder="随手写两句……"
                  onChange={(e) =>
                    setBlocks((prev) =>
                      prev.map((x) => (x.id === b.id ? { ...x, body: e.target.value } : x))
                    )
                  }
                />
              </article>
            </div>
          )
        })}
      </div>
      <div className="memo-toolbar app-no-drag">
        <button
          type="button"
          className="btn-mini btn-mini-secondary"
          onClick={() =>
            setBlocks((prev) => [...prev, { id: crypto.randomUUID(), title: `备忘 ${prev.length + 1}`, body: '' }])
          }
        >
          + 另一张纸
        </button>
        {blocks.length > 1 ? (
          <button type="button" className="btn-mini btn-mini-ghost" onClick={() => setBlocks((prev) => prev.slice(0, -1))}>
            去掉上一张
          </button>
        ) : null}
      </div>
    </section>
  )
}

export default function App(): ReactElement {
  const [, bumpClock] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => {
      bumpClock((n) => n + 1)
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

  const dateLabel = `${day.slice(0, 4)}年 ${day.slice(5, 7)}月 ${day.slice(8, 10)}日`

  const onPinnedChange = useCallback(async (next: boolean) => {
    setPinned(next)
    await window.desktop.setAlwaysOnTop(next)
  }, [])

  if (!ready) {
    return (
      <div className="content-pad app-corkboard">
        <p className="muted">载入中…</p>
      </div>
    )
  }

  return (
    <div className="app-shell app-corkboard">
      <Toolbar
        pinned={pinned}
        onPinnedChange={onPinnedChange}
        onClose={() => void window.desktop.closeWindow()}
        subtitle={dateLabel}
      />
      <main className="content-pad cork-scroll">
        <p className="cork-banner app-no-drag">拖边角改大小 · 勾选置顶 · 「贴上来」后先草稿，保存成便签</p>
        <ScheduleStickySection day={day} items={data.scheduledItems} setItems={setItems} />
        <MemoStickySection blocks={data.noteBlocks} setBlocks={setBlocks} />
      </main>
    </div>
  )
}
