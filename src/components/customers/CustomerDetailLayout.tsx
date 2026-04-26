'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  Edit,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, getInitials } from '@/lib/utils'
import type { Customer } from '@/types/database'

// Tab Components (placeholders)
import { ActivityTab } from './tabs/ActivityTab'
import { QuotesTab } from './tabs/QuotesTab'
import { InvoicesTab } from './tabs/InvoicesTab'
import { PaymentsTab } from './tabs/PaymentsTab'
import { TasksTab } from './tabs/TasksTab'
import { FilesTab } from './tabs/FilesTab'
import { AppointmentsTab } from './tabs/AppointmentsTab'
import { ReferralsTab } from './tabs/ReferralsTab'

interface CustomerDetailLayoutProps {
  customer: Customer
}

const statusStyles = {
  LEAD: 'bg-blue-500/10 text-blue-600 border-blue-200',
  CONTACTED: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  QUALIFIED: 'bg-purple-500/10 text-purple-600 border-purple-200',
  CUSTOMER: 'bg-green-500/10 text-green-600 border-green-200',
  INACTIVE: 'bg-gray-500/10 text-gray-600 border-gray-200',
}

const typeStyles = {
  FRANCHISEE: 'bg-orange-500/10 text-orange-600',
  RESIDENTIAL: 'bg-blue-500/10 text-blue-600',
  COMMERCIAL: 'bg-emerald-500/10 text-emerald-600',
  PARTNER: 'bg-violet-500/10 text-violet-600',
}

export function CustomerDetailLayout({ customer }: CustomerDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState('activity')

  const getCustomerName = () => {
    if (customer.customerType === 'FRANCHISEE' || customer.customerType === 'COMMERCIAL') {
      return customer.companyName || 'N/A'
    }
    if (customer.customerType === 'PARTNER') {
      return customer.companyName || 'N/A'
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A'
  }

  const getContactName = () => {
    if (customer.customerType === 'FRANCHISEE') {
      return customer.ownerName
    }
    if (customer.customerType === 'COMMERCIAL' || customer.customerType === 'PARTNER') {
      return customer.contactPerson
    }
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      {/* Left Panel - Profile Card */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {getInitials(customer.firstName, customer.lastName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{getCustomerName()}</h2>
              {getContactName() && (
                <p className="text-sm text-muted-foreground">{getContactName()}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className={cn('border-0', typeStyles[customer.customerType])}>
                  {customer.customerType}
                </Badge>
                <Badge variant="outline" className={cn('border', statusStyles[customer.status])}>
                  {customer.status}
                </Badge>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Side Mark */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Side Mark</p>
              <code className="text-sm font-medium">{customer.sideMark}</code>
            </div>

            <Separator className="my-4" />

            {/* Contact Info */}
            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${customer.email}`}
                    className="text-sm hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${customer.phone}`}
                    className="text-sm hover:underline"
                  >
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{customer.address}</p>
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View in Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Lead Source */}
            {customer.leadSource && (
              <div>
                <p className="text-xs text-muted-foreground">Lead Source</p>
                <p className="text-sm font-medium">
                  {customer.leadSource.replace(/_/g, ' ')}
                </p>
                {customer.leadSourceDetail && (
                  <p className="text-xs text-muted-foreground">
                    {customer.leadSourceDetail}
                  </p>
                )}
              </div>
            )}

            {/* Additional Info */}
            {customer.numberOfWindows && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Number of Windows</p>
                <p className="text-sm font-medium">{customer.numberOfWindows}</p>
              </div>
            )}
            {customer.numberOfOpenings && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">Number of Openings</p>
                <p className="text-sm font-medium">{customer.numberOfOpenings}</p>
              </div>
            )}

            {customer.productsOfInterest && customer.productsOfInterest.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Products of Interest</p>
                <div className="flex flex-wrap gap-1">
                  {customer.productsOfInterest.map((product) => (
                    <Badge key={product} variant="secondary" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button className="flex-1" variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem>Create Quote</DropdownMenuItem>
                  <DropdownMenuItem>Create Invoice</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Delete Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Created/Updated Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm">
                  {new Date(customer.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger 
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="quotes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Quotes
              </TabsTrigger>
              <TabsTrigger 
                value="invoices"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Invoices
              </TabsTrigger>
              <TabsTrigger 
                value="payments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger 
                value="appointments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Appointments
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="files"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Files
              </TabsTrigger>
              <TabsTrigger 
                value="referrals"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Referrals
              </TabsTrigger>
            </TabsList>

            <div className="p-4">
              <TabsContent value="activity" className="mt-0">
                <ActivityTab customerId={customer._id} />
              </TabsContent>
              <TabsContent value="quotes" className="mt-0">
                <QuotesTab customerId={customer._id} />
              </TabsContent>
              <TabsContent value="invoices" className="mt-0">
                <InvoicesTab customerId={customer._id} />
              </TabsContent>
              <TabsContent value="payments" className="mt-0">
                <PaymentsTab customerId={customer._id} />
              </TabsContent>
              <TabsContent value="appointments" className="mt-0">
                <AppointmentsTab customerId={customer._id} />
              </TabsContent>
              <TabsContent value="tasks" className="mt-0">
                <TasksTab customerId={customer._id} />
              </TabsContent>
              <TabsContent value="files" className="mt-0">
                <FilesTab customerId={customer._id} />
              </TabsContent>
              <TabsContent value="referrals" className="mt-0">
                <ReferralsTab customerId={customer._id} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

