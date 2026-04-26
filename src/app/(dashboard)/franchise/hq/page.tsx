'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign,
  ArrowRight,
  MapPin,
  Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Mock franchise stats
const stats = {
  totalFranchises: 24,
  activeFranchises: 22,
  pendingRequests: 3,
  monthlyRevenue: 125000,
}

// Mock recent franchisees
const recentFranchisees = [
  { id: '1', name: 'At Shades - Orange County', owner: 'Mike Williams', location: 'Irvine, CA', status: 'ACTIVE', monthlyOrders: 45 },
  { id: '2', name: 'At Shades - San Diego', owner: 'Sarah Chen', location: 'San Diego, CA', status: 'ACTIVE', monthlyOrders: 38 },
  { id: '3', name: 'At Shades - Phoenix', owner: 'John Martinez', location: 'Phoenix, AZ', status: 'PENDING', monthlyOrders: 0 },
]

// Mock pending installations
const pendingInstallations = [
  { id: '1', franchise: 'At Shades - OC', customer: 'ABC Corp', date: new Date('2024-01-25'), items: 12 },
  { id: '2', franchise: 'At Shades - SD', customer: 'Tech Solutions', date: new Date('2024-01-26'), items: 8 },
  { id: '3', franchise: 'At Shades - OC', customer: 'Jane Doe', date: new Date('2024-01-27'), items: 5 },
]

const statusStyles = {
  ACTIVE: 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  PENDING: 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  INACTIVE: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

export default function FranchiseHQPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Franchise HQ Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of all franchise operations
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Franchises
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFranchises}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeFranchises} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-green-500">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Across all franchises
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Franchisees List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Franchisees</CardTitle>
            <Link href="/franchise/franchisees">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFranchisees.map((franchise) => (
                <div
                  key={franchise.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{franchise.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {franchise.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={statusStyles[franchise.status as keyof typeof statusStyles]}
                    >
                      {franchise.status}
                    </Badge>
                    {franchise.monthlyOrders > 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {franchise.monthlyOrders} orders/mo
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Installations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Installations</CardTitle>
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                View Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInstallations.map((installation) => (
                <div
                  key={installation.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{installation.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {installation.franchise}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {installation.date.toLocaleDateString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {installation.items} items
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

