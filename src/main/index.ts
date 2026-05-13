import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
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

/** Corkboard background (--cork-bg in renderer). Opaque shell fixes OS edge resize / drag vs transparent Chromium hit-testing. */
const WINDOW_BACKGROUND = '#cfca9e'

/** Invoking renderer's owning window — never rely solely on BrowserWindow.getFocusedWindow() (menus, overlays, quirks). */
function browserWindowFromEvent(e: IpcMainInvokeEvent): BrowserWindow | null {
  const fromContents = BrowserWindow.fromWebContents(e.sender)
  if (fromContents && !fromContents.isDestroyed()) return fromContents
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow
  return null
}

function targetWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow
  const f = BrowserWindow.getFocusedWindow()
  return f && !f.isDestroyed() ? f : null
}

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
    frame: false,
    /** Enables native sizing border on Windows (WS_THICKFRAME) with a custom HTML title row. */
    thickFrame: true,
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hiddenInset' as const }
      : {}),
    resizable: true,
    maximizable: true,
    minimizable: true,
    hasShadow: true,
    transparent: false,
    backgroundColor: WINDOW_BACKGROUND,
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
  const active = targetWindow()
  if (!active) return
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

ipcMain.handle('window:setAlwaysOnTop', (e, enabled: unknown) => {
  const active = browserWindowFromEvent(e)
  const v = Boolean(enabled)
  if (active) {
    active.setAlwaysOnTop(v)
    persistWindowNow()
  }
  return v
})

ipcMain.handle('window:getAlwaysOnTop', (e) => {
  const active = browserWindowFromEvent(e)
  if (!active) return false
  return active.isAlwaysOnTop()
})

ipcMain.handle(
  'window:adjustSize',
  (e, dw: unknown, dh: unknown) => {
    const win = browserWindowFromEvent(e)
    if (!win) return null
    const dW = typeof dw === 'number' && Number.isFinite(dw) ? Math.trunc(dw) : 0
    const dH = typeof dh === 'number' && Number.isFinite(dh) ? Math.trunc(dh) : 0
    const b = win.getBounds()
    const [mw, mh] = win.getMinimumSize()
    const minW = mw > 0 ? mw : 320
    const minH = mh > 0 ? mh : 360
    const nextW = Math.max(minW, b.width + dW)
    const nextH = Math.max(minH, b.height + dH)
    const changed = nextW !== b.width || nextH !== b.height
    win.setBounds({ x: b.x, y: b.y, width: nextW, height: nextH })
    return { width: nextW, height: nextH, changed }
  }
)

ipcMain.handle('window:close', (e) => {
  persistWindowNow()
  const active = browserWindowFromEvent(e)
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
