import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { appStatePath, windowStatePath } from './statePaths'
import { loadWindowState, saveWindowState } from './windowPersistence'

function debounce(ms: number, fn: () => void): () => void {
  let t: ReturnType<typeof setTimeout> | undefined
  return () => {
    if (t) clearTimeout(t)
    t = setTimeout(fn, ms)
  }
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const wPath = windowStatePath()
  const persisted = loadWindowState(wPath)
  const b = persisted.bounds

  mainWindow = new BrowserWindow({
    x: b.x >= 0 ? b.x : undefined,
    y: b.y >= 0 ? b.y : undefined,
    width: Math.max(b.width ?? 380, 320),
    height: Math.max(b.height ?? 520, 360),
    minWidth: 320,
    minHeight: 360,
    show: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: persisted.alwaysOnTop,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  const persistBounds = debounce(400, () => {
    const win = mainWindow
    if (!win || win.isDestroyed()) return
    saveWindowState(wPath, {
      bounds: win.getBounds(),
      alwaysOnTop: win.isAlwaysOnTop()
    })
  })

  mainWindow.on('resize', persistBounds)
  mainWindow.on('move', persistBounds)

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function persistWindowNow(): void {
  const active = BrowserWindow.getFocusedWindow() ?? mainWindow
  if (!active || active.isDestroyed()) return
  saveWindowState(windowStatePath(), {
    bounds: active.getBounds(),
    alwaysOnTop: active.isAlwaysOnTop()
  })
}

ipcMain.handle('paths:userData', () => app.getPath('userData'))

ipcMain.handle('state:load', () => {
  const p = appStatePath()
  try {
    if (!existsSync(p)) return null
    return readFileSync(p, 'utf-8')
  } catch {
    return null
  }
})

ipcMain.handle('state:save', (_e, json: unknown) => {
  const body = typeof json === 'string' ? json : JSON.stringify(json)
  writeFileSync(appStatePath(), body, 'utf-8')
})

ipcMain.handle('window:setAlwaysOnTop', (_e, enabled: unknown) => {
  const active = BrowserWindow.getFocusedWindow() ?? mainWindow
  const v = Boolean(enabled)
  if (active && !active.isDestroyed()) {
    active.setAlwaysOnTop(v)
    persistWindowNow()
  }
  return v
})

ipcMain.handle('window:getAlwaysOnTop', () => {
  const active = BrowserWindow.getFocusedWindow() ?? mainWindow
  if (!active || active.isDestroyed()) return false
  return active.isAlwaysOnTop()
})

ipcMain.handle('window:close', () => {
  persistWindowNow()
  const active = BrowserWindow.getFocusedWindow() ?? mainWindow
  active?.close()
})

ipcMain.handle('window:quit', () => app.quit())

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.schedule.desktop')

  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => persistWindowNow())
