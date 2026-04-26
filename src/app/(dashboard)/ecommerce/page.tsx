'use client'

import { TrendingUp, TrendingDown, Eye, Users, ShoppingCart, DollarSign } from 'lucide-react'

// KPI Card Component
interface KPICardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: React.ReactNode
  highlighted?: boolean
}

function KPICard({ title, value, change, changeType, icon, highlighted }: KPICardProps) {
  return (
    <div className={`rounded-xl p-4 ${highlighted ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{title}</span>
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</span>
        <span className={`text-xs flex items-center gap-0.5 ${changeType === 'positive' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {change}
          {changeType === 'positive' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </span>
      </div>
    </div>
  )
}

// Projections vs Actuals Bar Chart
function ProjectionsChart() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const data = [
    { projection: 18, actual: 22, actual2: 15 },
    { projection: 22, actual: 28, actual2: 18 },
    { projection: 15, actual: 20, actual2: 12 },
    { projection: 25, actual: 30, actual2: 20 },
    { projection: 20, actual: 25, actual2: 16 },
    { projection: 18, actual: 22, actual2: 14 },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 h-full">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Projections vs Actuals</h3>
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 h-24">
              <div 
                className="w-2 bg-gray-200 rounded-t"
                style={{ height: `${(item.projection / 30) * 100}%` }}
              />
              <div 
                className="w-2 bg-blue-400 rounded-t"
                style={{ height: `${(item.actual / 30) * 100}%` }}
              />
              <div 
                className="w-2 bg-purple-400 rounded-t"
                style={{ height: `${(item.actual2 / 30) * 100}%` }}
              />
              <div 
                className="w-2 bg-teal-400 rounded-t"
                style={{ height: `${(item.projection / 30) * 80}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{months[index]}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1 mt-2 text-[10px] text-gray-400">
        <span>0</span>
        <span className="mx-2">10K</span>
        <span className="mx-2">20K</span>
        <span>30K</span>
      </div>
    </div>
  )
}

// Revenue Line Chart
function RevenueChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-sm font-medium text-gray-900">Revenue</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-900" />
            <span className="text-gray-500">Current Week</span>
            <span className="font-medium text-gray-900">$58,211</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300 border border-dashed border-gray-400" />
            <span className="text-gray-500">Previous Week</span>
            <span className="font-medium text-gray-900">$68,768</span>
          </div>
        </div>
      </div>
      <div className="relative h-48">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2">
          <span>30K</span>
          <span>20K</span>
          <span>10K</span>
          <span>0</span>
        </div>
        {/* Chart area */}
        <div className="ml-8 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-gray-100 w-full" />
            ))}
          </div>
          {/* SVG Chart */}
          <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
            {/* Previous week (dashed) */}
            <path
              d="M0,120 Q50,100 80,110 T160,80 T240,60 T320,90 T400,70"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            {/* Current week (solid) */}
            <path
              d="M0,130 Q50,110 80,100 T160,40 T240,30 T320,50 T400,60"
              fill="none"
              stroke="#1F2937"
              strokeWidth="2"
            />
          </svg>
          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Revenue by Location
function RevenueByLocation() {
  const locations = [
    { name: 'New York', value: '72K', color: 'bg-blue-500' },
    { name: 'San Francisco', value: '39K', color: 'bg-purple-500' },
    { name: 'Sydney', value: '25K', color: 'bg-teal-500' },
    { name: 'Singapore', value: '61K', color: 'bg-indigo-500' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 h-full">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Revenue by Location</h3>
      {/* World Map Placeholder */}
      <div className="relative h-32 mb-4 bg-blue-50/50 rounded-lg overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full h-full opacity-30">
          <ellipse cx="100" cy="50" rx="80" ry="40" fill="#93C5FD" />
          <circle cx="50" cy="40" r="3" fill="#3B82F6" />
          <circle cx="70" cy="45" r="3" fill="#3B82F6" />
          <circle cx="150" cy="55" r="3" fill="#3B82F6" />
          <circle cx="170" cy="50" r="3" fill="#3B82F6" />
        </svg>
        {/* Map dots */}
        <div className="absolute top-6 left-1/4 w-2 h-2 bg-blue-500 rounded-full" />
        <div className="absolute top-8 left-1/3 w-2 h-2 bg-purple-500 rounded-full" />
        <div className="absolute bottom-8 right-1/4 w-2 h-2 bg-teal-500 rounded-full" />
        <div className="absolute top-12 right-1/3 w-2 h-2 bg-indigo-500 rounded-full" />
      </div>
      {/* Location list */}
      <div className="space-y-2">
        {locations.map((location) => (
          <div key={location.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${location.color}`} />
              <span className="text-gray-600">{location.name}</span>
            </div>
            <span className="font-medium text-gray-900">{location.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Top Selling Products Table
function TopSellingProducts() {
  const products = [
    { name: 'ASOS Ridley High Waist', price: '$79.49', quantity: 82, amount: '$6,518.18' },
    { name: 'Marco Lightweight Shirt', price: '$128.50', quantity: 37, amount: '$4,754.50' },
    { name: 'Half Sleeve Shirt', price: '$39.99', quantity: 64, amount: '$2,559.36' },
    { name: 'Lightweight Jacket', price: '$20.00', quantity: 184, amount: '$3,680.00' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Top Selling Products</h3>
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-400">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Price</th>
            <th className="pb-3 font-medium">Quantity</th>
            <th className="pb-3 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index} className="border-t border-gray-50">
              <td className="py-3 text-sm text-gray-900">{product.name}</td>
              <td className="py-3 text-sm text-gray-500">{product.price}</td>
              <td className="py-3 text-sm text-gray-500">{product.quantity}</td>
              <td className="py-3 text-sm text-gray-900 font-medium">{product.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Total Sales Donut Chart
function TotalSales() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 h-full">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Total Sales</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-36 h-36">
          {/* Donut chart */}
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="12"
            />
            {/* Direct segment (larger) */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#1F2937"
              strokeWidth="12"
              strokeDasharray="180 251.2"
              strokeLinecap="round"
            />
            {/* Affiliate segment */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="12"
              strokeDasharray="57 251.2"
              strokeDashoffset="-180"
              strokeLinecap="round"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-gray-900">22.8%</span>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-900" />
            <span className="text-gray-600">Direct</span>
          </div>
          <span className="font-medium text-gray-900">$300.56</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-gray-600">Affiliate</span>
          </div>
          <span className="font-medium text-gray-900">$135.18</span>
        </div>
      </div>
    </div>
  )
}

export default function ECommercePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-900">eCommerce</h1>

      {/* Top Section: KPIs + Projections Chart */}
      <div className="grid grid-cols-12 gap-4">
        {/* KPI Cards */}
        <div className="col-span-5 grid grid-cols-2 gap-4">
          <KPICard
            title="Views"
            value="3,781"
            change="+11.01%"
            changeType="positive"
            icon={<Eye className="w-4 h-4" />}
            highlighted
          />
          <KPICard
            title="Customers"
            value="1,219"
            change="-0.03%"
            changeType="negative"
            icon={<Users className="w-4 h-4" />}
          />
          <KPICard
            title="Orders"
            value="316"
            change="+6.08%"
            changeType="positive"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <KPICard
            title="Revenue"
            value="$695"
            change="+15.03%"
            changeType="positive"
            icon={<DollarSign className="w-4 h-4" />}
          />
        </div>
        {/* Projections Chart */}
        <div className="col-span-7">
          <ProjectionsChart />
        </div>
      </div>

      {/* Middle Section: Revenue Chart + Location */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <RevenueChart />
        </div>
        <div className="col-span-4">
          <RevenueByLocation />
        </div>
      </div>

      {/* Bottom Section: Products Table + Total Sales */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <TopSellingProducts />
        </div>
        <div className="col-span-4">
          <TotalSales />
        </div>
      </div>
    </div>
  )
}

