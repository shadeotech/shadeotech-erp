'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuoteTable } from '@/components/quotes/QuoteTable'
import { QuickQuoteModal } from '@/components/quotes/QuickQuoteModal'
import { QuickQuoteList } from '@/components/quotes/QuickQuoteList'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Kanban, Loader2, X, Filter, SlidersHorizontal, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuotesStore } from '@/stores/quotesStore'
import { useMemo, useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { canPerformActions } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import { DataPagination } from '@/components/ui/data-pagination'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

export default function QuotesPage() {
  const { quotes, fetchQuotes, loading } = useQuotesStore()
  const [quickQuoteOpen, setQuickQuoteOpen] = useState(false)
  const { user, token } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expiryFrom, setExpiryFrom] = useState('')
  const [expiryTo, setExpiryTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [sortBy, setSortBy] = useState('createdAt-desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  useEffect(() => {
    if (token) {
      fetchQuotes(token)
    }
  }, [token, fetchQuotes])

  const filteredQuotes = useMemo(() => {
    let filtered = statusFilter === 'all' ? quotes : quotes.filter((q) => q.status === statusFilter)

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (q.sideMark && q.sideMark.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Created date filter
    if (dateFrom) {
      filtered = filtered.filter((q) => new Date(q.createdAt) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter((q) => new Date(q.createdAt) <= new Date(dateTo))
    }

    // Expiry date filter
    if (expiryFrom) {
      filtered = filtered.filter((q) => q.expiryDate && new Date(q.expiryDate) >= new Date(expiryFrom))
    }
    if (expiryTo) {
      filtered = filtered.filter((q) => q.expiryDate && new Date(q.expiryDate) <= new Date(expiryTo))
    }

    // Amount filter
    if (amountMin) {
      filtered = filtered.filter((q) => q.totalAmount >= parseFloat(amountMin))
    }
    if (amountMax) {
      filtered = filtered.filter((q) => q.totalAmount <= parseFloat(amountMax))
    }

    // Sort
    const [sortField, sortOrder] = sortBy.split('-')
    filtered.sort((a, b) => {
      let aVal, bVal

      if (sortField === 'createdAt' || sortField === 'expiryDate') {
        aVal = new Date(a[sortField as keyof typeof a] as string).getTime()
        bVal = new Date(b[sortField as keyof typeof b] as string).getTime()
      } else if (sortField === 'totalAmount') {
        aVal = a.totalAmount
        bVal = b.totalAmount
      } else {
        aVal = a[sortField as keyof typeof a]
        bVal = b[sortField as keyof typeof b]
      }

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [quotes, statusFilter, searchTerm, dateFrom, dateTo, expiryFrom, expiryTo, amountMin, amountMax, sortBy])

  const paginatedQuotes = useMemo(
    () => filteredQuotes.slice((page - 1) * perPage, page * perPage),
    [filteredQuotes, page, perPage]
  )

  const canPerformActionsOnSales = canPerformActions(user, 'sales')

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count++
    if (searchTerm) count++
    if (dateFrom || dateTo) count++
    if (expiryFrom || expiryTo) count++
    if (amountMin || amountMax) count++
    return count
  }, [statusFilter, searchTerm, dateFrom, dateTo, expiryFrom, expiryTo, amountMin, amountMax])

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all')
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setExpiryFrom('')
    setExpiryTo('')
    setAmountMin('')
    setAmountMax('')
    setSortBy('createdAt-desc')
  }

  const counters = useMemo(() => {
    const total = quotes.length
    const sent = quotes.filter((q) => q.status === 'SENT').length
    const accepted = quotes.filter((q) => q.status === 'WON').length
    const lost = quotes.filter((q) => q.status === 'LOST').length
    return { total, sent, accepted, lost }
  }, [quotes])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Estimates</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track your estimates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/quotes/pipeline">
            <Button variant="outline">
              <Kanban className="mr-2 h-4 w-4" />
              Pipeline View
            </Button>
          </Link>
          {canPerformActionsOnSales && (
            <>
              <Button
                variant="outline"
                className="border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                onClick={() => setQuickQuoteOpen(true)}
              >
                <Zap className="mr-2 h-4 w-4" />
                Quick Estimate
              </Button>
              <Link href="/quotes/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Estimate
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4" style={{ borderLeftColor: '#92400E' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#D97706' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.sent}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#16A34A' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.accepted}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#6B7280' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.lost}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Main Filters Row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative w-48 shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search estimates..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1 min-w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiating</SelectItem>
                  <SelectItem value="POSTPONED">Postponed</SelectItem>
                  <SelectItem value="WON">Confirmed</SelectItem>
                  <SelectItem value="LOST">Archived</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1 min-w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="totalAmount-desc">Highest Amount</SelectItem>
                  <SelectItem value="totalAmount-asc">Lowest Amount</SelectItem>
                  <SelectItem value="expiryDate-asc">Expiry: Soonest</SelectItem>
                  <SelectItem value="expiryDate-desc">Expiry: Latest</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Advanced
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0.5 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Advanced Filters</h4>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-7 text-xs"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Created Date Range */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Created Date</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">From</Label>
                          <Input
                            id="dateFrom"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dateTo" className="text-xs text-muted-foreground">To</Label>
                          <Input
                            id="dateTo"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expiry Date Range */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Expiry Date</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="expiryFrom" className="text-xs text-muted-foreground">From</Label>
                          <Input
                            id="expiryFrom"
                            type="date"
                            value={expiryFrom}
                            onChange={(e) => setExpiryFrom(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="expiryTo" className="text-xs text-muted-foreground">To</Label>
                          <Input
                            id="expiryTo"
                            type="date"
                            value={expiryTo}
                            onChange={(e) => setExpiryTo(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Amount Range */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Amount Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="amountMin" className="text-xs text-muted-foreground">Min ($)</Label>
                          <Input
                            id="amountMin"
                            type="number"
                            placeholder="0"
                            value={amountMin}
                            onChange={(e) => setAmountMin(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="amountMax" className="text-xs text-muted-foreground">Max ($)</Label>
                          <Input
                            id="amountMax"
                            type="number"
                            placeholder="No limit"
                            value={amountMax}
                            onChange={(e) => setAmountMax(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear ({activeFiltersCount})
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setStatusFilter('all')}
                    />
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchTerm}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSearchTerm('')}
                    />
                  </Badge>
                )}
                {(dateFrom || dateTo) && (
                  <Badge variant="secondary" className="gap-1">
                    Created: {dateFrom || '...'} to {dateTo || '...'}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setDateFrom('')
                        setDateTo('')
                      }}
                    />
                  </Badge>
                )}
                {(expiryFrom || expiryTo) && (
                  <Badge variant="secondary" className="gap-1">
                    Expiry: {expiryFrom || '...'} to {expiryTo || '...'}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setExpiryFrom('')
                        setExpiryTo('')
                      }}
                    />
                  </Badge>
                )}
                {(amountMin || amountMax) && (
                  <Badge variant="secondary" className="gap-1">
                    Amount: ${amountMin || '0'} - ${amountMax || '∞'}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => {
                        setAmountMin('')
                        setAmountMax('')
                      }}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredQuotes.length}</span> of{' '}
              <span className="font-medium text-foreground">{quotes.length}</span> estimates
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Quote List */}
      <QuickQuoteList />

      {/* Quick Quote Modal */}
      <QuickQuoteModal
        open={quickQuoteOpen}
        onOpenChange={setQuickQuoteOpen}
        onSaved={() => setQuickQuoteOpen(false)}
      />

      {/* Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <QuoteTable key={statusFilter} quotesOverride={paginatedQuotes} />
          <DataPagination
            total={filteredQuotes.length}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1) }}
          />
        </>
      )}
    </div>
  )
}

