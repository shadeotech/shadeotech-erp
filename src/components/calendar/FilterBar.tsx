'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface EventTypeFilter {
  type: string
  label: string
  color: string
  active: boolean
}

const eventTypes: EventTypeFilter[] = [
  { type: 'CONSULTATION', label: 'Consultation', color: 'bg-blue-500', active: true },
  { type: 'INSTALLATION', label: 'Installation', color: 'bg-green-500', active: true },
  { type: 'DELIVERY', label: 'Delivery', color: 'bg-purple-500', active: true },
  { type: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-yellow-500', active: true },
  { type: 'MEETING', label: 'Meeting', color: 'bg-gray-500', active: true },
  { type: 'OTHER', label: 'Other', color: 'bg-gray-400', active: true },
]

interface FilterBarProps {
  filters: EventTypeFilter[]
  onFilterChange: (type: string) => void
  selectedUser?: string
  onUserChange: (userId: string) => void
}

const mockUsers = [
  { id: 'all', name: 'All Users' },
  { id: '1', name: 'Admin User' },
  { id: '2', name: 'Sarah Johnson' },
  { id: '3', name: 'Mike Williams' },
]

export function FilterBar({ 
  filters = eventTypes, 
  onFilterChange, 
  selectedUser = 'all',
  onUserChange 
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
      {/* Event Type Legend & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter by type:</span>
        {filters.map((filter) => (
          <Button
            key={filter.type}
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2 transition-opacity',
              !filter.active && 'opacity-50'
            )}
            onClick={() => onFilterChange(filter.type)}
          >
            <div className={cn('h-3 w-3 rounded-full', filter.color)} />
            <span>{filter.label}</span>
          </Button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* User Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">View:</span>
          <Select value={selectedUser} onValueChange={onUserChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {mockUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Count */}
        <Badge variant="secondary">
          {filters.filter(f => f.active).length} of {filters.length} types
        </Badge>
      </div>
    </div>
  )
}

export { eventTypes }
export type { EventTypeFilter }

