'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  User, 
  MapPin, 
  Phone, 
  Mail,
  ChevronRight,
  Search,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock unassigned leads
const mockLeads = [
  {
    id: '1',
    name: 'Robert Johnson',
    email: 'robert@email.com',
    phone: '(555) 111-2222',
    address: '456 Oak Ave, Irvine, CA 92602',
    source: 'GOOGLE',
    createdAt: new Date('2024-01-20'),
    numberOfWindows: 8,
  },
  {
    id: '2',
    name: 'Tech Startup Inc',
    email: 'contact@techstartup.com',
    phone: '(555) 222-3333',
    address: '789 Business Blvd, San Diego, CA 92101',
    source: 'META',
    createdAt: new Date('2024-01-19'),
    numberOfWindows: 25,
    isCommercial: true,
  },
  {
    id: '3',
    name: 'Mary Williams',
    email: 'mary.w@email.com',
    phone: '(555) 333-4444',
    address: '123 Palm St, Phoenix, AZ 85001',
    source: 'REFERRAL',
    createdAt: new Date('2024-01-18'),
    numberOfWindows: 12,
  },
]

// Mock franchisees for assignment
const franchisees = [
  { id: '1', name: 'At Shades - Orange County', location: 'Irvine, CA' },
  { id: '2', name: 'At Shades - San Diego', location: 'San Diego, CA' },
  { id: '3', name: 'At Shades - Phoenix', location: 'Phoenix, AZ' },
  { id: '4', name: 'At Shades - Los Angeles', location: 'Los Angeles, CA' },
]

export default function LeadAssignmentPage() {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedFranchisee, setSelectedFranchisee] = useState('')

  const toggleLead = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) 
        ? prev.filter(l => l !== id)
        : [...prev, id]
    )
  }

  const handleAssign = () => {
    console.log('Assigning leads:', selectedLeads, 'to franchisee:', selectedFranchisee)
    // Will connect to API later
    setSelectedLeads([])
    setSelectedFranchisee('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium">Lead Assignment</h2>
        <p className="text-sm text-muted-foreground">
          Assign incoming leads to franchisees
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search unassigned leads..." className="pl-10" />
          </div>

          {/* Lead Cards */}
          <div className="space-y-3">
            {mockLeads.map((lead) => (
              <Card
                key={lead.id}
                className={cn(
                  'cursor-pointer transition-all',
                  selectedLeads.includes(lead.id) 
                    ? 'border-primary ring-1 ring-primary' 
                    : 'hover:border-primary/50'
                )}
                onClick={() => toggleLead(lead.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        lead.isCommercial ? 'bg-emerald-500/10' : 'bg-primary/10'
                      )}>
                        {lead.isCommercial ? (
                          <Building2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lead.name}</p>
                          {lead.isCommercial && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-0">
                              Commercial
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {lead.address}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{lead.source}</Badge>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {lead.numberOfWindows} windows
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {mockLeads.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No unassigned leads at this time
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Assignment Panel */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">Assign to Franchisee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {selectedLeads.length} lead(s) selected
                </p>
                <Select 
                  value={selectedFranchisee} 
                  onValueChange={setSelectedFranchisee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select franchisee" />
                  </SelectTrigger>
                  <SelectContent>
                    {franchisees.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <div>
                            <p>{f.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {f.location}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                disabled={selectedLeads.length === 0 || !selectedFranchisee}
                onClick={handleAssign}
              >
                Assign Leads
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Leads will be transferred to the selected franchisee's queue
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

