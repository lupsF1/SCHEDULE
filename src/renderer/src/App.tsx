import type { ScheduledItem } from './domain/appData'
import {
  parseAppData,
  serializeAppData,
  defaultAppData,
  todayKey,
  formatNoteSavedDayLabel,
  type NoteBlock,
  type AppDataV1
} from './domain/appData'
import type { MdiPanelState } from './domain/mdiTypes'
import { ScheduleStickySection } from './components/ScheduleStickySection'
import { FocusMdiWorkspace } from './components/FocusMdiWorkspace'
import { FocusCelebrationOverlay, type FocusCelebrationSnapshot } from './components/FocusCelebrationOverlay'
import { MIN_FOCUS_SESSION_CELEBRATION_MS } from './domain/focusStats'
import { useWindowResizeBump } from './hooks/useWindowResizeBump'
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'

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
    <header className="strip-toolbar app-no-drag">
      <div className="strip-toolbar-drag app-drag" title="此处拖动窗口">
        <span className="toolbar-title strip-toolbar-brand">Schedule · {subtitle}</span>
      </div>
      <div className="strip-toolbar-controls">
        <label className="toolbar-check">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => void onPinnedChange(e.target.checked)}
          />
          <span>置顶</span>
        </label>
        <button type="button" className="btn-icon-soft strip-toolbar-close" title="收起窗口" onClick={onClose}>
          −
        </button>
      </div>
    </header>
  )
}

function MemoStickySection({
  day,
  blocks,
  setBlocks
}: {
  day: string
  blocks: NoteBlock[]
  setBlocks: (fn: (prev: NoteBlock[]) => NoteBlock[]) => void
}): ReactElement {
  return (
    <section className="sticky-board memo-board app-no-drag">
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
                        prev.map((x) =>
                          x.id === b.id
                            ? { ...x, title: e.target.value, savedDayKey: day }
                            : x
                        )
                      )
                    }
                  />
                </label>
                {b.savedDayKey ? (
                  <p className="memo-saved-date" aria-live="polite">
                    记下于 {formatNoteSavedDayLabel(b.savedDayKey)}
                  </p>
                ) : null}
                <textarea
                  className="memo-body"
                  aria-label={`${b.title} 正文`}
                  value={b.body}
                  placeholder="随手写两句……"
                  onChange={(e) =>
                    setBlocks((prev) =>
                      prev.map((x) =>
                        x.id === b.id ? { ...x, body: e.target.value, savedDayKey: day } : x
                      )
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
  const layoutBump = useWindowResizeBump()
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
  const [focusImmersiveItemId, setFocusImmersiveItemId] = useState<string | null>(null)
  const [focusPlantNonce, setFocusPlantNonce] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<FocusCelebrationSnapshot | null>(null)
  const sessionStartMsRef = useRef<number | null>(null)
  const [mdiPanels, setMdiPanels] = useState<MdiPanelState[]>([])
  const [mdiZCounter, setMdiZCounter] = useState(100)

  useEffect(() => {
    if (focusImmersiveItemId === null) {
      setFocusPlantNonce(null)
    } else {
      setFocusPlantNonce(crypto.randomUUID())
    }
  }, [focusImmersiveItemId])

  useEffect(() => {
    if (focusImmersiveItemId && focusPlantNonce) {
      sessionStartMsRef.current = Date.now()
      return
    }
    sessionStartMsRef.current = null
  }, [focusImmersiveItemId, focusPlantNonce])

  // Clear MDI panels when exiting focus mode
  useEffect(() => {
    if (focusImmersiveItemId === null) {
      setMdiPanels([])
      setMdiZCounter(100)
    }
  }, [focusImmersiveItemId])

  const bringToFront = useCallback((panelId: string) => {
    setMdiZCounter((z) => {
      const nextZ = z + 1
      setMdiPanels((prev) =>
        prev.map((p) => (p.id === panelId ? { ...p, z: nextZ } : p))
      )
      return nextZ
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('focus-immersive', Boolean(focusImmersiveItemId))
    document.body.classList.toggle('focus-immersive', Boolean(focusImmersiveItemId))
    return () => {
      document.documentElement.classList.remove('focus-immersive')
      document.body.classList.remove('focus-immersive')
    }
  }, [focusImmersiveItemId])

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

  useEffect(() => {
    if (!focusImmersiveItemId) return
    const exists = data.scheduledItems.some((i) => i.id === focusImmersiveItemId)
    if (!exists) {
      setCelebration(null)
      setFocusImmersiveItemId(null)
    }
  }, [data.scheduledItems, focusImmersiveItemId])

  const dismissCelebrationAndExitFocus = useCallback(() => {
    setCelebration(null)
    setFocusImmersiveItemId(null)
  }, [])

  const applyFocusImmersiveChange = useCallback(
    (nextId: string | null) => {
      if (nextId === null && celebration) {
        dismissCelebrationAndExitFocus()
        return
      }
      if (nextId === null && focusImmersiveItemId) {
        const itemId = focusImmersiveItemId
        const nonce = focusPlantNonce
        const started = sessionStartMsRef.current
        const elapsed = started != null ? Date.now() - started : 0
        if (elapsed >= MIN_FOCUS_SESSION_CELEBRATION_MS && nonce) {
          const row = data.scheduledItems.find((i) => i.id === itemId)
          const dayKey = row?.dayKey ?? day
          const prevTotal = data.focusTotalsMsByItemId?.[itemId] ?? 0
          const cumulativeMs = prevTotal + elapsed
          setData((d) => ({
            ...d,
            focusTotalsMsByItemId: {
              ...(d.focusTotalsMsByItemId ?? {}),
              [itemId]: (d.focusTotalsMsByItemId?.[itemId] ?? 0) + elapsed
            }
          }))
          setCelebration({
            itemId,
            dayKey,
            nonce,
            sessionMs: elapsed,
            cumulativeMs
          })
          /** Keep immersive shell until the user closes the overlay. */
          return
        }
      }
      setFocusImmersiveItemId(nextId)
    },
    [
      celebration,
      data.focusTotalsMsByItemId,
      data.scheduledItems,
      day,
      dismissCelebrationAndExitFocus,
      focusImmersiveItemId,
      focusPlantNonce
    ]
  )

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

  const focusImmersive = focusImmersiveItemId !== null

  const totals = data.focusTotalsMsByItemId ?? {}

  const focusedItem = focusImmersiveItemId
    ? data.scheduledItems.find((i) => i.id === focusImmersiveItemId) ?? null
    : null
  const otherItems = focusImmersiveItemId
    ? data.scheduledItems.filter((i) => i.id !== focusImmersiveItemId)
    : data.scheduledItems

  return (
    <div className={`app-shell app-corkboard${focusImmersive ? ' app-shell--focusImmersive' : ''}`}>
      {!focusImmersive ? (
        <>
          <Toolbar
            pinned={pinned}
            onPinnedChange={onPinnedChange}
            onClose={() => void window.desktop.closeWindow()}
            subtitle={dateLabel}
          />
          <div
            className="window-drag-gutter app-drag"
            title="此处拖动窗口"
            aria-hidden
          />
        </>
      ) : null}
      <main
        className={`content-pad cork-scroll${focusImmersive ? ' content-pad--focusImmersive cork-scroll--focusImmersive' : ' content-pad--with-drag-shim'}`}
      >
        {!focusImmersive ? (
          <>
            <div className="window-drag-shim app-drag" aria-hidden />
            <div className="app-main-content app-no-drag">
              <p className="cork-banner app-no-drag">
                拖拽窗口外边沿缩放 · 顶栏拖动移动 · 「贴上来」后先草稿，保存成便签
              </p>
              <ScheduleStickySection
                day={day}
                items={data.scheduledItems}
                setItems={setItems}
                focusImmersiveItemId={focusImmersiveItemId}
                onFocusImmersiveChange={applyFocusImmersiveChange}
                focusPlantNonce={focusPlantNonce}
                focusTotalsMsByItemId={totals}
                pinned={pinned}
                onPinnedChange={onPinnedChange}
                layoutBump={layoutBump}
              />
              <MemoStickySection day={day} blocks={data.noteBlocks} setBlocks={setBlocks} />
            </div>
          </>
        ) : focusedItem ? (
          <FocusMdiWorkspace
            panels={mdiPanels}
            onPanelsChange={setMdiPanels}
            zCounter={mdiZCounter}
            onBringToFront={bringToFront}
            focusedItem={focusedItem}
            now={new Date()}
            focusPlantNonce={focusPlantNonce}
            focusTotalMs={totals[focusedItem.id] ?? 0}
            pinned={pinned}
            onPinnedChange={onPinnedChange}
            onExitFocus={() => applyFocusImmersiveChange(null)}
            layoutBump={layoutBump}
            otherItems={otherItems}
            memoBlocks={data.noteBlocks}
            onMemoBlocksChange={setBlocks}
            day={day}
          />
        ) : null}
      </main>
      {celebration ? (
        <FocusCelebrationOverlay snapshot={celebration} onDismiss={dismissCelebrationAndExitFocus} />
      ) : null}
    </div>
  )
}
