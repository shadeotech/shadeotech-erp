'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calculator, Plus, Edit, Trash2, Save, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'

// Mock estimates data
const mockEstimates = [
  { id: 'EST-001', number: 'EST-001', total: 8200, items: 5, createdAt: new Date('2025-01-20'), status: 'DRAFT' },
  { id: 'EST-002', number: 'EST-002', total: 12400, items: 8, createdAt: new Date('2025-01-15'), status: 'SAVED' },
  { id: 'EST-003', number: 'EST-003', total: 5600, items: 3, createdAt: new Date('2025-01-10'), status: 'SAVED' },
]

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  SAVED: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
}

export default function EstimatesPage() {
  const [search, setSearch] = useState('')
  const [estimates] = useState(mockEstimates)

  const filteredEstimates = estimates.filter(est =>
    est.number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Estimates</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Create and manage order estimates before placing orders
          </p>
        </div>
        <Link href="/dealer/estimates/new">
          <Button className="shadow-md hover:shadow-lg transition-shadow">
            <Plus className="h-4 w-4 mr-2" />
            Create Estimate
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search estimates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Estimates Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">All Estimates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableHead className="h-10">Estimate #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.length > 0 ? (
                  filteredEstimates.map((estimate) => (
                    <TableRow key={estimate.id} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {estimate.number}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColors[estimate.status]} border-0`}>
                          {estimate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {estimate.items} items
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(estimate.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(estimate.createdAt, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/dealer/estimates/new?id=${estimate.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-50 dark:hover:bg-green-950/30">
                              <Edit className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No estimates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
