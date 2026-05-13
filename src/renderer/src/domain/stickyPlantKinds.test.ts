import { describe, expect, it } from 'vitest'
import { STICKY_PLANT_SPECIES, pickStickyPlantSpeciesIndex } from './stickyPlantKinds'

describe('stickyPlantKinds', () => {
  it('has 40 species: 20 flowers then 20 trees', () => {
    expect(STICKY_PLANT_SPECIES.length).toBe(40)
    const flowers = STICKY_PLANT_SPECIES.filter((s) => s.kind === 'flower')
    const trees = STICKY_PLANT_SPECIES.filter((s) => s.kind === 'tree')
    expect(flowers).toHaveLength(20)
    expect(trees).toHaveLength(20)
    expect(STICKY_PLANT_SPECIES.slice(0, 20).every((s) => s.kind === 'flower')).toBe(true)
    expect(STICKY_PLANT_SPECIES.slice(20).every((s) => s.kind === 'tree')).toBe(true)
  })

  it('pickStickyPlantSpeciesIndex is stable per seed', () => {
    expect(pickStickyPlantSpeciesIndex('task-uuid-1')).toBe(pickStickyPlantSpeciesIndex('task-uuid-1'))
    expect(pickStickyPlantSpeciesIndex('task-uuid-1')).not.toBe(pickStickyPlantSpeciesIndex('task-uuid-2'))
  })

  it('pickStickyPlantSpeciesIndex can vary with session suffix (focus replant)', () => {
    const base = 'same-id\u0378same-day'
    const indices = ['idle', 'sess-a', 'sess-b', 'sess-c'].map((suf) =>
      pickStickyPlantSpeciesIndex(`${base}\u0378${suf}`)
    )
    expect(new Set(indices).size).toBeGreaterThanOrEqual(2)
  })
})
