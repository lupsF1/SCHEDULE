export type MdiDockSide = 'left' | 'right' | 'top' | 'bottom' | null

export type MdiPanelType = 'other-items' | 'memo' | 'stats'

export type MdiPanelState = {
  id: string
  type: MdiPanelType
  x: number
  y: number
  width: number
  height: number
  dock: MdiDockSide
  collapsed: boolean
  z: number
}

export const MDI_PANEL_TITLES: Record<MdiPanelType, string> = {
  'other-items': '其他事项',
  memo: '纸片备忘',
  stats: '专注统计'
}

export const MDI_MIN_WIDTH = 200
export const MDI_MIN_HEIGHT = 120
export const MDI_DOCK_THRESHOLD = 30
export const MDI_DOCK_RATIO = 0.3

export const MDI_DEFAULT_FLOAT_WIDTH = 260
export const MDI_DEFAULT_FLOAT_HEIGHT = 280
