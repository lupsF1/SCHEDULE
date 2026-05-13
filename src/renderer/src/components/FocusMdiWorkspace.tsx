import { useCallback, useEffect, useRef, type ReactElement, type ReactNode } from 'react'
import type { MdiPanelState, MdiPanelType } from '../domain/mdiTypes'
import {
  MDI_PANEL_TITLES,
  MDI_DEFAULT_FLOAT_WIDTH,
  MDI_DEFAULT_FLOAT_HEIGHT
} from '../domain/mdiTypes'
import type { ScheduledItem, NoteBlock } from '../domain/appData'
import { sortItemsByStart } from '../domain/appData'
import { formatFocusAccumulatedCn } from '../domain/focusStats'
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

function createDefaultPanels(zStart: number): MdiPanelState[] {
  return [
    {
      id: crypto.randomUUID(),
      type: 'other-items',
      x: 0,
      y: 0,
      width: MDI_DEFAULT_FLOAT_WIDTH,
      height: MDI_DEFAULT_FLOAT_HEIGHT,
      dock: 'left',
      collapsed: false,
      z: zStart
    },
    {
      id: crypto.randomUUID(),
      type: 'stats',
      x: 0,
      y: 0,
      width: MDI_DEFAULT_FLOAT_WIDTH,
      height: MDI_DEFAULT_FLOAT_HEIGHT,
      dock: 'right',
      collapsed: false,
      z: zStart + 1
    }
  ]
}

export function FocusMdiWorkspace({
  panels,
  onPanelsChange,
  zCounter,
  onBringToFront,
  focusedItem,
  now,
  focusPlantNonce,
  focusTotalMs,
  pinned,
  onPinnedChange,
  onExitFocus,
  layoutBump,
  otherItems,
  memoBlocks,
  onMemoBlocksChange,
  day
}: {
  panels: MdiPanelState[]
  onPanelsChange: (fn: (prev: MdiPanelState[]) => MdiPanelState[]) => void
  zCounter: number
  onBringToFront: (panelId: string) => void
  focusedItem: ScheduledItem
  now: Date
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
}): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize default panels on mount
  const didInitRef = useRef(false)
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    if (panels.length === 0) {
      onPanelsChange(() => createDefaultPanels(zCounter))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const addPanel = useCallback(
    (type: MdiPanelType) => {
      // If panel of this type already exists, just bringToFront
      const existing = panels.find((p) => p.type === type)
      if (existing) {
        onBringToFront(existing.id)
        if (existing.collapsed) {
          updatePanel(existing.id, { collapsed: false })
        }
        return
      }
      const newPanel: MdiPanelState = {
        id: crypto.randomUUID(),
        type,
        x: 40 + panels.length * 20,
        y: 40 + panels.length * 20,
        width: MDI_DEFAULT_FLOAT_WIDTH,
        height: MDI_DEFAULT_FLOAT_HEIGHT,
        dock: null,
        collapsed: false,
        z: zCounter + 1
      }
      onPanelsChange((prev) => [...prev, newPanel])
    },
    [panels, zCounter, onBringToFront, updatePanel, onPanelsChange]
  )

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

  const existingTypes = new Set(panels.map((p) => p.type))
  const panelTypes: MdiPanelType[] = ['other-items', 'memo', 'stats']

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
              >
                {renderPanelContent(p)}
              </MdiPanel>
            ))}
          </div>
        )}

        <div className="mdi-center-stage">
          <StickyScheduleCard
            item={focusedItem}
            now={now}
            focusPlantNonce={focusPlantNonce}
            immersive
            focusTotalMs={focusTotalMs}
            onEdit={() => {}}
            onRemove={() => {}}
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
        >
          {renderPanelContent(p)}
        </MdiPanel>
      ))}

      <div className="mdi-toolbar">
        {panelTypes.map((type) => {
          const exists = existingTypes.has(type)
          return (
            <button
              key={type}
              type="button"
              className={`mdi-toolbar-btn${exists ? ' mdi-toolbar-btn--active' : ''}`}
              onClick={() => addPanel(type)}
              title={exists ? `切换到${MDI_PANEL_TITLES[type]}` : `打开${MDI_PANEL_TITLES[type]}`}
            >
              {MDI_PANEL_TITLES[type]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
