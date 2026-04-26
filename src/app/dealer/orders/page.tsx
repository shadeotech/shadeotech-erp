'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Eye, CreditCard, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import type { ProductionOrder } from '@/types/production'

const statusColors: Record<string, string> = {
  PENDING_APPROVAL: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  READY_FOR_PRODUCTION: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  PRODUCTION_CHECK: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  COMPONENT_CUT: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  FABRIC_CUT: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  ASSEMBLE: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  QUALITY_CHECK: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  PACKING: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  SHIPPED_INSTALLED: 'bg-green-500/10 text-green-700 dark:text-green-400',
}

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'Pending',
  READY_FOR_PRODUCTION: 'Processing',
  PRODUCTION_CHECK: 'Processing',
  COMPONENT_CUT: 'Processing',
  FABRIC_CUT: 'Processing',
  ASSEMBLE: 'Processing',
  QUALITY_CHECK: 'Processing',
  PACKING: 'Processing',
  SHIPPED_INSTALLED: 'Completed',
}

export default function DealerOrdersPage() {
  const { token, user } = useAuthStore()
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      // Fetch orders for this dealer
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load orders')
      }
      const data = await res.json()
      // Filter orders for this dealer
      const dealerOrders = (data.orders || []).filter((order: any) => 
        order.dealerId === user?._id
      )
      // Convert date strings to Date objects
      const ordersWithDates = dealerOrders.map((order: any) => ({
        ...order,
        orderDate: order.orderDate ? new Date(order.orderDate) : new Date(),
        installationDate: order.installationDate ? new Date(order.installationDate) : undefined,
        approvalDate: order.approvalDate ? new Date(order.approvalDate) : undefined,
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
      }))
      setOrders(ordersWithDates)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your orders
            </p>
          </div>
          <Link href="/dealer/orders/new">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Place New Order
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your orders
            </p>
          </div>
          <Link href="/dealer/orders/new">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Place New Order
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-medium">Error loading orders</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your orders
          </p>
        </div>
        <Link href="/dealer/orders/new">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Place New Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[order.status] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400'}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.totalShades}</TableCell>
                      <TableCell className="font-medium">-</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(order.orderDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dealer/orders/${order._id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

