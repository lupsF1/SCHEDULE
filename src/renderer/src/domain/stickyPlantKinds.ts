import type { PlantGenusKey } from '../plantEngine/generators/svgPlantGen'

/** 50 种可视化变体；名称用于无障碍与可读性 */

export type StickyPlantSpeciesKind = 'flower' | 'tree' | 'succulent'

export type StickyPlantSpecies = {
  label: string
  kind: StickyPlantSpeciesKind
  /** svg-plant 属 */
  genusKey: PlantGenusKey
}

export const STICKY_PLANT_SPECIES: readonly StickyPlantSpecies[] = [
  // 花卉 (0–19) → pilea(小型叶) 或 bushy(灌木型)
  { label: '牡丹', kind: 'flower', genusKey: 'bushy' },
  { label: '玫瑰', kind: 'flower', genusKey: 'bushy' },
  { label: '芍药', kind: 'flower', genusKey: 'pilea' },
  { label: '玉兰', kind: 'flower', genusKey: 'bushy' },
  { label: '山茶', kind: 'flower', genusKey: 'pilea' },
  { label: '水仙', kind: 'flower', genusKey: 'pilea' },
  { label: '郁金香', kind: 'flower', genusKey: 'pilea' },
  { label: '康乃馨', kind: 'flower', genusKey: 'bushy' },
  { label: '绣球', kind: 'flower', genusKey: 'bushy' },
  { label: '茉莉', kind: 'flower', genusKey: 'pilea' },
  { label: '杜鹃', kind: 'flower', genusKey: 'bushy' },
  { label: '海棠', kind: 'flower', genusKey: 'pilea' },
  { label: '栀子', kind: 'flower', genusKey: 'bushy' },
  { label: '百合', kind: 'flower', genusKey: 'pilea' },
  { label: '薰衣草', kind: 'flower', genusKey: 'pilea' },
  { label: '矢车菊', kind: 'flower', genusKey: 'pilea' },
  { label: '三色堇', kind: 'flower', genusKey: 'pilea' },
  { label: '虞美人', kind: 'flower', genusKey: 'pilea' },
  { label: '勿忘我', kind: 'flower', genusKey: 'pilea' },
  { label: '天竺葵', kind: 'flower', genusKey: 'bushy' },
  // 树木 (20–39) → dragon(龙血树型) 或 bushy(灌木/乔木)
  { label: '梧桐', kind: 'tree', genusKey: 'dragon' },
  { label: '槐', kind: 'tree', genusKey: 'dragon' },
  { label: '银杏', kind: 'tree', genusKey: 'dragon' },
  { label: '枫', kind: 'tree', genusKey: 'bushy' },
  { label: '松', kind: 'tree', genusKey: 'dragon' },
  { label: '柏', kind: 'tree', genusKey: 'dragon' },
  { label: '杉', kind: 'tree', genusKey: 'dragon' },
  { label: '樟', kind: 'tree', genusKey: 'dragon' },
  { label: '榕', kind: 'tree', genusKey: 'bushy' },
  { label: '椰', kind: 'tree', genusKey: 'dragon' },
  { label: '竹', kind: 'tree', genusKey: 'dragon' },
  { label: '柳', kind: 'tree', genusKey: 'bushy' },
  { label: '榆', kind: 'tree', genusKey: 'bushy' },
  { label: '桦', kind: 'tree', genusKey: 'dragon' },
  { label: '橡', kind: 'tree', genusKey: 'bushy' },
  { label: '楠', kind: 'tree', genusKey: 'dragon' },
  { label: '桂', kind: 'tree', genusKey: 'bushy' },
  { label: '桃', kind: 'tree', genusKey: 'bushy' },
  { label: '梨', kind: 'tree', genusKey: 'bushy' },
  { label: '梅', kind: 'tree', genusKey: 'bushy' },
  // 多肉 (40–49) → zamia(苏铁/多肉型)
  { label: '仙人掌', kind: 'succulent', genusKey: 'zamia' },
  { label: '芦荟', kind: 'succulent', genusKey: 'zamia' },
  { label: '石莲花', kind: 'succulent', genusKey: 'zamia' },
  { label: '玉露', kind: 'succulent', genusKey: 'zamia' },
  { label: '虹之玉', kind: 'succulent', genusKey: 'zamia' },
  { label: '熊童子', kind: 'succulent', genusKey: 'zamia' },
  { label: '桃蛋', kind: 'succulent', genusKey: 'zamia' },
  { label: '法师', kind: 'succulent', genusKey: 'zamia' },
  { label: '生石花', kind: 'succulent', genusKey: 'zamia' },
  { label: '条纹十二卷', kind: 'succulent', genusKey: 'zamia' }
]

export function pickStickyPlantSpeciesIndex(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  const n = STICKY_PLANT_SPECIES.length
  return ((h % n) + n) % n
}
