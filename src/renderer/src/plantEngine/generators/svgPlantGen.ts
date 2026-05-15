import {
  SvgPlant,
  BushyPlantGenus,
  DragonTreeGenus,
  ZamiaGenus,
  PileaGenus,
  type BaseGenus
} from 'svg-plant'

export type PlantGenusKey = 'bushy' | 'dragon' | 'zamia' | 'pilea'

const genusMap: Record<PlantGenusKey, (seed: string) => BaseGenus> = {
  bushy: (seed) => new BushyPlantGenus(seed),
  dragon: (seed) => new DragonTreeGenus(seed),
  zamia: (seed) => new ZamiaGenus(seed),
  pilea: (seed) => new PileaGenus(seed)
}

export interface PlantConfig {
  age?: number
  potSize?: number
  color?: boolean
}

export function createPlant(
  genusKey: PlantGenusKey,
  seed: string,
  cfg: PlantConfig = {}
): SvgPlant {
  const genus = genusMap[genusKey](seed)
  return new SvgPlant(genus, {
    age: cfg.age ?? 0,
    potSize: cfg.potSize ?? 0.3,
    color: cfg.color ?? true
  })
}

export function getPlantSvgHtml(
  genusKey: PlantGenusKey,
  seed: string,
  age: number,
  potSize?: number
): string {
  const plant = createPlant(genusKey, seed, { age, potSize })
  return plant.svgElement.outerHTML
}
