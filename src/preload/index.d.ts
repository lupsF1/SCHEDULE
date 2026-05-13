import { ElectronAPI } from '@electron-toolkit/preload'

export type DesktopAPI = {
  userDataPath: () => Promise<string>
  loadState: () => Promise<string | null>
  saveState: (payload: string) => Promise<void>
  setAlwaysOnTop: (enabled: boolean) => Promise<boolean>
  getAlwaysOnTop: () => Promise<boolean>
  closeWindow: () => Promise<void>
  quitApp: () => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    desktop: DesktopAPI
  }
}

export {}
