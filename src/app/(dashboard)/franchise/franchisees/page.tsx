'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreHorizontal, Eye, Edit, Plus, Phone, Mail } from 'lucide-react'

const mockFranchisees = [
  {
    id: '1',
    name: 'At Shades - Los Angeles',
    storeNumber: 'AS-001',
    owner: 'Emily Brown',
    email: 'emily@atshades-la.com',
    phone: '(555) 678-9012',
    location: 'Los Angeles, CA',
  },
  {
    id: '2',
    name: 'At Shades - Orange County',
    storeNumber: 'AS-015',
    owner: 'Mike Williams',
    email: 'mike@atshades-oc.com',
    phone: '(555) 345-6789',
    location: 'Irvine, CA',
  },
  {
    id: '3',
    name: 'At Shades - San Diego',
    storeNumber: 'AS-018',
    owner: 'Sarah Chen',
    email: 'sarah@atshades-sd.com',
    phone: '(555) 456-7890',
    location: 'San Diego, CA',
  },
  {
    id: '4',
    name: 'At Shades - Phoenix',
    storeNumber: 'AS-021',
    owner: 'John Martinez',
    email: 'john@atshades-phx.com',
    phone: '(555) 567-8901',
    location: 'Phoenix, AZ',
  },
]

export default function FranchiseesPage() {
  const [search, setSearch] = useState('')

  const filtered = mockFranchisees.filter(f => {
    const q = search.toLowerCase()
    return !q || f.name.toLowerCase().includes(q) || f.storeNumber.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q) || f.location.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">At Shades Fr&apos;s</h2>
          <p className="text-sm text-muted-foreground">
            Franchise store contacts
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Franchisee
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search franchisees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store #</TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(franchisee => (
              <TableRow key={franchisee.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {franchisee.storeNumber}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{franchisee.name}</TableCell>
                <TableCell>{franchisee.owner}</TableCell>
                <TableCell className="text-muted-foreground">{franchisee.location}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <a href={`mailto:${franchisee.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                      {franchisee.email}
                    </a>
                    <a href={`tel:${franchisee.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                      {franchisee.phone}
                    </a>
                  </div>
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
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No franchisees found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
