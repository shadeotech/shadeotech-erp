'use client'

interface BarData {
  label: string
  value: number
  maxValue?: number
}

interface HorizontalBarChartProps {
  title: string
  data: BarData[]
}

export function HorizontalBarChart({ title, data }: HorizontalBarChartProps) {
  const maxValue = 100 // Maximum value for the bars

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col">
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
      <div className="flex-1 flex flex-col justify-center space-y-5 min-h-[256px]">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-20 text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
            <div className="flex-1">
              <div className="relative h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gray-900 dark:bg-gray-400 transition-all"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
