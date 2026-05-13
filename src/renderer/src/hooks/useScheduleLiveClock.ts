import { useEffect, useState } from 'react'
import { needsLiveSecondTick } from '../domain/scheduleTime'
import type { ScheduledItem } from '../domain/appData'

/**
 * Minute refresh for stale text; plus 1s refresh while any item has a live circular countdown (remainMs &gt; 0).
 * Polls every 1s to start/stop the second timer promptly when crossing the countdown window.
 */
export function useScheduleLiveClock(todayCommitted: ScheduledItem[]): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((n) => n + 1)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const ref = { sec: undefined as number | undefined }
    const sync = (): void => {
      const needSecond = needsLiveSecondTick(todayCommitted, new Date())
      if (!needSecond) {
        if (ref.sec !== undefined) {
          window.clearInterval(ref.sec)
          ref.sec = undefined
        }
        return
      }
      if (ref.sec === undefined) {
        ref.sec = window.setInterval(() => {
          setTick((n) => n + 1)
        }, 1000) as unknown as number
      }
    }

    sync()
    const poll = window.setInterval(sync, 1_000) as unknown as number
    return () => {
      window.clearInterval(poll)
      if (ref.sec !== undefined) window.clearInterval(ref.sec)
    }
  }, [todayCommitted])

  return tick
}
