import { useCallback, useEffect, useRef, type ReactElement, type ReactNode } from 'react'
import type { MdiPanelState } from '../domain/mdiTypes'
import { MDI_PANEL_TITLES } from '../domain/mdiTypes'
import { useMdiDrag } from '../hooks/useMdiDrag'

export function MdiPanel({
  panel,
  onUpdate,
  onClose,
  onBringToFront,
  containerRef,
  activeZ,
  collapsedSummary,
  children
}: {
  panel: MdiPanelState
  onUpdate: (patch: Partial<MdiPanelState>) => void
  onClose: () => void
  onBringToFront: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
  activeZ: number
  collapsedSummary?: ReactNode
  children: ReactNode
}): ReactElement {
  const panelRef = useRef<HTMLDivElement>(null)

  const onPositionChange = useCallback(
    (x: number, y: number) => onUpdate({ x, y }),
    [onUpdate]
  )
  const onSizeChange = useCallback(
    (w: number, h: number) => onUpdate({ width: w, height: h }),
    [onUpdate]
  )

  const { dragHandleProps, getResizeHandleProps, isDragging, resizeDirections } = useMdiDrag({
    containerRef,
    x: panel.x,
    y: panel.y,
    width: panel.width,
    height: panel.height,
    onPositionChange,
    onSizeChange,
    onDragEnd: (snap) => {
      if (snap) {
        onUpdate({
          dock: snap.dock,
          x: snap.snappedX,
          y: snap.snappedY,
          width: snap.snappedWidth,
          height: snap.snappedHeight
        })
      }
    }
  })

  const toggleCollapse = useCallback(() => {
    onUpdate({ collapsed: !panel.collapsed })
  }, [panel.collapsed, onUpdate])

  const undock = useCallback(() => {
    onUpdate({
      dock: null,
      x: panel.x,
      y: panel.y,
      width: panel.width,
      height: panel.height
    })
  }, [panel.x, panel.y, panel.width, panel.height, onUpdate])

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (panel.collapsed) {
          onClose()
        } else {
          onUpdate({ collapsed: true })
        }
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [panel.collapsed, onClose, onUpdate])

  const isFloating = panel.dock === null

  const style: React.CSSProperties = isFloating
    ? {
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        zIndex: activeZ
      }
    : { zIndex: activeZ }

  const title = MDI_PANEL_TITLES[panel.type]

  return (
    <div
      ref={panelRef}
      className={`mdi-panel${panel.dock ? ' mdi-panel--docked' : ''}${isDragging ? ' mdi-panel--dragging' : ''}`}
      style={style}
      onPointerDown={onBringToFront}
      tabIndex={0}
      role="dialog"
      aria-label={title}
    >
      {isFloating &&
        resizeDirections.map((dir) => (
          <div key={dir} aria-hidden="true" {...getResizeHandleProps(dir)} />
        ))}

      <div className="mdi-titlebar" {...(isFloating ? dragHandleProps : {})}>
        <span className="mdi-title">{title}</span>
        <div className="mdi-titlebar-actions">
          {panel.dock && (
            <button
              type="button"
              className="mdi-btn mdi-btn--float"
              title="浮动"
              onClick={undock}
            >
              浮
            </button>
          )}
          <button
            type="button"
            className="mdi-btn mdi-btn--collapse"
            title={panel.collapsed ? '展开' : '收起'}
            onClick={toggleCollapse}
          >
            {panel.collapsed ? '展' : '收'}
          </button>
          <button
            type="button"
            className="mdi-btn mdi-btn--close"
            title="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>

      {panel.collapsed ? (
        <div className="mdi-content mdi-content--collapsed">{collapsedSummary}</div>
      ) : (
        <div className="mdi-content">{children}</div>
      )}
    </div>
  )
}
