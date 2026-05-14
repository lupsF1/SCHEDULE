import { useCallback, useEffect, useMemo, useRef, type ReactElement, type ReactNode } from 'react'
import type { MdiPanelState } from '../domain/mdiTypes'
import type { ScheduledItem, NoteBlock } from '../domain/appData'
import { sortItemsByStart } from '../domain/appData'
import { formatFocusAccumulatedCn } from '../domain/focusStats'
import { isScheduleItemActiveNow } from '../domain/scheduleTime'
import { useScheduleLiveClock } from '../hooks/useScheduleLiveClock'
import { FocusImmersiveChrome, StickyScheduleCard } from './ScheduleStickySection'
import { MdiPanel } from './MdiPanel'

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function OtherItemsContent({ items, day }: { items: ScheduledItem[]; day: string }): ReactElement {
  const sorted = sortItemsByStart(items.filter((i) => i.dayKey === day))
  if (sorted.length === 0) {
    return <p className="mdi-empty-hint">今天没有其他事项</p>
  }
  return (
    <ul className="mdi-other-list">
      {sorted.map((item) => {
        const endPart = item.endTime ? ` – ${item.endTime}` : ''
        return (
          <li key={item.id} className="mdi-other-item">
            <span className="mdi-other-time">
              {item.startTime}
              {endPart}
            </span>
            <span className="mdi-other-title">{item.title}</span>
          </li>
        )
      })}
    </ul>
  )
}

function MemoContent({
  blocks,
  setBlocks,
  day
}: {
  blocks: NoteBlock[]
  setBlocks: (fn: (prev: NoteBlock[]) => NoteBlock[]) => void
  day: string
}): ReactElement {
  return (
    <div className="mdi-memo-stack">
      {blocks.map((b) => (
        <div key={b.id} className="mdi-memo-block">
          <input
            className="mdi-memo-title"
            value={b.title}
            placeholder="标题"
            onChange={(e) =>
              setBlocks((prev) =>
                prev.map((x) =>
                  x.id === b.id ? { ...x, title: e.target.value, savedDayKey: day } : x
                )
              )
            }
          />
          <textarea
            className="mdi-memo-body"
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
        </div>
      ))}
      <button
        type="button"
        className="btn-mini btn-mini-secondary"
        onClick={() =>
          setBlocks((prev) => [
            ...prev,
            { id: crypto.randomUUID(), title: `备忘 ${prev.length + 1}`, body: '' }
          ])
        }
      >
        + 新纸片
      </button>
    </div>
  )
}

function StatsContent({
  focusTotalMs,
  item
}: {
  focusTotalMs: number
  item: ScheduledItem
}): ReactElement {
  return (
    <div className="mdi-stats">
      <p className="mdi-stats-label">{item.title}</p>
      <p className="mdi-stats-value">
        {focusTotalMs > 0 ? `累计专注 · ${formatFocusAccumulatedCn(focusTotalMs)}` : '尚未开始专注'}
      </p>
    </div>
  )
}

export function FocusMdiWorkspace({
  panels,
  onPanelsChange,
  zCounter,
  onBringToFront,
  focusedItem,
  focusPlantNonce,
  focusTotalMs,
  pinned,
  onPinnedChange,
  onExitFocus,
  layoutBump,
  otherItems,
  memoBlocks,
  onMemoBlocksChange,
  day,
  instantFocusStartMs
}: {
  panels: MdiPanelState[]
  onPanelsChange: (fn: (prev: MdiPanelState[]) => MdiPanelState[]) => void
  zCounter: number
  onBringToFront: (panelId: string) => void
  focusedItem: ScheduledItem
  focusPlantNonce: string | null
  focusTotalMs: number
  pinned: boolean
  onPinnedChange: (v: boolean) => void
  onExitFocus: () => void
  layoutBump: number
  otherItems: ScheduledItem[]
  memoBlocks: NoteBlock[]
  onMemoBlocksChange: (fn: (prev: NoteBlock[]) => NoteBlock[]) => void
  day: string
  instantFocusStartMs?: number | null
}): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)

  // Live clock: 1-second tick drives countdown and auto-exit detection
  const tick = useScheduleLiveClock([focusedItem])
  const liveNow = useMemo(() => new Date(), [tick, layoutBump])

  // Auto-exit when the focused item's timer ends (skip for instant focus mode)
  const exitedRef = useRef(false)
  useEffect(() => {
    if (exitedRef.current) return
    if (instantFocusStartMs != null) return // instant focus: no auto-exit
    if (!isScheduleItemActiveNow(liveNow, focusedItem)) {
      exitedRef.current = true
      onExitFocus()
    }
  }, [liveNow, focusedItem, onExitFocus, instantFocusStartMs])

  // Re-clamp floating panels when layout changes
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    onPanelsChange((prev) =>
      prev.map((p) => {
        if (p.dock) return p
        const maxW = rect.width
        const maxH = rect.height
        return {
          ...p,
          x: clamp(p.x, 0, Math.max(0, maxW - p.width)),
          y: clamp(p.y, 0, Math.max(0, maxH - p.height)),
          width: Math.min(p.width, maxW),
          height: Math.min(p.height, maxH)
        }
      })
    )
  }, [layoutBump, onPanelsChange])

  const removePanel = useCallback(
    (id: string) => {
      onPanelsChange((prev) => prev.filter((p) => p.id !== id))
    },
    [onPanelsChange]
  )

  const updatePanel = useCallback(
    (id: string, patch: Partial<MdiPanelState>) => {
      onPanelsChange((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    [onPanelsChange]
  )

  const getCollapsedSummary = (panel: MdiPanelState): ReactNode => {
    switch (panel.type) {
      case 'other-items': {
        const sorted = sortItemsByStart(otherItems.filter((i) => i.dayKey === day))
        const upcoming = sorted.find((i) => {
          const endMs = i.endTime ? new Date(`${i.dayKey}T${i.endTime}`).getTime() : Infinity
          return endMs > liveNow.getTime()
        })
        if (!upcoming) return <span>无更多事项</span>
        const endPart = upcoming.endTime ? ` – ${upcoming.endTime}` : ''
        return (
          <span>
            {upcoming.startTime}
            {endPart} {upcoming.title}
          </span>
        )
      }
      case 'memo':
        return memoBlocks.length > 0 ? <span>{memoBlocks[0]!.title || '无标题'}</span> : <span>无备忘</span>
      case 'stats':
        return (
          <span>
            {focusTotalMs > 0 ? formatFocusAccumulatedCn(focusTotalMs) : '尚未专注'}
          </span>
        )
    }
  }

  const renderPanelContent = (panel: MdiPanelState): ReactNode => {
    switch (panel.type) {
      case 'other-items':
        return <OtherItemsContent items={otherItems} day={day} />
      case 'memo':
        return <MemoContent blocks={memoBlocks} setBlocks={onMemoBlocksChange} day={day} />
      case 'stats':
        return <StatsContent focusTotalMs={focusTotalMs} item={focusedItem} />
    }
  }

  const dockedLeft: MdiPanelState[] = []
  const dockedRight: MdiPanelState[] = []
  const dockedTop: MdiPanelState[] = []
  const dockedBottom: MdiPanelState[] = []
  const floatingPanels: MdiPanelState[] = []

  for (const p of panels) {
    switch (p.dock) {
      case 'left':
        dockedLeft.push(p)
        break
      case 'right':
        dockedRight.push(p)
        break
      case 'top':
        dockedTop.push(p)
        break
      case 'bottom':
        dockedBottom.push(p)
        break
      default:
        floatingPanels.push(p)
    }
  }

  return (
    <div ref={containerRef} className="mdi-workspace app-no-drag">
      <div className="mdi-workspace-chrome">
        <FocusImmersiveChrome
          onExitFocus={onExitFocus}
          pinned={pinned}
          onPinnedChange={onPinnedChange}
        />
      </div>

      <div className="mdi-workspace-body">
        {dockedLeft.length > 0 && (
          <div className="mdi-dock-left">
            {dockedLeft.map((p) => (
              <MdiPanel
                key={p.id}
                panel={p}
                onUpdate={(patch) => updatePanel(p.id, patch)}
                onClose={() => removePanel(p.id)}
                onBringToFront={() => onBringToFront(p.id)}
                containerRef={containerRef}
                activeZ={zCounter}
                collapsedSummary={getCollapsedSummary(p)}
              >
                {renderPanelContent(p)}
              </MdiPanel>
            ))}
          </div>
        )}

        <div className="mdi-center-stage">
          <StickyScheduleCard
            item={focusedItem}
            now={liveNow}
            focusPlantNonce={focusPlantNonce}
            immersive
            focusTotalMs={focusTotalMs}
            onEdit={() => {}}
            onRemove={() => {}}
            instantFocusStartMs={instantFocusStartMs}
          />
        </div>

        {dockedRight.length > 0 && (
          <div className="mdi-dock-right">
            {dockedRight.map((p) => (
              <MdiPanel
                key={p.id}
                panel={p}
                onUpdate={(patch) => updatePanel(p.id, patch)}
                onClose={() => removePanel(p.id)}
                onBringToFront={() => onBringToFront(p.id)}
                containerRef={containerRef}
                activeZ={zCounter}
                collapsedSummary={getCollapsedSummary(p)}
              >
                {renderPanelContent(p)}
              </MdiPanel>
            ))}
          </div>
        )}
      </div>

      {dockedTop.length > 0 && (
        <div className="mdi-dock-top">
          {dockedTop.map((p) => (
            <MdiPanel
              key={p.id}
              panel={p}
              onUpdate={(patch) => updatePanel(p.id, patch)}
              onClose={() => removePanel(p.id)}
              onBringToFront={() => onBringToFront(p.id)}
              containerRef={containerRef}
              activeZ={zCounter}
              collapsedSummary={getCollapsedSummary(p)}
            >
              {renderPanelContent(p)}
            </MdiPanel>
          ))}
        </div>
      )}

      {dockedBottom.length > 0 && (
        <div className="mdi-dock-bottom">
          {dockedBottom.map((p) => (
            <MdiPanel
              key={p.id}
              panel={p}
              onUpdate={(patch) => updatePanel(p.id, patch)}
              onClose={() => removePanel(p.id)}
              onBringToFront={() => onBringToFront(p.id)}
              containerRef={containerRef}
              activeZ={zCounter}
              collapsedSummary={getCollapsedSummary(p)}
            >
              {renderPanelContent(p)}
            </MdiPanel>
          ))}
        </div>
      )}

      {floatingPanels.map((p) => (
        <MdiPanel
          key={p.id}
          panel={p}
          onUpdate={(patch) => updatePanel(p.id, patch)}
          onClose={() => removePanel(p.id)}
          onBringToFront={() => onBringToFront(p.id)}
          containerRef={containerRef}
          activeZ={p.z}
          collapsedSummary={getCollapsedSummary(p)}
        >
          {renderPanelContent(p)}
        </MdiPanel>
      ))}
    </div>
  )
}
