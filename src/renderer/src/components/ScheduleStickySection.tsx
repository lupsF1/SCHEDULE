import type { ScheduledItem } from '../domain/appData'
import { pickStickyPlantSpeciesIndex } from '../domain/stickyPlantKinds'
import {
  getPlantGrowthFraction,
  getInstantPlantGrowthFraction,
  getStickyLive,
  getRemainingMs,
  formatHMS,
  dayTimeToDate,
  isScheduleItemActiveNow,
  listActiveCommittedScheduledItems,
  sortItemsByUrgency
} from '../domain/scheduleTime'
import { formatFocusAccumulatedCn } from '../domain/focusStats'
import { useScheduleLiveClock } from '../hooks/useScheduleLiveClock'
import { StickyPlantGrowth, LawnPlantGrowth } from './StickyPlantGrowth'
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'

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

export function StickyScheduleCard({
  item,
  now,
  onEdit,
  onRemove,
  focusPlantNonce,
  immersive,
  focusTotalMs,
  instantFocusStartMs
}: {
  item: ScheduledItem
  now: Date
  onEdit: () => void
  onRemove: () => void
  focusPlantNonce: string | null
  immersive: boolean
  focusTotalMs: number
  instantFocusStartMs?: number | null
}): ReactElement {
  const live = getStickyLive(now, item)
  const remainMs = getRemainingMs(now, item)
  const showClock = remainMs != null && remainMs > 0
  const growth = instantFocusStartMs != null
    ? getInstantPlantGrowthFraction(now, instantFocusStartMs)
    : getPlantGrowthFraction(now, item)
  const plantSpecies = useMemo(
    () =>
      pickStickyPlantSpeciesIndex(
        `${item.id}\u0378${item.dayKey}\u0378${focusPlantNonce ?? 'idle'}`
      ),
    [item.dayKey, item.id, focusPlantNonce]
  )
  const clockLabel =
    now.getTime() < dayTimeToDate(item.dayKey, item.startTime).getTime() ? '距开始' : '剩余'

  const endPart = item.endTime ? `\u2003–\u2003${item.endTime}` : ''
  const timeBand = `${item.startTime}${endPart}`
  const showCumulative =
    !immersive && item.committed !== false && focusTotalMs > 0

  const clockAside = showClock ? (
    <aside
      className={`sticky-clock${immersive ? ' sticky-clock--focusImmersive' : ''}`}
      aria-live="polite"
    >
      {growth != null ? (
        instantFocusStartMs != null ? (
          <LawnPlantGrowth speciesIndex={plantSpecies} progress={growth} />
        ) : (
          <StickyPlantGrowth speciesIndex={plantSpecies} progress={growth} />
        )
      ) : null}
      {immersive ? null : <span className="sticky-clock-label">{clockLabel}</span>}
      <div className="sticky-clock-face">
        <span className="sticky-clock-digits">{formatHMS(remainMs!)}</span>
      </div>
    </aside>
  ) : null

  const mainBlock = (
    <div className={`sticky-note-main${immersive ? ' sticky-note-main--focusImmersive' : ''}`}>
      <div className="sticky-note-timeband">{timeBand}</div>
      {showCumulative ? (
        <p className="sticky-note-focus-total">累计专注 · {formatFocusAccumulatedCn(focusTotalMs)}</p>
      ) : null}
      <h2 className="sticky-note-title">{item.title}</h2>
      {immersive ? null : (
        <>
          <p className="sticky-note-line">{live.line}</p>
          <div className="sticky-note-actions">
            <button type="button" className="btn-icon" title="编辑" onClick={onEdit}>
              编
            </button>
            <button type="button" className="btn-icon btn-icon-danger" title="删除" onClick={onRemove}>
              删
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <article
      className={`sticky-note sticky-note--${live.stripe} app-no-drag${immersive ? ' sticky-note--focusImmersive' : ''}`}
      aria-label={`便签 ${item.title}`}
    >
      <div className="sticky-note-accent" aria-hidden />
      <div
        className={`sticky-note-layout${immersive ? ' sticky-note-layout--focus' : ''}`}
      >
        {immersive ? (
          <>
            {clockAside}
            {mainBlock}
          </>
        ) : (
          <>
            {mainBlock}
            {clockAside}
          </>
        )}
      </div>
    </article>
  )
}

function FocusOverlapPicker({
  candidates,
  onPick,
  onCancel
}: {
  candidates: ScheduledItem[]
  onPick: (id: string) => void
  onCancel: () => void
}): ReactElement {
  return (
    <div className="focus-overlap-backdrop app-no-drag" role="presentation">
      <div
        className="focus-overlap-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-overlap-heading"
      >
        <p id="focus-overlap-heading" className="focus-overlap-heading">
          同时进行中的有多条，请选择要专注的这一条：
        </p>
        <ul className="focus-overlap-list">
          {candidates.map((item) => {
            const extra = item.endTime ? `\u2003→\u2003${item.endTime}` : ''
            const label = `${item.startTime}${extra}\u3000${item.title}`
            return (
              <li key={item.id}>
                <button type="button" className="focus-overlap-choice" onClick={() => onPick(item.id)}>
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
        <button type="button" className="btn-mini btn-mini-ghost focus-overlap-cancel" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  )
}

function InstantFocusPicker({
  items,
  onPick,
  onCancel
}: {
  items: ScheduledItem[]
  onPick: (id: string) => void
  onCancel: () => void
}): ReactElement {
  return (
    <div className="focus-overlap-backdrop app-no-drag" role="presentation">
      <div
        className="focus-overlap-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instant-focus-heading"
      >
        <p id="instant-focus-heading" className="focus-overlap-heading">
          选择要专注的事项：
        </p>
        <ul className="focus-overlap-list">
          {items.map((item) => {
            const endPart = item.endTime ? ` → ${item.endTime}` : ''
            const label = `${item.startTime}${endPart}　${item.title}`
            return (
              <li key={item.id}>
                <button type="button" className="focus-overlap-choice" onClick={() => onPick(item.id)}>
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
        {items.length === 0 ? (
          <p className="sticky-board-hint">今天没有已创建的事项</p>
        ) : null}
        <button type="button" className="btn-mini btn-mini-ghost focus-overlap-cancel" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  )
}

export function FocusImmersiveChrome({
  onExitFocus,
  pinned,
  onPinnedChange
}: {
  onExitFocus: () => void
  pinned: boolean
  onPinnedChange: (v: boolean) => void
}): ReactElement {
  return (
    <div className="focus-immersive-chrome">
      <div className="focus-drag-strip app-drag" title="拖拽移动窗口">
        <span className="focus-drag-strip-inner" aria-hidden />
      </div>
      <div className="focus-chrome-controls app-no-drag">
        <label className="toolbar-check focus-chrome-pin">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => void onPinnedChange(e.target.checked)}
          />
          <span>置顶</span>
        </label>
        <button type="button" className="focus-exit-btn" onClick={onExitFocus}>
          退出专注
        </button>
      </div>
    </div>
  )
}

export function ScheduleStickySection({
  day,
  items,
  setItems,
  focusImmersiveItemId,
  onFocusImmersiveChange,
  focusPlantNonce,
  focusTotalsMsByItemId,
  pinned,
  onPinnedChange,
  layoutBump = 0,
  onInstantFocus,
  instantFocusStartMs
}: {
  day: string
  items: ScheduledItem[]
  setItems: (fn: (prev: ScheduledItem[]) => ScheduledItem[]) => void
  focusImmersiveItemId: string | null
  onFocusImmersiveChange: (id: string | null) => void
  focusPlantNonce: string | null
  focusTotalsMsByItemId: Record<string, number>
  pinned: boolean
  onPinnedChange: (v: boolean) => void
  /** Optional: bumps when viewport/root size changes so vmin-based layouts can refresh without remounting. */
  layoutBump?: number
  onInstantFocus?: (itemId: string) => void
  instantFocusStartMs?: number | null
}): ReactElement {
  const immersive = focusImmersiveItemId !== null

  const allTodayItems = items.filter((i) => i.dayKey === day)
  const committedForClock = allTodayItems.filter((i) => i.committed !== false)
  const clockSource =
    immersive && focusImmersiveItemId
      ? committedForClock.filter((i) => i.id === focusImmersiveItemId)
      : committedForClock
  const tick = useScheduleLiveClock(clockSource)
  const now = useMemo(() => new Date(), [tick, layoutBump])

  const todayItems = sortItemsByUrgency(allTodayItems, now)

  const [draftStart, setDraftStart] = useState('10:00')
  const [draftEnd, setDraftEnd] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [overlapPickOpen, setOverlapPickOpen] = useState(false)
  const [overlapCandidates, setOverlapCandidates] = useState<ScheduledItem[]>([])
  const [sectionCollapsed, setSectionCollapsed] = useState(false)
  const [instantPickOpen, setInstantPickOpen] = useState(false)

  const visibleRows = useMemo(() => {
    if (!immersive || !focusImmersiveItemId) return todayItems
    return todayItems.filter((r) => r.id === focusImmersiveItemId)
  }, [focusImmersiveItemId, immersive, todayItems])

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
    setComposerOpen(false)
  }, [draftEnd, draftStart, draftTitle, day, setItems])

  const onFocusCheckbox = useCallback(
    (wantOn: boolean) => {
      if (!wantOn) {
        onFocusImmersiveChange(null)
        setOverlapPickOpen(false)
        setOverlapCandidates([])
        return
      }
      const actives = listActiveCommittedScheduledItems(now, items, day)
      if (actives.length === 0) {
        window.alert('当前没有进行中事项，无法在专注模式中只保留一条便签。')
        return
      }
      if (actives.length === 1) {
        onFocusImmersiveChange(actives[0]!.id)
        return
      }
      setOverlapCandidates(actives)
      setOverlapPickOpen(true)
    },
    [day, items, now, onFocusImmersiveChange]
  )

  const exitFocus = useCallback(() => {
    onFocusImmersiveChange(null)
  }, [onFocusImmersiveChange])

  if (immersive && visibleRows.length === 0) {
    return (
      <section className="sticky-board sticky-board--immersive">
        <FocusImmersiveChrome
          onExitFocus={exitFocus}
          pinned={pinned}
          onPinnedChange={onPinnedChange}
        />
        <p className="sticky-board-hint app-no-drag">该项已不存在或不在今天，请点击退出专注。</p>
      </section>
    )
  }
  const renderRowSlot = (
    row: ScheduledItem,
    index: number
  ): ReactElement => {
    const skew = immersive ? '' : index % 2 === 0 ? 'sticky-slot--skewL' : 'sticky-slot--skewR'
    const showEditor = editingId === row.id || row.committed === false
    const slotCls = immersive ? `sticky-slot${skew ? ` ${skew}` : ''} sticky-slot--immersiveOnly` : `sticky-slot ${skew}`

    return (
      <div className={slotCls} key={row.id}>
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
            focusPlantNonce={focusPlantNonce}
            immersive={immersive && focusImmersiveItemId === row.id}
            focusTotalMs={focusTotalsMsByItemId[row.id] ?? 0}
            onEdit={() => setEditingId(row.id)}
            onRemove={() => removeItem(row.id)}
            instantFocusStartMs={immersive && focusImmersiveItemId === row.id ? instantFocusStartMs : null}
          />
        )}
      </div>
    )
  }

  return (
    <section className={`sticky-board${immersive ? ' sticky-board--immersive' : ''}`}>
      {overlapPickOpen ? (
        <FocusOverlapPicker
          candidates={overlapCandidates}
          onPick={(id) => {
            onFocusImmersiveChange(id)
            setOverlapPickOpen(false)
            setOverlapCandidates([])
          }}
          onCancel={() => {
            setOverlapPickOpen(false)
            setOverlapCandidates([])
          }}
        />
      ) : null}

      {instantPickOpen ? (
        <InstantFocusPicker
          items={todayItems.filter((i) => i.committed !== false)}
          onPick={(id) => {
            onInstantFocus?.(id)
            setInstantPickOpen(false)
          }}
          onCancel={() => setInstantPickOpen(false)}
        />
      ) : null}

      {immersive ? (
        <FocusImmersiveChrome
          onExitFocus={exitFocus}
          pinned={pinned}
          onPinnedChange={onPinnedChange}
        />
      ) : (
        <div className="sticky-board-heading-row app-no-drag">
          <h2 className="sticky-board-heading">此刻安排</h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {onInstantFocus ? (
              <button
                type="button"
                className="sticky-board-instant-btn"
                onClick={() => setInstantPickOpen(true)}
              >
                立即专注
              </button>
            ) : null}
            <button
              type="button"
              className="sticky-board-collapse-btn"
              onClick={() => setSectionCollapsed(!sectionCollapsed)}
            >
              {sectionCollapsed ? '展开' : '收起'}
            </button>
            <label className="toolbar-check sticky-board-focus-toggle">
              <input
                type="checkbox"
                checked={immersive}
                onChange={(e) => void onFocusCheckbox(e.target.checked)}
              />
              <span>专注模式</span>
            </label>
          </div>
        </div>
      )}
      {sectionCollapsed && !immersive ? (
        <p className="sticky-board-summary">
          {todayItems.length > 0
            ? `${todayItems[0]!.startTime} ${todayItems[0]!.title}`
            : '今天没有安排'}
        </p>
      ) : (
        <>
        <div className={`sticky-notes-stack${immersive ? ' sticky-notes-stack--immersive' : ''}`}>
          {!immersive && todayItems.length === 0 ? (
            <p className="sticky-board-hint">点右下角「+」展开添加区，保存后便在签右侧显示圆形倒计时。</p>
          ) : null}
          {immersive &&
          visibleRows.some((r) => r.id === focusImmersiveItemId && isScheduleItemActiveNow(now, r) === false) ? (
            <p className="sticky-board-hint sticky-board-hint--immersiveWarn app-no-drag">
              该条已不是进行中时段，点「退出专注」恢复全貌。
            </p>
          ) : null}
          {visibleRows.map((row, index) => renderRowSlot(row, index))}
        </div>

        {!immersive ? (
          <div className="sticky-composer-anchor app-no-drag">
          {!composerOpen ? (
            <button
              type="button"
              className="sticky-composer-fab app-no-drag"
              aria-expanded={false}
              aria-label="展开再加一张备忘"
              onClick={() => setComposerOpen(true)}
            >
              +
            </button>
          ) : (
            <div className="sticky-composer sticky-note sticky-note--sheet sticky-composer-panel app-no-drag">
              <div className="sticky-composer-header">
                <span className="sticky-composer-caption">再加一张</span>
                <button
                  type="button"
                  className="sticky-composer-close"
                  aria-label="收起添加区"
                  onClick={() => setComposerOpen(false)}
                >
                  收起
                </button>
              </div>
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
              <button
                type="button"
                className="btn-mini btn-mini-primary sticky-composer-btn"
                onClick={startDraftFromComposer}
              >
                贴上来
              </button>
            </div>
          )}
        </div>
      ) : null}
        </>
      )}
    </section>
  )
}
