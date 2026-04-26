'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ContactRole = 'CUSTOMER' | 'DEALER' | 'STAFF' | 'ADMIN' | 'OTHER'
type ContactStatus = 'ACTIVE' | 'INACTIVE'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  role: ContactRole
  status: ContactStatus
  initials: string
  color: string
}

const mockContacts: Contact[] = [
  {
    id: 'contact_1',
    name: 'Natali Craig',
    email: 'natali.craig@example.com',
    phone: '+1 (555) 123-4567',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    initials: 'NC',
    color: 'bg-violet-500',
  },
  {
    id: 'contact_2',
    name: 'Drew Cano',
    email: 'drew.cano@example.com',
    phone: '+1 (555) 234-5678',
    role: 'DEALER',
    status: 'ACTIVE',
    initials: 'DC',
    color: 'bg-emerald-500',
  },
  {
    id: 'contact_3',
    name: 'Andi Lane',
    email: 'andi.lane@example.com',
    phone: '+1 (555) 345-6789',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    initials: 'AL',
    color: 'bg-pink-500',
  },
  {
    id: 'contact_4',
    name: 'Koray Okumus',
    email: 'koray.okumus@example.com',
    phone: '+1 (555) 456-7890',
    role: 'DEALER',
    status: 'INACTIVE',
    initials: 'KO',
    color: 'bg-orange-500',
  },
  {
    id: 'contact_5',
    name: 'Kate Morrison',
    email: 'kate.morrison@example.com',
    phone: '+1 (555) 567-8901',
    role: 'STAFF',
    status: 'ACTIVE',
    initials: 'KM',
    color: 'bg-cyan-500',
  },
  {
    id: 'contact_6',
    name: 'Melody Macy',
    email: 'melody.macy@example.com',
    phone: '+1 (555) 678-9012',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    initials: 'MM',
    color: 'bg-blue-500',
  },
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts)

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== id))
  }

  const getRoleLabel = (role: ContactRole) => {
    const labels: Record<ContactRole, string> = {
      CUSTOMER: 'Customer',
      DEALER: 'Dealer',
      STAFF: 'Staff',
      ADMIN: 'Admin',
      OTHER: 'Other',
    }
    return labels[role]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and view all your contacts
          </p>
        </div>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add New Contact
        </Button>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Name</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Email</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Phone</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Role</TableHead>
                  <TableHead className="text-gray-900 dark:text-white">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No contacts found
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs text-white ${contact.color}`}>
                            {contact.initials}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {contact.name}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {contact.email}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {contact.phone || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                        >
                          {getRoleLabel(contact.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contact.status === 'ACTIVE' ? (
                          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteContact(contact.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
