import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const desktop = {
  userDataPath: (): Promise<string> => ipcRenderer.invoke('paths:userData'),
  loadState: (): Promise<string | null> => ipcRenderer.invoke('state:load'),
  saveState: (payload: string): Promise<void> =>
    ipcRenderer.invoke('state:save', payload),
  setAlwaysOnTop: (enabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('window:setAlwaysOnTop', enabled),
  getAlwaysOnTop: (): Promise<boolean> => ipcRenderer.invoke('window:getAlwaysOnTop'),
  adjustWindowSize: (
    dw: number,
    dh: number
  ): Promise<{ width: number; height: number } | null> =>
    ipcRenderer.invoke('window:adjustSize', dw, dh),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  quitApp: (): Promise<void> => ipcRenderer.invoke('window:quit')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('desktop', desktop)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error dev paths
  window.electron = electronAPI
  // @ts-expect-error dev paths
  window.desktop = desktop
}
