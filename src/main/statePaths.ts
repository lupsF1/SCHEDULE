import { app } from 'electron'
import { join } from 'path'

export function appStatePath(): string {
  return join(app.getPath('userData'), 'app-state.json')
}

export function windowStatePath(): string {
  return join(app.getPath('userData'), 'window-state.json')
}
