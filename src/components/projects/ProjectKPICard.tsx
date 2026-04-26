'use client'

interface ProjectKPICardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative'
  icon: React.ReactNode
  bgColor: string
}

export function ProjectKPICard({
  title,
  value,
  change,
  changeType,
  icon,
  bgColor,
}: ProjectKPICardProps) {
  return (
    <div className={`rounded-xl p-5 ${bgColor}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-700">{title}</span>
            <span className="text-gray-400 dark:text-gray-600">{icon}</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-800">{value}</span>
            {change && (
              <span
                className={`text-xs ${
                  changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {changeType === 'positive' ? '+' : ''}{change} ↗
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

