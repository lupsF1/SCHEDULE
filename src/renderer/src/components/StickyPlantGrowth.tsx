import { STICKY_PLANT_SPECIES, type StickyPlantSpecies } from '../domain/stickyPlantKinds'
import { useMemo, type ReactElement } from 'react'

type Props = {
  speciesIndex: number
  progress: number
}

/** Drop-shaped petal path: pointed tip, rounded base */
function petalPath(rx: number, ry: number): string {
  return `M0,${-ry} C${rx * 0.6},${-ry * 0.6} ${rx},${-ry * 0.15} ${rx * 0.4},${ry * 0.35} Q0,${ry * 0.15} ${-rx * 0.4},${ry * 0.35} C${-rx},${-ry * 0.15} ${-rx * 0.6},${-ry * 0.6} 0,${-ry}Z`
}

function FlowerSvg({ hue, stemBase, blossom }: StickyPlantSpecies & { stemBase: string; blossom: number }): ReactElement {
  const p = blossom
  const stemH = 26 + p * 46
  const petalOpacity = Math.min(1, Math.max(0, (p - 0.06) / 0.94))
  const bloom = 0.12 + Math.pow(Math.min(1, p), 0.92) * 0.92
  const cy = 86 - stemH + 16 * bloom
  const peak = Math.min(1, Math.max(0, (p - 0.96) / 0.04))
  const haloR = 22 + peak * 6

  const leafOpacity = Math.min(1, Math.max(0, (p - 0.15) / 0.85))
  const leafScale = 0.4 + Math.min(1, p) * 0.6

  // Outer 5 petals (large)
  const outerPetals = [0, 72, 144, 216, 288]
  // Inner 3 petals (smaller, offset)
  const innerPetals = [36, 156, 276]

  return (
    <g>
      {/* Stem */}
      <line
        x1={40}
        y1={92}
        x2={40}
        y2={92 - stemH}
        stroke={stemBase}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Leaves on stem */}
      {leafOpacity > 0 ? (
        <g opacity={leafOpacity}>
          <path
            d={`M40,${82 - stemH * 0.3} Q${48 + leafScale * 6},${78 - stemH * 0.3} ${50 + leafScale * 4},${82 - stemH * 0.3 + 2}`}
            fill={`hsl(${hue + 30} 48% 42%)`}
            stroke="none"
            transform={`scale(${leafScale}) translate(${40 * (1 - leafScale)}, ${(82 - stemH * 0.3) * (1 - leafScale)})`}
          />
          <path
            d={`M40,${78 - stemH * 0.45} Q${32 - leafScale * 6},${74 - stemH * 0.45} ${30 - leafScale * 4},${78 - stemH * 0.45 + 2}`}
            fill={`hsl(${hue + 20} 44% 46%)`}
            stroke="none"
            transform={`scale(${leafScale}) translate(${40 * (1 - leafScale)}, ${(78 - stemH * 0.45) * (1 - leafScale)})`}
          />
        </g>
      ) : null}

      {/* Blossom group */}
      <g transform={`translate(40 ${cy})`}>
        {/* Halo ring */}
        {peak > 0 ? (
          <circle
            r={haloR * bloom}
            cx={0}
            cy={4}
            fill="none"
            stroke={`hsla(${hue}, 78%, 88%, ${0.08 + peak * 0.45})`}
            strokeWidth={1.75 + peak * 1.2}
            opacity={0.85 + peak * 0.12}
          />
        ) : null}

        <g opacity={Math.min(1, petalOpacity * 1.05)} transform={`scale(${bloom})`}>
          {/* Outer petals (5) */}
          {outerPetals.map((deg, tier) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <path
                d={petalPath(10 + peak * 1.8, 18 + peak * 1.6)}
                fill={`hsl(${hue} ${62 + peak * 4}% ${54 - tier * 1.6 + peak * 2}%)`}
                opacity={0.82 + p * 0.13 + peak * 0.08}
              />
            </g>
          ))}
          {/* Inner petals (3, smaller, offset angle) */}
          {innerPetals.map((deg, tier) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <path
                d={petalPath(7 + peak * 1.2, 13 + peak * 1.0)}
                fill={`hsl(${hue} ${58 + peak * 3}% ${48 - tier * 1.2 + peak * 2}%)`}
                opacity={0.78 + p * 0.15 + peak * 0.06}
              />
            </g>
          ))}

          {/* Stamen: outer ring */}
          <circle
            r={Math.max(3, 8 * bloom + peak * 2)}
            cx={0}
            cy={4}
            fill={`hsl(${hue} 60% ${40 + p * 8}%)`}
            opacity={0.9}
          />
          {/* Stamen: inner core */}
          <circle
            r={Math.max(2, 5 * bloom + peak * 1.5)}
            cx={0}
            cy={4}
            fill={`hsl(${hue} 74% ${44 + p * 10 + peak * 5}%)`}
            opacity={0.95}
          />
          {/* Stamen: highlight dots */}
          {peak > 0 ? (
            <>
              <circle r={Math.max(1, 2.5 * bloom)} cx={-2} cy={2} fill="rgba(255,252,240,0.6)" opacity={peak * 0.9} />
              <circle r={Math.max(1, 2 * bloom)} cx={2.5} cy={5} fill="rgba(255,252,240,0.45)" opacity={peak * 0.8} />
              <circle r={Math.max(1, 1.5 * bloom)} cx={0} cy={1} fill="rgba(255,255,255,0.55)" opacity={peak * 0.7} />
            </>
          ) : null}
        </g>
      </g>

      {/* Ground shadow */}
      <ellipse cx={40} cy={94} rx={26 * bloom} ry={5} fill="rgba(4,120,87,0.18)" opacity={0.3 + p * 0.52} />
    </g>
  )
}

function TreeSvg({
  hue,
  trunk,
  blossom
}: {
  hue: number
  trunk: string
  blossom: number
}): ReactElement {
  const p = blossom
  const trunkH = 22 + p * 48
  const trunkTop = 90 - trunkH
  const tw = Math.max(5, 6 + p * 3)

  const vis = Math.min(1, Math.max(0, (p - 0.03) / 0.97))
  const s = Math.pow(Math.min(1, p), 0.94)

  const peak = Math.min(1, Math.max(0, (p - 0.96) / 0.04))

  // Canopy layers as ellipses
  const canopyLayers = [
    { cy: trunkTop - 10 * s, rx: 30 * s, ry: 18 * s, hueShift: 0, lightness: 30 },
    { cy: trunkTop - 22 * s, rx: 24 * s, ry: 15 * s, hueShift: 6, lightness: 42 },
    { cy: trunkTop - 32 * s, rx: 16 * s, ry: 12 * s, hueShift: 14, lightness: 54 }
  ]

  // Leaf dots scattered on canopy
  const leafDots = [
    { cx: -18, cy: -8, r: 3.5 },
    { cx: 14, cy: -6, r: 3 },
    { cx: -8, cy: -18, r: 2.8 },
    { cx: 10, cy: -14, r: 3.2 },
    { cx: -2, cy: -24, r: 2.5 }
  ]

  return (
    <g opacity={Math.max(0.25, vis)}>
      {/* Trunk */}
      <polygon
        points={`${40 - tw / 2},${90} ${40 + tw / 2},${90} ${40 + tw / 6},${trunkTop + 14} ${40 - tw / 6},${trunkTop + 14}`}
        fill={trunk}
      />
      {/* Trunk texture lines */}
      <line
        x1={40 - tw / 4}
        y1={trunkTop + 20}
        x2={40 - tw / 5}
        y2={trunkTop + 40}
        stroke={`hsl(${hue} 20% 22%)`}
        strokeWidth={0.8}
        opacity={0.3}
      />
      <line
        x1={40 + tw / 5}
        y1={trunkTop + 25}
        x2={40 + tw / 6}
        y2={trunkTop + 45}
        stroke={`hsl(${hue} 20% 22%)`}
        strokeWidth={0.6}
        opacity={0.25}
      />

      {/* Canopy layers (ellipses) */}
      {canopyLayers.map((layer, i) => (
        <g key={i}>
          <ellipse
            cx={40}
            cy={layer.cy}
            rx={layer.rx}
            ry={layer.ry}
            fill={`hsl(${hue + layer.hueShift} ${36 + vis * 8}% ${layer.lightness + vis * 5}%)`}
            opacity={0.88 + i * 0.03}
          />
          {/* Leaf dots on this layer */}
          {leafDots.slice(i * 2, i * 2 + 3).map((dot, j) => (
            <ellipse
              key={j}
              cx={40 + dot.cx * s}
              cy={layer.cy + dot.cy * s * 0.6}
              rx={dot.r * s}
              ry={dot.r * s * 0.75}
              fill={`hsl(${hue + layer.hueShift + 10} ${42 + vis * 6}% ${layer.lightness + 10 + vis * 4}%)`}
              opacity={0.5 + vis * 0.3}
            />
          ))}
        </g>
      ))}

      {/* Peak glow */}
      {peak > 0 ? (
        <g aria-hidden="true">
          <circle
            cx={40}
            cy={canopyLayers[2]!.cy}
            r={14 * s + peak * 10}
            fill="rgba(255,252,246,0.14)"
            opacity={peak}
          />
          <circle cx={40 - 10 * vis} cy={canopyLayers[2]!.cy - 6 * vis} r={3.2} fill="rgba(255,253,226,0.55)" opacity={peak * 0.85} />
          <circle cx={40 + 8 * vis} cy={canopyLayers[2]!.cy - 4 * vis} r={2.6} fill="rgba(255,253,226,0.42)" opacity={peak * 0.75} />
        </g>
      ) : null}

      {/* Ground shadow + grass */}
      <ellipse cx={40} cy={94} rx={36 * s} ry={5} fill="rgba(24,83,62,0.14)" opacity={0.2 + vis * 0.55} />
      {/* Grass blades */}
      {vis > 0.3 ? (
        <g opacity={Math.min(1, (vis - 0.3) / 0.7)} stroke={`hsl(${hue + 20} 40% 38%)`} strokeWidth={1.2} strokeLinecap="round" fill="none">
          <path d={`M${32 - 8 * s},94 Q${30 - 6 * s},${90 - 4 * s} ${28 - 4 * s},${88 - 6 * s}`} />
          <path d={`M${48 + 8 * s},94 Q${50 + 6 * s},${90 - 4 * s} ${52 + 4 * s},${88 - 6 * s}`} />
          <path d={`M${40},94 Q${38},${91 - 3 * s} ${36},${89 - 5 * s}`} />
        </g>
      ) : null}
    </g>
  )
}

function SucculentSvg({
  hue,
  blossom
}: {
  hue: number
  blossom: number
}): ReactElement {
  const p = blossom
  const s = Math.pow(Math.min(1, p), 0.9)
  const vis = Math.min(1, Math.max(0, (p - 0.03) / 0.97))
  const peak = Math.min(1, Math.max(0, (p - 0.96) / 0.04))

  // Pot
  const potTop = 78
  const potH = 14

  // Rosette leaves: 3 layers of overlapping round leaves
  const leafLayers = [
    // Outer ring: 5 leaves
    ...[0, 72, 144, 216, 288].map((deg, i) => ({
      deg,
      rx: 10 + i * 0.4,
      ry: 14 + i * 0.3,
      cy: -4,
      layer: 0,
      hueShift: i * 3,
      lightness: 52
    })),
    // Middle ring: 4 leaves
    ...[30, 120, 210, 300].map((deg, i) => ({
      deg,
      rx: 7.5 + i * 0.3,
      ry: 11 + i * 0.2,
      cy: -10,
      layer: 1,
      hueShift: i * 4 + 8,
      lightness: 48
    })),
    // Inner: 3 leaves
    ...[0, 120, 240].map((deg, i) => ({
      deg,
      rx: 5 + i * 0.2,
      ry: 8 + i * 0.2,
      cy: -16,
      layer: 2,
      hueShift: i * 5 + 16,
      lightness: 44
    }))
  ]

  return (
    <g opacity={Math.max(0.25, vis)}>
      {/* Pot */}
      <path
        d={`M${40 - 16},${potTop} L${40 - 13},${potTop + potH} L${40 + 13},${potTop + potH} L${40 + 16},${potTop} Z`}
        fill={`hsl(28 22% 52%)`}
        opacity={0.85}
      />
      {/* Pot rim */}
      <rect x={40 - 18} y={potTop - 2} width={36} height={4} rx={2} fill={`hsl(28 18% 46%)`} opacity={0.9} />
      {/* Pot soil */}
      <ellipse cx={40} cy={potTop + 1} rx={14} ry={3} fill={`hsl(24 28% 32%)`} opacity={0.6} />

      {/* Rosette leaves */}
      <g transform={`translate(40 ${potTop - 4})`} opacity={vis}>
        {leafLayers.map((leaf, i) => {
          const leafS = s * (0.7 + leaf.layer * 0.15)
          return (
            <g key={i} transform={`rotate(${leaf.deg}) translate(0, ${leaf.cy * s})`}>
              <ellipse
                cx={0}
                cy={0}
                rx={leaf.rx * leafS}
                ry={leaf.ry * leafS}
                fill={`hsl(${hue + leaf.hueShift} ${40 + vis * 8}% ${leaf.lightness + vis * 4}%)`}
                opacity={0.85 + vis * 0.1}
                stroke={`hsl(${hue + leaf.hueShift} 35% ${leaf.lightness - 8}%)`}
                strokeWidth={0.5}
              />
              {/* Leaf highlight */}
              <ellipse
                cx={-leaf.rx * leafS * 0.2}
                cy={-leaf.ry * leafS * 0.3}
                rx={leaf.rx * leafS * 0.35}
                ry={leaf.ry * leafS * 0.25}
                fill={`hsl(${hue + leaf.hueShift} 50% ${leaf.lightness + 16}%)`}
                opacity={0.3 + vis * 0.2}
              />
            </g>
          )
        })}
        {/* Center rosette point */}
        {peak > 0 ? (
          <circle cx={0} cy={-18 * s} r={3 * s + peak * 2} fill={`hsl(${hue} 55% 58%)`} opacity={peak * 0.8} />
        ) : null}
      </g>
    </g>
  )
}

export function StickyPlantGrowth({ speciesIndex, progress }: Props): ReactElement {
  const clamped = Math.min(1, Math.max(0, progress))
  const sp = STICKY_PLANT_SPECIES[speciesIndex] ?? STICKY_PLANT_SPECIES[0]!
  const hue = sp.hue
  const trunk = `hsl(${Math.max(hue - 12, 0)} ${sp.kind === 'tree' ? 24 : 32}% ${sp.kind === 'tree' ? 28 : 32}%)`
  const blossom = clamped

  const kindLabel = sp.kind === 'flower' ? '花' : sp.kind === 'tree' ? '树' : '多肉'
  const ariaLabel = `${sp.label}（${kindLabel}），生长动画与倒计时同步`

  return (
    <div className={`sticky-plant-slot${clamped >= 0.96 ? ' sticky-plant-slot--peak' : ''}`}>
      <svg
        viewBox="0 0 80 94"
        width="76"
        height="88"
        role="img"
        aria-label={ariaLabel}
        className="sticky-plant-svg"
      >
        {sp.kind === 'flower' ? (
          <FlowerSvg {...sp} stemBase={trunk} blossom={blossom} />
        ) : sp.kind === 'tree' ? (
          <TreeSvg hue={hue} trunk={trunk} blossom={blossom} />
        ) : (
          <SucculentSvg hue={hue} blossom={blossom} />
        )}
      </svg>
    </div>
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
