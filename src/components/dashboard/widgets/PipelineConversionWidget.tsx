'use client'

interface Stage {
  label: string
  count: number
}

interface PipelineConversionWidgetProps {
  stages: Stage[]
}

export function PipelineConversionWidget({ stages }: PipelineConversionWidgetProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1)
  const first = stages[0]?.count || 1
  const last = stages[stages.length - 1]?.count || 0
  const conversionRate = first > 0 ? Math.round((last / first) * 100) : 0

  // Bar heights as % of max
  const BAR_H = 160

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pipeline Conversion</span>
      </div>

      <div className="p-4 flex gap-4 items-end">
        {/* Chart */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex items-end gap-0 min-w-0" style={{ height: `${BAR_H + 40}px` }}>
            {stages.map((stage, i) => {
              const heightPct = (stage.count / maxCount) * 100
              const barH = Math.max((stage.count / maxCount) * BAR_H, stage.count > 0 ? 8 : 0)
              const nextStage = stages[i + 1]
              const convPct = nextStage && stage.count > 0
                ? Math.round((nextStage.count / stage.count) * 100)
                : null

              const isLast = i === stages.length - 1
              const BAR_W = 44
              const GAP_W = 36

              return (
                <div key={stage.label} className="flex items-end shrink-0">
                  {/* Bar column */}
                  <div className="flex flex-col items-center" style={{ width: BAR_W }}>
                    {/* Count label */}
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">{stage.count}</span>
                    {/* Bar */}
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: barH,
                        background: isLast
                          ? 'linear-gradient(180deg, #4ADE80 0%, #16A34A 100%)'
                          : 'linear-gradient(180deg, #818CF8 0%, #6366F1 100%)',
                      }}
                    />
                    {/* Label */}
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 text-center leading-tight">
                      {stage.label}
                    </span>
                  </div>

                  {/* Conversion pct badge between bars */}
                  {!isLast && convPct !== null && (
                    <div className="flex flex-col items-center justify-end pb-6 shrink-0" style={{ width: GAP_W }}>
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-600 rounded-full px-1.5 py-0.5 whitespace-nowrap shadow-sm">
                        {convPct}%
                      </span>
                      {/* Funnel slope line */}
                      <svg
                        viewBox="0 0 36 20"
                        className="w-9 mt-0.5 opacity-30"
                        style={{ height: 20 }}
                        preserveAspectRatio="none"
                      >
                        <line x1="0" y1="0" x2="36" y2="20" stroke="#818CF8" strokeWidth="1.5" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Conversion to Won */}
        <div className="flex flex-col items-center justify-center shrink-0 w-20 text-center">
          <p className="text-3xl font-bold text-emerald-500">{conversionRate}%</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">Conversion to Won</p>
        </div>
      </div>
    </div>
  )
}
