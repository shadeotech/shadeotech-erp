'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface BarData {
  label: string
  value: number
  color?: string
}

interface VerticalBarChartProps {
  title: string
  data: BarData[]
}

export function VerticalBarChart({ title, data }: VerticalBarChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === 'dark'

  // Colors matching the image: Linux (light purple), Mac (teal/mint), iOS (black/dark gray), Windows (light blue), Android (light blue/gray), Other (teal/mint)
  const defaultColors = ['#C4B5FD', '#6EE7B7', isDark ? '#6B7280' : '#111827', '#93C5FD', '#9CA3AF', '#6EE7B7']
  
  const chartData: ChartData<'bar'> = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item, index) => item.color || defaultColors[index % defaultColors.length]),
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 32,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        displayColors: false,
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
        titleColor: isDark ? '#FFFFFF' : '#111827',
        bodyColor: isDark ? '#D1D5DB' : '#6B7280',
        borderColor: isDark ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.parsed.y ? (context.parsed.y / 1000).toFixed(0) : 0}K`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: isDark ? '#9CA3AF' : '#6B7280',
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 35000,
        ticks: {
          stepSize: 10000,
          callback: (value) => `${(value as number) / 1000}K`,
          font: {
            size: 11,
          },
          color: isDark ? '#9CA3AF' : '#9CA3AF',
        },
        grid: {
          color: isDark ? '#374151' : '#F3F4F6',
        },
      },
    },
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
      <div className="h-64 w-full">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
