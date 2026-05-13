import { pickStickyPlantSpeciesIndex } from '../domain/stickyPlantKinds'
import {
  formatFocusAccumulatedCn,
  formatFocusSessionCn
} from '../domain/focusStats'
import { StickyPlantGrowth } from './StickyPlantGrowth'
import { useMemo, useEffect, type ReactElement } from 'react'

export type FocusCelebrationSnapshot = {
  itemId: string
  dayKey: string
  nonce: string
  sessionMs: number
  cumulativeMs: number
}

export function FocusCelebrationOverlay({
  snapshot,
  onDismiss
}: {
  snapshot: FocusCelebrationSnapshot
  onDismiss: () => void
}): ReactElement {
  const speciesIndex = useMemo(
    () => pickStickyPlantSpeciesIndex(`${snapshot.itemId}\u0378${snapshot.dayKey}\u0378${snapshot.nonce}`),
    [snapshot.dayKey, snapshot.itemId, snapshot.nonce]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onDismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    <div className="focus-celebration-backdrop app-no-drag" role="presentation">
      <div
        className="focus-celebration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-celebration-title"
      >
        <div className="focus-celebration-confetti" aria-hidden />
        <div className="focus-celebration-plant">
          <StickyPlantGrowth speciesIndex={speciesIndex} progress={1} />
        </div>
        <h2 id="focus-celebration-title" className="focus-celebration-heading">
          专注完成
        </h2>
        <p className="focus-celebration-line">本次专注 {formatFocusSessionCn(snapshot.sessionMs)}</p>
        <p className="focus-celebration-line focus-celebration-line-muted">
          累计 {formatFocusAccumulatedCn(snapshot.cumulativeMs)}
        </p>
        <button type="button" className="btn-mini btn-mini-primary focus-celebration-ok" onClick={onDismiss}>
          知道了，退出专注
        </button>
      </div>
    </div>
  )
}
