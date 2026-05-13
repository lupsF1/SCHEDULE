import { useEffect, useState } from 'react'

/**
 * Increments whenever the window/root layout size likely changed (resize or root ResizeObserver).
 * Downstream can depend on this for a light re-render (e.g. vmin-based layout) without remounting trees.
 */
export function useWindowResizeBump(): number {
  const [bump, setBump] = useState(0)

  useEffect(() => {
    const bumpLayout = (): void => {
      setBump((n) => n + 1)
    }

    const rafBump = (): void => {
      requestAnimationFrame(bumpLayout)
    }

    window.addEventListener('resize', rafBump, { passive: true })

    const root = document.getElementById('root')
    if (!root || typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', rafBump)
    }

    let roTimer: ReturnType<typeof requestAnimationFrame> | undefined
    const ro = new ResizeObserver(() => {
      if (roTimer !== undefined) cancelAnimationFrame(roTimer)
      roTimer = requestAnimationFrame(() => bumpLayout())
    })
    ro.observe(root)

    return () => {
      window.removeEventListener('resize', rafBump)
      if (roTimer !== undefined) cancelAnimationFrame(roTimer)
      ro.disconnect()
    }
  }, [])

  return bump
}
