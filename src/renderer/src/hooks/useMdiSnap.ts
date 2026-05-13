import { useCallback, useRef, useState } from 'react'
import type { MdiDockSide } from '../domain/mdiTypes'
import { MDI_DOCK_THRESHOLD, MDI_DOCK_RATIO } from '../domain/mdiTypes'

export type SnapResult = {
  dock: MdiDockSide
  snappedX: number
  snappedY: number
  snappedWidth: number
  snappedHeight: number
}

export function checkSnap(
  pointerX: number,
  pointerY: number,
  containerRect: DOMRect,
  threshold: number = MDI_DOCK_THRESHOLD
): SnapResult | null {
  const relX = pointerX - containerRect.left
  const relY = pointerY - containerRect.top
  const cw = containerRect.width
  const ch = containerRect.height

  if (relX <= threshold) {
    return {
      dock: 'left',
      snappedX: 0,
      snappedY: 0,
      snappedWidth: Math.round(cw * MDI_DOCK_RATIO),
      snappedHeight: ch
    }
  }
  if (relX >= cw - threshold) {
    return {
      dock: 'right',
      snappedX: Math.round(cw * (1 - MDI_DOCK_RATIO)),
      snappedY: 0,
      snappedWidth: Math.round(cw * MDI_DOCK_RATIO),
      snappedHeight: ch
    }
  }
  if (relY <= threshold) {
    return {
      dock: 'top',
      snappedX: 0,
      snappedY: 0,
      snappedWidth: cw,
      snappedHeight: Math.round(ch * MDI_DOCK_RATIO)
    }
  }
  if (relY >= ch - threshold) {
    return {
      dock: 'bottom',
      snappedX: 0,
      snappedY: Math.round(ch * (1 - MDI_DOCK_RATIO)),
      snappedWidth: cw,
      snappedHeight: Math.round(ch * MDI_DOCK_RATIO)
    }
  }

  return null
}

export function useMdiSnap() {
  const [dockPreview, setDockPreview] = useState<MdiDockSide>(null)
  const [snapResult, setSnapResult] = useState<SnapResult | null>(null)
  const containerRef = useRef<DOMRect | null>(null)

  const updateSnap = useCallback(
    (pointerX: number, pointerY: number, rect: DOMRect) => {
      containerRef.current = rect
      const result = checkSnap(pointerX, pointerY, rect)
      setDockPreview(result?.dock ?? null)
      setSnapResult(result)
    },
    []
  )

  const clearSnap = useCallback(() => {
    setDockPreview(null)
    setSnapResult(null)
    containerRef.current = null
  }, [])

  return { dockPreview, snapResult, updateSnap, clearSnap }
}
