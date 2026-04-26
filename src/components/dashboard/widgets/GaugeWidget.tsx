'use client'

interface GaugeWidgetProps {
  title: string
  actual: number
  target: number
  label?: string
}

function fmt(n: number) {
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return String(n)
}

export function GaugeWidget({ title, actual, target, label = 'ACTUAL' }: GaugeWidgetProps) {
  const safeTarget = target || 1
  const pct = Math.min(actual / safeTarget, 1)

  // SVG arc parameters — semicircle, left=0, right=180 deg
  const cx = 100, cy = 100, r = 72
  const startAngle = 180 // degrees, left end
  const sweep = 180 * pct  // how many degrees the arc covers

  function polarToXY(deg: number, radius: number) {
    const rad = (deg * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  // Arc from 180° (left) sweeping counter-clockwise by `sweep` degrees
  // We draw from 180 down to (180 - sweep), going rightward
  const arcStart = polarToXY(180, r)
  const arcEnd = polarToXY(180 - sweep, r)
  const arcLarge = sweep > 180 ? 1 : 0

  // Needle angle: 180° = 0 (left), 0° = 100%
  const needleAngle = 180 - pct * 180
  const needleLen = 58
  const needleTip = polarToXY(needleAngle, needleLen)

  // Track (grey background) arc
  const trackEnd = polarToXY(0, r)

  // Scale tick marks — evenly spaced labels around the arc
  const scaleValues = [0, 0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</span>
      </div>

      <div className="p-4 pb-2">
        <svg viewBox="0 0 200 115" className="w-full max-w-[260px] mx-auto overflow-visible">
          {/* Track (grey background arc) */}
          <path
            d={`M ${polarToXY(180, r).x} ${polarToXY(180, r).y}
                A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Colored progress arc */}
          {pct > 0.01 && (
            <path
              d={`M ${arcStart.x} ${arcStart.y}
                  A ${r} ${r} 0 ${arcLarge} 1 ${arcEnd.x} ${arcEnd.y}`}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="14"
              strokeLinecap="round"
            />
          )}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>

          {/* Scale labels */}
          {scaleValues.map((v, i) => {
            const ang = 180 - v * 180
            const lp = polarToXY(ang, r + 16)
            return (
              <text
                key={i}
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill="#9CA3AF"
              >
                {fmt(target * v)}
              </text>
            )
          })}

          {/* Target marker triangle */}
          {(() => {
            const tp = polarToXY(0, r)
            return (
              <polygon
                points={`${tp.x},${tp.y - 8} ${tp.x - 5},${tp.y + 2} ${tp.x + 5},${tp.y + 2}`}
                fill="#1F2937"
              />
            )
          })()}

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="#1F2937"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill="#1F2937" />
        </svg>

        {/* Stats below */}
        <div className="flex justify-around mt-1 pb-3">
          <div className="text-center">
            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(actual)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">TARGET</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(target)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
