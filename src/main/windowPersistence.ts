import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { Rectangle } from 'electron'

export type SavedWindowState = {
  bounds: Rectangle
  alwaysOnTop: boolean
}

const defaultBounds = (): Rectangle => ({
  x: -1,
  y: -1,
  width: 380,
  height: 520
})

export function loadWindowState(path: string): SavedWindowState {
  try {
    if (!existsSync(path)) {
      return { bounds: defaultBounds(), alwaysOnTop: true }
    }
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<SavedWindowState>
    return {
      bounds: { ...defaultBounds(), ...(parsed.bounds ?? {}) },
      alwaysOnTop: parsed.alwaysOnTop ?? true
    }
  } catch {
    return { bounds: defaultBounds(), alwaysOnTop: true }
  }
}

export function saveWindowState(path: string, state: SavedWindowState): void {
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf-8')
}
