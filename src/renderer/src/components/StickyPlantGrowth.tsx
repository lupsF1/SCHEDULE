import { STICKY_PLANT_SPECIES, type StickyPlantSpecies } from '../domain/stickyPlantKinds'
import { type ReactElement } from 'react'

type Props = {
  speciesIndex: number
  progress: number
}

function FlowerSvg({ hue, stemBase, blossom }: StickyPlantSpecies & { stemBase: string; blossom: number }): ReactElement {
  const p = blossom
  const stemH = 26 + p * 46
  const petalOpacity = Math.min(1, Math.max(0, (p - 0.06) / 0.94))
  const bloom = 0.12 + Math.pow(Math.min(1, p), 0.92) * 0.92
  const cy = 86 - stemH + 16 * bloom
  const peak = Math.min(1, Math.max(0, (p - 0.96) / 0.04))
  const haloR = 22 + peak * 6

  return (
    <g>
      <line
        x1={40}
        y1={92}
        x2={40}
        y2={92 - stemH}
        stroke={stemBase}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <g transform={`translate(40 ${cy})`}>
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
          {[0, 72, 144, 216, 288].map((deg, tier) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <ellipse
                cx={0}
                cy={-13}
                rx={9 + peak * 1.8}
                ry={17 + peak * 1.6}
                fill={`hsl(${hue} ${62 + peak * 4}% ${54 - tier * 1.6 + peak * 2}%)`}
                opacity={0.82 + p * 0.13 + peak * 0.08}
              />
            </g>
          ))}
          <circle r={Math.max(3, 13 * bloom + peak * 3)} cx={0} cy={4} fill={`hsl(${hue} 74% ${44 + p * 10 + peak * 5}%)`} opacity={0.95} />
          {peak > 0 ? (
            <circle
              r={Math.max(3, 9 * bloom)}
              cx={0}
              cy={4}
              fill="rgba(255,252,240,0.42)"
              opacity={peak * 0.9}
            />
          ) : null}
        </g>
      </g>
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

  const tri = (tier: number, topLift: number, width: number, height: number) => {
    const oy = tier * (-6 * s)
    const yA = trunkTop + oy - topLift * s
    const yB = trunkTop + oy + height * s
    const half = (width * s) / 2
    return `${40},${yA} ${40 - half},${yB} ${40 + half},${yB}`
  }

  const topY =
    trunkTop +
    (-6 * s * 2) -
    (38 * s)

  return (
    <g opacity={Math.max(0.25, vis)}>
      <polygon points={`${40 - tw / 2},${90} ${40 + tw / 2},${90} ${40 + tw / 6},${trunkTop + 14} ${40 - tw / 6},${trunkTop + 14}`} fill={trunk} />
      <polygon fill={`hsl(${hue} ${36 + vis * 8}% ${30 + vis * 5}%)`} points={tri(0, 72, 70, 22)} opacity={0.92} />
      <polygon fill={`hsl(${hue + 6} ${40 + vis * 6}% ${44 + vis * 5}%)`} points={tri(1, 56, 58, 20)} opacity={0.93} />
      <polygon
        fill={`hsl(${hue + 22} ${35 + vis * 6}% ${58 + vis * 4}%)`}
        points={tri(2, 38, 40, 16)}
        opacity={0.94}
      />
      {peak > 0 ? (
        <g aria-hidden="true">
          <circle cx={40} cy={topY + 14 * vis} r={14 * s + peak * 10} fill="rgba(255,252,246,0.14)" opacity={peak} />
          <circle cx={40 - 22 * vis} cy={topY + 22 * vis} r={3.8} fill="rgba(255,253,226,0.55)" opacity={peak * 0.85} />
          <circle cx={40 + 20 * vis} cy={topY + 26 * vis} r={3.2} fill="rgba(255,253,226,0.42)" opacity={peak * 0.75} />
        </g>
      ) : null}
      <ellipse cx={40} cy={94} rx={36 * s} ry={5} fill="rgba(24,83,62,0.14)" opacity={0.2 + vis * 0.55} />
    </g>
  )
}

export function StickyPlantGrowth({ speciesIndex, progress }: Props): ReactElement {
  const clamped = Math.min(1, Math.max(0, progress))
  const sp = STICKY_PLANT_SPECIES[speciesIndex] ?? STICKY_PLANT_SPECIES[0]
  const hue = sp.hue
  const trunk = `hsl(${Math.max(hue - 12, 0)} ${sp.kind === 'tree' ? 24 : 32}% ${sp.kind === 'tree' ? 28 : 32}%)`
  const blossom = clamped

  const kindLabel = sp.kind === 'flower' ? '花' : '树'
  const ariaLabel = `${sp.label}（${kindLabel}），生长动画与倒计时同步`

  return (
    <div className="sticky-plant-slot">
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
        ) : (
          <TreeSvg hue={hue} trunk={trunk} blossom={blossom} />
        )}
      </svg>
    </div>
  )
}
