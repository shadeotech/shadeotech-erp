'use client'

interface MonthlyTargetWidgetProps {
  title: string
  actual: number
  target: number
}

function fmt(n: number) {
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return `$${n.toLocaleString()}`
}

export function MonthlyTargetWidget({ title, actual, target }: MonthlyTargetWidgetProps) {
  const safeTarget = target || 1
  const pct = Math.min((actual / safeTarget) * 100, 100)

  // Build scale ticks (0, 25%, 50%, 75%, 100% of target)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((v) => ({
    label: fmt(Math.round(target * v)),
    pct: v * 100,
  }))

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Gradient bar */}
        <div className="space-y-2">
          <div className="relative h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {/* Fill */}
            <div
              className="absolute left-0 top-0 h-full rounded-lg transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #C026D3 100%)',
              }}
            />
          </div>

          {/* Tick labels */}
          <div className="relative h-4">
            {ticks.map((t, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-gray-400 dark:text-gray-500 -translate-x-1/2"
                style={{ left: `${t.pct}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Monthly Actual</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{fmt(actual)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">This Month&apos;s Target</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{fmt(target)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
