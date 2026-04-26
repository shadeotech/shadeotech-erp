'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Eye, 
  Edit,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Customer, CustomerStatus, CustomerType } from '@/types/database'

// Mock data
const mockCustomers: Customer[] = [
  {
    _id: '1',
    sideMark: 'SH-RGL12345',
    customerType: 'RESIDENTIAL',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Los Angeles, CA',
    leadSource: 'GOOGLE',
    status: 'CUSTOMER',
    numberOfWindows: 12,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    _id: '2',
    sideMark: 'SH-CMT23456',
    customerType: 'COMMERCIAL',
    companyName: 'ABC Corp',
    contactPerson: 'Jane Doe',
    email: 'jane@abccorp.com',
    phone: '(555) 234-5678',
    address: '456 Business Ave, San Diego, CA',
    companyType: 'CORPORATE_OFFICE',
    leadSource: 'META',
    status: 'QUALIFIED',
    numberOfWindows: 45,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    _id: '3',
    sideMark: 'SH-ARF34567',
    customerType: 'FRANCHISEE',
    companyName: 'At Shades - Orange County',
    ownerName: 'Mike Williams',
    email: 'mike@atshades-oc.com',
    phone: '(555) 345-6789',
    address: '789 Franchise Way, Irvine, CA',
    storeNumber: 'AS-015',
    status: 'CUSTOMER',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    _id: '4',
    sideMark: 'SH-PRF45678',
    customerType: 'PARTNER',
    companyName: 'Elite Designs',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@elitedesigns.com',
    phone: '(555) 456-7890',
    partnerType: 'DESIGNER',
    leadSource: 'REFERRAL',
    status: 'CUSTOMER',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    _id: '5',
    sideMark: 'SH-RMT56789',
    customerType: 'RESIDENTIAL',
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@email.com',
    phone: '(555) 567-8901',
    address: '321 Oak St, Pasadena, CA',
    leadSource: 'DOOR_HANGER',
    status: 'LEAD',
    numberOfWindows: 8,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
]

const statusStyles: Record<CustomerStatus, string> = {
  LEAD: 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  CONTACTED: 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  QUALIFIED: 'bg-purple-500/10 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  CUSTOMER: 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  INACTIVE: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
}

const typeStyles: Record<CustomerType, string> = {
  FRANCHISEE: 'bg-orange-500/10 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  RESIDENTIAL: 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  COMMERCIAL: 'bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  PARTNER: 'bg-violet-500/10 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
}

export function CustomerTable() {
  const [customers] = useState<Customer[]>(mockCustomers)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(customers.map(c => c._id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getCustomerName = (customer: Customer) => {
    if (customer.customerType === 'FRANCHISEE' || customer.customerType === 'COMMERCIAL') {
      return customer.companyName || 'N/A'
    }
    if (customer.customerType === 'PARTNER') {
      return customer.companyName || 'N/A'
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A'
  }

  const getContactName = (customer: Customer) => {
    if (customer.customerType === 'FRANCHISEE') {
      return customer.ownerName
    }
    if (customer.customerType === 'COMMERCIAL' || customer.customerType === 'PARTNER') {
      return customer.contactPerson
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} selected
          </span>
          <Button variant="ghost" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="ghost" size="sm">
            Export
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === customers.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="gap-1 font-medium"
                  onClick={() => handleSort('name')}
                >
                  Name
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Side Mark</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="gap-1 font-medium"
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow 
                key={customer._id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  selectedIds.includes(customer._id) && 'bg-muted/50'
                )}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(customer._id)}
                    onCheckedChange={() => toggleSelect(customer._id)}
                  />
                </TableCell>
                <TableCell>
                  <Link 
                    href={`/customers/${customer._id}`}
                    className="block hover:underline"
                  >
                    <div className="font-medium">{getCustomerName(customer)}</div>
                    {getContactName(customer) && (
                      <div className="text-sm text-muted-foreground">
                        {getContactName(customer)}
                      </div>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <code className="text-xs">{customer.sideMark}</code>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn('border-0', typeStyles[customer.customerType])}
                  >
                    {customer.customerType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {customer.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {customer.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {customer.leadSource?.replace(/_/g, ' ') || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn('border', statusStyles[customer.status])}
                  >
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/customers/${customer._id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1 to {customers.length} of {customers.length} entries
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

