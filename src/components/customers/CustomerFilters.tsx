'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

interface CustomerFiltersProps {
  onSearch: (search: string) => void
  onFilterChange: (filters: FilterState) => void
}

interface FilterState {
  type: string
  status: string
  source: string
  dateRange: string
}

const customerTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'FRANCHISEE', label: 'Franchisee' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'PARTNER', label: 'Partner' },
]

const customerStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'INACTIVE', label: 'Inactive' },
]

const leadSources = [
  { value: 'all', label: 'All Sources' },
  { value: 'META', label: 'Meta (Facebook/Instagram)' },
  { value: 'GOOGLE', label: 'Google Ads' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'PARTNER_REFERRAL', label: 'Partner Referral' },
  { value: 'DOOR_HANGER', label: 'Door Hanger' },
  { value: 'DOOR_TO_DOOR', label: 'Door to Door' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'OTHER_PAID', label: 'Other Paid' },
  { value: 'OTHER_ORGANIC', label: 'Other Organic' },
]

export function CustomerFilters({ onSearch, onFilterChange }: CustomerFiltersProps) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    status: 'all',
    source: 'all',
    dateRange: 'all',
  })
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  const handleSearch = (value: string) => {
    setSearch(value)
    onSearch(value)
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
    
    // Count active filters
    const count = Object.values(newFilters).filter(v => v !== 'all').length
    setActiveFilterCount(count)
  }

  const clearFilters = () => {
    const defaultFilters = {
      type: 'all',
      status: 'all',
      source: 'all',
      dateRange: 'all',
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
    setActiveFilterCount(0)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone, or side mark..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => handleSearch('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2">
        <Select
          value={filters.type}
          onValueChange={(v) => handleFilterChange('type', v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {customerTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => handleFilterChange('status', v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {customerStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Customers</SheetTitle>
              <SheetDescription>
                Apply filters to narrow down your customer list
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Lead Source */}
              <div className="space-y-3">
                <Label>Lead Source</Label>
                <Select
                  value={filters.source}
                  onValueChange={(v) => handleFilterChange('source', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Date Range */}
              <div className="space-y-3">
                <Label>Date Added</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(v) => handleFilterChange('dateRange', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Clear Filters */}
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
              >
                Clear All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

