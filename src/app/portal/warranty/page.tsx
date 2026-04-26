'use client'

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
import { ShieldCheck, Search, Calendar, Package } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

// Mock warranty data - in production, this would come from API
const mockWarranties = [
  {
    orderId: 'ORD-001',
    orderNumber: 'ORD-001',
    installationDate: new Date('2024-01-15'),
    items: [
      { name: 'Motor & Accessories', warrantyYears: 5, expiryDate: new Date('2029-01-15'), status: 'Active' },
      { name: 'Fabric', warrantyYears: 10, expiryDate: new Date('2034-01-15'), status: 'Active' },
      { name: 'Components', warrantyYears: -1, expiryDate: null, status: 'Lifetime' },
    ],
  },
  {
    orderId: 'ORD-002',
    orderNumber: 'ORD-002',
    installationDate: new Date('2023-06-20'),
    items: [
      { name: 'Fabric', warrantyYears: 10, expiryDate: new Date('2033-06-20'), status: 'Active' },
      { name: 'Components', warrantyYears: -1, expiryDate: null, status: 'Lifetime' },
    ],
  },
]

const getWarrantyStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-500/10 text-green-700 dark:text-green-400'
    case 'Expired':
      return 'bg-red-500/10 text-red-700 dark:text-red-400'
    case 'Lifetime':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
  }
}

export default function WarrantyPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredWarranties = mockWarranties.filter(w =>
    w.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Warranty Registration
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            View warranty status for your orders
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Warranty Cards */}
      <div className="space-y-4">
        {filteredWarranties.map((warranty) => (
          <Card key={warranty.orderId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order {warranty.orderNumber}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Installed on {format(warranty.installationDate, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Warranty Period</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warranty.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.warrantyYears === -1 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">Lifetime</span>
                        ) : (
                          <span>{item.warrantyYears} years</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.expiryDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(item.expiryDate, 'MMM dd, yyyy')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getWarrantyStatusColor(item.status)} border-0`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWarranties.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No warranties found</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
