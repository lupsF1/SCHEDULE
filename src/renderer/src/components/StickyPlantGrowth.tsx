import { STICKY_PLANT_SPECIES } from '../domain/stickyPlantKinds'
import { createPlant } from '../plantEngine/generators/svgPlantGen'
import { useEffect, useRef, useMemo, type ReactElement } from 'react'

type Props = {
  speciesIndex: number
  progress: number
}

export function StickyPlantGrowth({ speciesIndex, progress }: Props): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const plantRef = useRef<ReturnType<typeof createPlant> | null>(null)
  const clamped = Math.min(1, Math.max(0, progress))

  const sp = STICKY_PLANT_SPECIES[speciesIndex] ?? STICKY_PLANT_SPECIES[0]!
  const seed = useMemo(() => `species-${speciesIndex}`, [speciesIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 创建植物实例
    const plant = createPlant(sp.genusKey, seed, {
      age: clamped,
      potSize: 0.3,
      color: true
    })
    plantRef.current = plant

    // 挂载 SVG
    container.innerHTML = ''
    container.appendChild(plant.svgElement)

    return () => {
      container.innerHTML = ''
      plantRef.current = null
    }
  }, [sp.genusKey, seed]) // 不依赖 progress，避免重建 SVG

  // 更新生长进度
  useEffect(() => {
    const plant = plantRef.current
    if (!plant) return
    plant.age = clamped
    plant.update(true, true)
  }, [clamped])

  const kindLabel = sp.kind === 'flower' ? '花' : sp.kind === 'tree' ? '树' : '多肉'
  const ariaLabel = `${sp.label}（${kindLabel}），生长动画与倒计时同步`

  return (
    <div
      ref={containerRef}
      className="sticky-plant-slot"
      role="img"
      aria-label={ariaLabel}
    />
  )
}

export function LawnPlantGrowth({
  speciesIndex,
  progress
}: {
  speciesIndex: number
  progress: number
}): ReactElement {
  const count = 12
  const positions = useMemo(() => {
    const seed = speciesIndex * 137
    return Array.from({ length: count }, (_, i) => {
      const h = (seed + i * 31) % 100
      return {
        left: (h * 7 + i * 13) % 90 + 5,
        bottom: (h * 3 + i * 17) % 30 + 2,
        scale: 0.5 + ((h * 11) % 50) / 100
      }
    })
  }, [speciesIndex])

  return (
    <div className="sticky-plant-lawn">
      {positions.map((pos, i) => {
        const threshold = i / count
        const plantProgress = Math.max(0, Math.min(1, (progress - threshold * 0.8) / (1 - threshold * 0.8)))
        return (
          <div
            key={i}
            className="sticky-plant-lawn-blade"
            style={{
              left: `${pos.left}%`,
              bottom: `${pos.bottom}%`,
              transform: `scale(${pos.scale})`,
              opacity: Math.min(1, plantProgress * 3 + 0.2)
            }}
          >
            <StickyPlantGrowth
              speciesIndex={(speciesIndex + i * 3) % STICKY_PLANT_SPECIES.length}
              progress={plantProgress}
            />
          </div>
        )
      })}
    </div>
  )
}
