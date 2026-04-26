'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface LineChartProps {
  title: string
  tabs?: string[]
}

export function LineChart({ title, tabs = ['Total Users', 'Total Projects', 'Operating Status'] }: LineChartProps) {
  const [activeTab, setActiveTab] = useState(tabs[0])
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === 'dark'

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

  // Data from the image description
  const thisYearData = [12000, 7000, 15000, 15000, 28000, 18000, 22000]
  const lastYearData = [5000, 13000, 8000, 21000, 13000, 20000, 28000]

  const data: ChartData<'line'> = {
    labels: months,
    datasets: [
      {
        label: 'This year',
        data: thisYearData,
        borderColor: isDark ? '#A855F7' : '#111827',
        backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(17, 24, 39, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Last year',
        data: lastYearData,
        borderColor: '#93C5FD',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: {
            size: 12,
          },
          color: isDark ? '#FFFFFF' : '#6B7280',
          generateLabels: (chart) => {
            return [
              {
                text: 'This year',
                fillStyle: isDark ? '#A855F7' : '#111827',
                strokeStyle: isDark ? '#A855F7' : '#111827',
                lineWidth: 2,
                hidden: false,
                index: 0,
              },
              {
                text: 'Last year',
                fillStyle: '#93C5FD',
                strokeStyle: '#93C5FD',
                lineWidth: 2,
                borderDash: [5, 5],
                hidden: false,
                index: 1,
              },
            ]
          },
        },
      },
      tooltip: {
        enabled: true,
        displayColors: true,
        backgroundColor: isDark ? '#374151' : '#FFFFFF',
        titleColor: isDark ? '#FFFFFF' : '#111827',
        bodyColor: isDark ? '#D1D5DB' : '#6B7280',
        borderColor: isDark ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y ? (context.parsed.y / 1000).toFixed(0) : 0}K`,
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
          color: isDark ? '#9CA3AF' : '#9CA3AF',
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 30000,
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
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'text-sm font-medium transition-colors',
                activeTab === tab ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-64 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
