/** 50 种可视化变体（20 花 + 20 树 + 10 多肉）；名称用于无障碍与可读性 */

export type StickyPlantSpeciesKind = 'flower' | 'tree' | 'succulent'

export type StickyPlantSpecies = {
  label: string
  kind: StickyPlantSpeciesKind
  /** 主色色相 0–360 */
  hue: number
}

export const STICKY_PLANT_SPECIES: readonly StickyPlantSpecies[] = [
  // 花卉 (0–19)
  { label: '牡丹', kind: 'flower', hue: 330 },
  { label: '玫瑰', kind: 'flower', hue: 350 },
  { label: '芍药', kind: 'flower', hue: 318 },
  { label: '玉兰', kind: 'flower', hue: 285 },
  { label: '山茶', kind: 'flower', hue: 352 },
  { label: '水仙', kind: 'flower', hue: 48 },
  { label: '郁金香', kind: 'flower', hue: 312 },
  { label: '康乃馨', kind: 'flower', hue: 340 },
  { label: '绣球', kind: 'flower', hue: 210 },
  { label: '茉莉', kind: 'flower', hue: 262 },
  { label: '杜鹃', kind: 'flower', hue: 12 },
  { label: '海棠', kind: 'flower', hue: 348 },
  { label: '栀子', kind: 'flower', hue: 82 },
  { label: '百合', kind: 'flower', hue: 279 },
  { label: '薰衣草', kind: 'flower', hue: 288 },
  { label: '矢车菊', kind: 'flower', hue: 220 },
  { label: '三色堇', kind: 'flower', hue: 280 },
  { label: '虞美人', kind: 'flower', hue: 8 },
  { label: '勿忘我', kind: 'flower', hue: 230 },
  { label: '天竺葵', kind: 'flower', hue: 358 },
  // 树木 (20–39)
  { label: '梧桐', kind: 'tree', hue: 128 },
  { label: '槐', kind: 'tree', hue: 142 },
  { label: '银杏', kind: 'tree', hue: 58 },
  { label: '枫', kind: 'tree', hue: 26 },
  { label: '松', kind: 'tree', hue: 154 },
  { label: '柏', kind: 'tree', hue: 148 },
  { label: '杉', kind: 'tree', hue: 146 },
  { label: '樟', kind: 'tree', hue: 138 },
  { label: '榕', kind: 'tree', hue: 142 },
  { label: '椰', kind: 'tree', hue: 162 },
  { label: '竹', kind: 'tree', hue: 118 },
  { label: '柳', kind: 'tree', hue: 134 },
  { label: '榆', kind: 'tree', hue: 136 },
  { label: '桦', kind: 'tree', hue: 152 },
  { label: '橡', kind: 'tree', hue: 68 },
  { label: '楠', kind: 'tree', hue: 156 },
  { label: '桂', kind: 'tree', hue: 134 },
  { label: '桃', kind: 'tree', hue: 356 },
  { label: '梨', kind: 'tree', hue: 154 },
  { label: '梅', kind: 'tree', hue: 356 },
  // 多肉 (40–49)
  { label: '仙人掌', kind: 'succulent', hue: 140 },
  { label: '芦荟', kind: 'succulent', hue: 148 },
  { label: '石莲花', kind: 'succulent', hue: 290 },
  { label: '玉露', kind: 'succulent', hue: 130 },
  { label: '虹之玉', kind: 'succulent', hue: 15 },
  { label: '熊童子', kind: 'succulent', hue: 120 },
  { label: '桃蛋', kind: 'succulent', hue: 340 },
  { label: '法师', kind: 'succulent', hue: 200 },
  { label: '生石花', kind: 'succulent', hue: 45 },
  { label: '条纹十二卷', kind: 'succulent', hue: 150 }
]

export function pickStickyPlantSpeciesIndex(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  const n = STICKY_PLANT_SPECIES.length
  return ((h % n) + n) % n
}
