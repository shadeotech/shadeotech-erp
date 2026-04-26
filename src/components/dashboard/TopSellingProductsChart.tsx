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

// Register the Chart.js components we use
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const labels = ['Phones', 'Laptops', 'Headsets', 'Games', 'Keyboardsy', 'Monitors']

const data: ChartData<'bar'> = {
  labels,
  datasets: [
    {
      data: [17, 30, 22, 33, 15, 27],
      backgroundColor: [
        '#A5B4FC', // Phones - soft indigo
        '#6EE7B7', // Laptops - mint
        '#000000', // Headsets - black
        '#60A5FA', // Games - blue
        '#C4B5FD', // Keyboardsy - lavender
        '#6EE7B7', // Monitors - mint
      ],
      borderRadius: 12,
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
      callbacks: {
        label: (context) => `${context.parsed.y}K`,
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
        color: '#9CA3AF',
      },
      border: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      max: 30,
      ticks: {
        stepSize: 10,
        callback: (value) => `${value}K`,
        font: {
          size: 11,
        },
        color: '#9CA3AF',
      },
      grid: {
        color: '#E5E7EB',
        // @ts-ignore - drawBorder exists at runtime on Chart.js grid options
        drawBorder: false,
      },
    },
  },
}

export function TopSellingProductsChart() {
  return (
    <div className="h-64 w-full">
      <Bar data={data} options={options} />
    </div>
  )
}


