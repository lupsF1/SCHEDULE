import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { MDI_MIN_WIDTH, MDI_MIN_HEIGHT } from '../domain/mdiTypes'
import { checkSnap, type SnapResult } from './useMdiSnap'

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

type UseMdiDragOptions = {
  containerRef: React.RefObject<HTMLElement | null>
  x: number
  y: number
  width: number
  height: number
  onPositionChange: (x: number, y: number) => void
  onSizeChange: (w: number, h: number) => void
  onDragStart?: () => void
  onDragEnd?: (snap: SnapResult | null) => void
  minSize?: { width: number; height: number }
}

type UseMdiDragReturn = {
  dragHandleProps: {
    onPointerDown: (e: ReactPointerEvent) => void
  }
  getResizeHandleProps: (dir: ResizeDirection) => {
    onPointerDown: (e: ReactPointerEvent) => void
    className: string
  }
  isDragging: boolean
  isResizing: boolean
  resizeDirections: readonly ResizeDirection[]
}

export function useMdiDrag(opts: UseMdiDragOptions): UseMdiDragReturn {
  const {
    containerRef,
    x,
    y,
    width,
    height,
    onPositionChange,
    onSizeChange,
    onDragStart,
    onDragEnd,
    minSize = { width: MDI_MIN_WIDTH, height: MDI_MIN_HEIGHT }
  } = opts

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const snapRef = useRef<SnapResult | null>(null)

  const onDragPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return
      const container = containerRef.current
      if (!container) return
      e.currentTarget.setPointerCapture(e.pointerId)

      const containerRect = container.getBoundingClientRect()
      const startX = e.clientX - x
      const startY = e.clientY - y
      setIsDragging(true)
      onDragStart?.()

      const el = e.currentTarget as HTMLElement

      const onMove = (ev: globalThis.PointerEvent) => {
        let newX = ev.clientX - startX
        let newY = ev.clientY - startY
        newX = clamp(newX, 0, containerRect.width - width)
        newY = clamp(newY, 0, containerRect.height - height)
        onPositionChange(newX, newY)

        const snap = checkSnap(ev.clientX, ev.clientY, containerRect)
        snapRef.current = snap
      }

      const onUp = (ev: globalThis.PointerEvent) => {
        el.releasePointerCapture(ev.pointerId)
        setIsDragging(false)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        onDragEnd?.(snapRef.current)
        snapRef.current = null
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
    },
    [containerRef, x, y, width, height, onPositionChange, onSizeChange, onDragStart, onDragEnd]
  )

  const onResizePointerDown = useCallback(
    (dir: ResizeDirection) => (e: ReactPointerEvent) => {
      if (e.button !== 0) return
      const container = containerRef.current
      if (!container) return
      e.currentTarget.setPointerCapture(e.pointerId)
      e.stopPropagation()

      const containerRect = container.getBoundingClientRect()
      const startX = e.clientX
      const startY = e.clientY
      const startPanelX = x
      const startPanelY = y
      const startW = width
      const startH = height
      setIsResizing(true)

      const el = e.currentTarget as HTMLElement

      const onMove = (ev: globalThis.PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        let newX = startPanelX
        let newY = startPanelY
        let newW = startW
        let newH = startH

        if (dir.includes('e')) {
          newW = Math.max(minSize.width, startW + dx)
        }
        if (dir.includes('w')) {
          const maxDx = startW - minSize.width
          const clampedDx = Math.min(dx, maxDx)
          newX = startPanelX + clampedDx
          newW = startW - clampedDx
        }
        if (dir.includes('s')) {
          newH = Math.max(minSize.height, startH + dy)
        }
        if (dir.includes('n')) {
          const maxDy = startH - minSize.height
          const clampedDy = Math.min(dy, maxDy)
          newY = startPanelY + clampedDy
          newH = startH - clampedDy
        }

        // Clamp to container
        newX = clamp(newX, 0, containerRect.width - minSize.width)
        newY = clamp(newY, 0, containerRect.height - minSize.height)
        newW = Math.min(newW, containerRect.width - newX)
        newH = Math.min(newH, containerRect.height - newY)

        onPositionChange(newX, newY)
        onSizeChange(newW, newH)
      }

      const onUp = (ev: globalThis.PointerEvent) => {
        el.releasePointerCapture(ev.pointerId)
        setIsResizing(false)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
    },
    [containerRef, x, y, width, height, minSize, onPositionChange, onSizeChange]
  )

  const getResizeHandleProps = useCallback(
    (dir: ResizeDirection) => ({
      onPointerDown: onResizePointerDown(dir),
      className: `mdi-resize mdi-resize--${dir}`
    }),
    [onResizePointerDown]
  )

  return {
    dragHandleProps: { onPointerDown: onDragPointerDown },
    getResizeHandleProps,
    isDragging,
    isResizing,
    resizeDirections: RESIZE_DIRECTIONS
  }
}
