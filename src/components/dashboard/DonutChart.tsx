'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

interface DonutData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  title: string
  data: DonutData[]
}

export function DonutChart({ title, data }: DonutChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === 'dark'

  const chartData: ChartData<'doughnut'> = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) => item.color),
        borderColor: isDark ? '#4B5563' : '#F3F4F6',
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    spacing: 0,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
        titleColor: isDark ? '#FFFFFF' : '#111827',
        bodyColor: isDark ? '#D1D5DB' : '#6B7280',
        borderColor: isDark ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0)
            const percentage = ((context.parsed / total) * 100).toFixed(1)
            return `${context.label}: ${percentage}%`
          },
        },
      },
    },
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
      <div className="flex items-start gap-6">
        {/* Donut Chart */}
        <div className="h-32 w-32 flex-shrink-0">
          <Doughnut data={chartData} options={options} />
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 pt-1">
          {data.map((item) => {
            const total = data.reduce((sum, d) => sum + d.value, 0)
            const percentage = ((item.value / total) * 100).toFixed(1)
            return (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{percentage}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
