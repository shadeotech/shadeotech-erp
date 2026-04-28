'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, MoreHorizontal, Eye, Edit, Plus, Phone, Mail, ShieldCheck, Ban, X, Layers, TrendingUp, AlertCircle, DollarSign, Activity } from 'lucide-react'

type FranchiseeStatus = 'Active' | 'Inactive' | 'Pending'
type Tier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'New'

interface Franchisee {
  id: string
  name: string
  storeNumber: string
  owner: string
  email: string
  phone: string
  location: string
  state: string
  status: FranchiseeStatus
  quantity: number
  joinDate: string
  territory: string
  notes: string
}

const initialFranchisees: Franchisee[] = [
  {
    id: '1',
    name: 'At Shades - Los Angeles',
    storeNumber: 'AS-001',
    owner: 'Emily Brown',
    email: 'emily@atshades-la.com',
    phone: '(555) 678-9012',
    location: 'Los Angeles, CA',
    state: 'CA',
    status: 'Active',
    quantity: 142,
    joinDate: '2021-03-15',
    territory: 'LA County West',
    notes: '',
  },
  {
    id: '2',
    name: 'At Shades - Orange County',
    storeNumber: 'AS-015',
    owner: 'Mike Williams',
    email: 'mike@atshades-oc.com',
    phone: '(555) 345-6789',
    location: 'Irvine, CA',
    state: 'CA',
    status: 'Active',
    quantity: 98,
    joinDate: '2022-07-01',
    territory: 'Orange County',
    notes: '',
  },
  {
    id: '3',
    name: 'At Shades - San Diego',
    storeNumber: 'AS-018',
    owner: 'Sarah Chen',
    email: 'sarah@atshades-sd.com',
    phone: '(555) 456-7890',
    location: 'San Diego, CA',
    state: 'CA',
    status: 'Pending',
    quantity: 0,
    joinDate: '2024-11-01',
    territory: 'San Diego County',
    notes: 'Awaiting final agreement signature',
  },
  {
    id: '4',
    name: 'At Shades - Phoenix',
    storeNumber: 'AS-021',
    owner: 'John Martinez',
    email: 'john@atshades-phx.com',
    phone: '(555) 567-8901',
    location: 'Phoenix, AZ',
    state: 'AZ',
    status: 'Active',
    quantity: 77,
    joinDate: '2022-01-20',
    territory: 'Maricopa County',
    notes: '',
  },
  {
    id: '5',
    name: 'At Shades - Dallas',
    storeNumber: 'AS-030',
    owner: 'Patricia Lee',
    email: 'patricia@atshades-dal.com',
    phone: '(555) 234-5678',
    location: 'Dallas, TX',
    state: 'TX',
    status: 'Inactive',
    quantity: 34,
    joinDate: '2020-06-10',
    territory: 'DFW Metroplex',
    notes: 'Suspended pending compliance review',
  },
  {
    id: '6',
    name: 'At Shades - Houston',
    storeNumber: 'AS-031',
    owner: 'Carlos Rivera',
    email: 'carlos@atshades-hou.com',
    phone: '(555) 123-4567',
    location: 'Houston, TX',
    state: 'TX',
    status: 'Pending',
    quantity: 0,
    joinDate: '2025-01-05',
    territory: 'Harris County',
    notes: 'Onboarding in progress',
  },
]

interface PurchaseRecord {
  id: string
  date: string
  orderNumber: string
  productType: string
  quantity: number
  amount: number
  status: 'Completed' | 'Pending' | 'Cancelled'
}

const MOCK_PURCHASES: Record<string, PurchaseRecord[]> = {
  '1': [
    { id: 'p1', date: '2026-03-15', orderNumber: 'PO-2026-031', productType: 'Motorized Roller Shades', quantity: 24, amount: 18400, status: 'Completed' },
    { id: 'p2', date: '2026-02-10', orderNumber: 'PO-2026-018', productType: 'Zebra Blinds', quantity: 18, amount: 9200, status: 'Completed' },
    { id: 'p3', date: '2026-01-05', orderNumber: 'PO-2026-004', productType: 'Plantation Shutters', quantity: 12, amount: 14800, status: 'Completed' },
    { id: 'p4', date: '2025-12-20', orderNumber: 'PO-2025-094', productType: 'Cellular Shades', quantity: 30, amount: 11200, status: 'Completed' },
  ],
  '2': [
    { id: 'p1', date: '2026-03-20', orderNumber: 'PO-2026-035', productType: 'Cellular Shades', quantity: 20, amount: 12000, status: 'Completed' },
    { id: 'p2', date: '2026-02-18', orderNumber: 'PO-2026-022', productType: 'Roman Shades', quantity: 15, amount: 9800, status: 'Completed' },
    { id: 'p3', date: '2026-01-12', orderNumber: 'PO-2026-009', productType: 'Motorized Roller Shades', quantity: 10, amount: 8600, status: 'Pending' },
  ],
  '3': [],
  '4': [
    { id: 'p1', date: '2026-03-01', orderNumber: 'PO-2026-027', productType: 'Zebra Blinds', quantity: 22, amount: 10400, status: 'Completed' },
    { id: 'p2', date: '2026-01-28', orderNumber: 'PO-2026-014', productType: 'Roller Shades', quantity: 16, amount: 7200, status: 'Completed' },
  ],
  '5': [
    { id: 'p1', date: '2024-08-10', orderNumber: 'PO-2024-082', productType: 'Plantation Shutters', quantity: 8, amount: 9600, status: 'Completed' },
    { id: 'p2', date: '2024-06-05', orderNumber: 'PO-2024-055', productType: 'Cellular Shades', quantity: 12, amount: 5800, status: 'Cancelled' },
  ],
  '6': [],
}

const MOCK_CLAIMS: Record<string, number> = {
  '1': 3,
  '2': 1,
  '3': 0,
  '4': 2,
  '5': 4,
  '6': 0,
}

// Tier thresholds based on total purchase value
const TIERS: { tier: Tier; label: string; min: number; className: string; dotClass: string }[] = [
  { tier: 'Platinum', label: 'Platinum', min: 50000, className: 'bg-purple-500/10 text-purple-600 border-0', dotClass: 'bg-purple-500' },
  { tier: 'Gold',     label: 'Gold',     min: 25000, className: 'bg-amber-500/10 text-amber-600 border-0',  dotClass: 'bg-amber-500' },
  { tier: 'Silver',   label: 'Silver',   min: 10000, className: 'bg-slate-400/20 text-slate-600 border-0',  dotClass: 'bg-slate-400' },
  { tier: 'Bronze',   label: 'Bronze',   min: 1,     className: 'bg-orange-500/10 text-orange-700 border-0',dotClass: 'bg-orange-400' },
  { tier: 'New',      label: 'New',      min: 0,     className: 'bg-muted text-muted-foreground border-0',  dotClass: 'bg-muted-foreground' },
]

function getTier(total: number) {
  return TIERS.find(t => total >= t.min) ?? TIERS[TIERS.length - 1]
}

function statusStyle(status: FranchiseeStatus) {
  if (status === 'Active') return 'bg-green-500/10 text-green-600 border-0'
  if (status === 'Pending') return 'bg-amber-500/10 text-amber-600 border-0'
  return 'bg-slate-500/10 text-slate-500 border-0'
}

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `$${n.toLocaleString()}`
}

const TODAY = new Date('2026-04-27')
const NINETY_DAYS_AGO = new Date(TODAY)
NINETY_DAYS_AGO.setDate(NINETY_DAYS_AGO.getDate() - 90)

export default function FranchiseesPage() {
  const router = useRouter()
  const [franchisees, setFranchisees] = useState<Franchisee[]>(initialFranchisees)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | FranchiseeStatus>('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState<'all' | Tier>('all')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'joinDate' | 'totalValue' | 'claims'>('name')
  const [confirmTarget, setConfirmTarget] = useState<{ franchisee: Franchisee; action: 'activate' | 'deactivate' } | null>(null)
  const [purchaseTarget, setPurchaseTarget] = useState<Franchisee | null>(null)

  const states = useMemo(() => Array.from(new Set(franchisees.map(f => f.state))).sort(), [franchisees])

  const purchaseStats = useCallback((franchiseeId: string) => {
    const purchases = MOCK_PURCHASES[franchiseeId] ?? []
    const total = purchases.reduce((s, p) => s + p.amount, 0)
    const completed = purchases.filter(p => p.status === 'Completed').reduce((s, p) => s + p.amount, 0)
    const units = purchases.reduce((s, p) => s + p.quantity, 0)
    const avg = purchases.length > 0 ? Math.round(total / purchases.length) : 0
    const recent = purchases.filter(p => new Date(p.date) >= NINETY_DAYS_AGO).length
    const claims = MOCK_CLAIMS[franchiseeId] ?? 0
    return { count: purchases.length, total, completed, units, avg, recent, claims }
  }, [])

  const networkStats = useMemo(() => {
    const allPurchases = Object.values(MOCK_PURCHASES).flat()
    const totalValue = allPurchases.reduce((s, p) => s + p.amount, 0)
    const totalOrders = allPurchases.length
    const avgValue = totalOrders > 0 ? Math.round(totalValue / totalOrders) : 0
    const totalClaims = Object.values(MOCK_CLAIMS).reduce((s, c) => s + c, 0)
    const recentOrders = allPurchases.filter(p => new Date(p.date) >= NINETY_DAYS_AGO).length
    return { totalValue, totalOrders, avgValue, totalClaims, recentOrders }
  }, [])

  const summary = useMemo(() => ({
    total: franchisees.length,
    active: franchisees.filter(f => f.status === 'Active').length,
    pending: franchisees.filter(f => f.status === 'Pending').length,
    inactive: franchisees.filter(f => f.status === 'Inactive').length,
    totalUnits: franchisees.filter(f => f.status === 'Active').reduce((s, f) => s + f.quantity, 0),
  }), [franchisees])

  const filtered = useMemo(() => {
    let list = franchisees.filter(f => {
      const q = search.toLowerCase()
      const matchSearch = !q || f.name.toLowerCase().includes(q) || f.storeNumber.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q) || f.location.toLowerCase().includes(q) || f.territory.toLowerCase().includes(q)
      const matchOwner = !ownerSearch || f.owner.toLowerCase().includes(ownerSearch.toLowerCase())
      const matchStatus = statusFilter === 'all' || f.status === statusFilter
      const matchState = stateFilter === 'all' || f.state === stateFilter
      const matchTier = tierFilter === 'all' || getTier(purchaseStats(f.id).total).tier === tierFilter
      return matchSearch && matchOwner && matchStatus && matchState && matchTier
    })
    if (sortBy === 'quantity') list = [...list].sort((a, b) => b.quantity - a.quantity)
    else if (sortBy === 'joinDate') list = [...list].sort((a, b) => a.joinDate.localeCompare(b.joinDate))
    else if (sortBy === 'totalValue') list = [...list].sort((a, b) => purchaseStats(b.id).total - purchaseStats(a.id).total)
    else if (sortBy === 'claims') list = [...list].sort((a, b) => purchaseStats(b.id).claims - purchaseStats(a.id).claims)
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [franchisees, search, ownerSearch, statusFilter, stateFilter, tierFilter, sortBy, purchaseStats])

  const confirmAction = () => {
    if (!confirmTarget) return
    setFranchisees(prev => prev.map(f =>
      f.id === confirmTarget.franchisee.id
        ? { ...f, status: confirmTarget.action === 'activate' ? 'Active' : 'Inactive' }
        : f
    ))
    setConfirmTarget(null)
  }

  const clearFilters = () => { setSearch(''); setOwnerSearch(''); setStatusFilter('all'); setStateFilter('all'); setTierFilter('all'); setSortBy('name') }
  const hasFilters = search || ownerSearch || statusFilter !== 'all' || stateFilter !== 'all' || tierFilter !== 'all' || sortBy !== 'name'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">At Shades Fr&apos;s</h2>
          <p className="text-sm text-muted-foreground">Franchise store contacts and management</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Franchisee
        </Button>
      </div>

      {/* Stats — row 1: franchise counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Franchisees', value: summary.total, color: '', icon: null },
          { label: 'Active', value: summary.active, color: 'text-green-600', icon: null },
          { label: 'Pending', value: summary.pending, color: 'text-amber-600', icon: null },
          { label: 'Inactive', value: summary.inactive, color: 'text-slate-500', icon: null },
          { label: 'Active Units', value: summary.totalUnits.toLocaleString(), color: 'text-blue-600', icon: null },
        ].map(s => (
          <div key={s.label} className="rounded-lg border px-4 py-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-semibold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Stats — row 2: financial metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border px-4 py-3 flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-amber-500/10 p-1.5">
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total $ Value</p>
            <p className="text-xl font-semibold mt-0.5">${networkStats.totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{networkStats.totalOrders} orders network-wide</p>
          </div>
        </div>
        <div className="rounded-lg border px-4 py-3 flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-blue-500/10 p-1.5">
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Order Activity</p>
            <p className="text-xl font-semibold mt-0.5">{networkStats.recentOrders}</p>
            <p className="text-xs text-muted-foreground">orders in last 90 days</p>
          </div>
        </div>
        <div className="rounded-lg border px-4 py-3 flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-green-500/10 p-1.5">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg $ / Order</p>
            <p className="text-xl font-semibold mt-0.5">${networkStats.avgValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">average order value</p>
          </div>
        </div>
        <div className="rounded-lg border px-4 py-3 flex items-start gap-3">
          <div className="mt-0.5 rounded-md bg-red-500/10 p-1.5">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Claims</p>
            <p className="text-xl font-semibold mt-0.5 text-red-500">{networkStats.totalClaims}</p>
            <p className="text-xs text-muted-foreground">open / reported</p>
          </div>
        </div>
      </div>

      {/* Tier legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Tier levels:</span>
        {TIERS.map(t => (
          <span key={t.tier} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${t.dotClass}`} />
            <span className="font-medium">{t.label}</span>
            <span>{t.tier === 'Platinum' ? '$50k+' : t.tier === 'Gold' ? '$25k–$50k' : t.tier === 'Silver' ? '$10k–$25k' : t.tier === 'Bronze' ? 'Under $10k' : 'No purchases'}</span>
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, store #, territory…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Input
          placeholder="Filter by owner…"
          value={ownerSearch}
          onChange={e => setOwnerSearch(e.target.value)}
          className="w-40"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={v => setTierFilter(v as typeof tierFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="Platinum">Platinum</SelectItem>
            <SelectItem value="Gold">Gold</SelectItem>
            <SelectItem value="Silver">Silver</SelectItem>
            <SelectItem value="Bronze">Bronze</SelectItem>
            <SelectItem value="New">New</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="totalValue">Sort: Total $ (High)</SelectItem>
            <SelectItem value="quantity">Sort: Units (High)</SelectItem>
            <SelectItem value="claims">Sort: Claims (High)</SelectItem>
            <SelectItem value="joinDate">Sort: Join Date</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store #</TableHead>
              <TableHead>Store / Owner</TableHead>
              <TableHead>Location / Territory</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Order Activity</TableHead>
              <TableHead className="text-right">Total $ Value</TableHead>
              <TableHead className="text-right">Avg $ / Order</TableHead>
              <TableHead className="text-right">Claims</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(franchisee => {
              const stats = purchaseStats(franchisee.id)
              const tier = getTier(stats.total)
              return (
                <TableRow key={franchisee.id} className={franchisee.status === 'Inactive' ? 'opacity-60' : ''}>
                  {/* Store # — clickable */}
                  <TableCell>
                    <button onClick={() => router.push(`/franchise/franchisees/${franchisee.id}`)} className="group">
                      <Badge variant="outline" className="font-mono text-xs group-hover:border-amber-500 group-hover:text-amber-600 transition-colors cursor-pointer">
                        {franchisee.storeNumber}
                      </Badge>
                    </button>
                  </TableCell>

                  {/* Store name + owner contact */}
                  <TableCell>
                    <p className="font-medium">{franchisee.name}</p>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <a href={`mailto:${franchisee.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="h-3 w-3 shrink-0" />{franchisee.owner} · {franchisee.email}
                      </a>
                      <a href={`tel:${franchisee.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="h-3 w-3 shrink-0" />{franchisee.phone}
                      </a>
                    </div>
                  </TableCell>

                  {/* Location + territory */}
                  <TableCell>
                    <p className="text-sm">{franchisee.location}</p>
                    <p className="text-xs text-muted-foreground">{franchisee.territory}</p>
                  </TableCell>

                  {/* Tier badge */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${tier.dotClass}`} />
                      <Badge variant="outline" className={`text-xs ${tier.className}`}>
                        {tier.label}
                      </Badge>
                    </div>
                    {stats.total > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{fmt(stats.total)} total</p>
                    )}
                  </TableCell>

                  {/* Order Activity */}
                  <TableCell className="text-right">
                    <p className="font-medium tabular-nums">{stats.recent}</p>
                    <p className="text-xs text-muted-foreground">{stats.count} all-time</p>
                  </TableCell>

                  {/* Total $ Value */}
                  <TableCell className="text-right">
                    {stats.total > 0 ? (
                      <button onClick={() => setPurchaseTarget(franchisee)} className="text-right hover:text-amber-600 transition-colors">
                        <p className="font-medium tabular-nums">${stats.total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{stats.count} orders</p>
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Avg $ / Order */}
                  <TableCell className="text-right">
                    {stats.avg > 0 ? (
                      <p className="font-medium tabular-nums">${stats.avg.toLocaleString()}</p>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Claims */}
                  <TableCell className="text-right">
                    {stats.claims > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-red-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {stats.claims}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant="outline" className={statusStyle(franchisee.status)}>
                      {franchisee.status}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/franchise/franchisees/${franchisee.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/franchise/franchisees/${franchisee.id}?edit=1`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {franchisee.status !== 'Active' ? (
                          <DropdownMenuItem onClick={() => setConfirmTarget({ franchisee, action: 'activate' })}>
                            <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
                            <span className="text-green-600">Activate</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setConfirmTarget({ franchisee, action: 'deactivate' })}>
                            <Ban className="mr-2 h-4 w-4 text-red-500" />
                            <span className="text-red-500">Deactivate</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  No franchisees match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Purchases Report Modal */}
      <Dialog open={!!purchaseTarget} onOpenChange={open => { if (!open) setPurchaseTarget(null) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase History</DialogTitle>
            {purchaseTarget && (
              <p className="text-sm text-muted-foreground">
                {purchaseTarget.name} · {purchaseTarget.storeNumber} · Owner: {purchaseTarget.owner}
              </p>
            )}
          </DialogHeader>
          {purchaseTarget && (() => {
            const purchases = MOCK_PURCHASES[purchaseTarget.id] ?? []
            const stats = purchaseStats(purchaseTarget.id)
            const tier = getTier(stats.total)
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg border px-4 py-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Total $ Value</p>
                    <p className="text-xl font-semibold mt-0.5">${stats.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stats.count} orders</p>
                  </div>
                  <div className="rounded-lg border px-4 py-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Avg $ / Order</p>
                    <p className="text-xl font-semibold mt-0.5">${stats.avg.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border px-4 py-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Order Activity</p>
                    <p className="text-xl font-semibold mt-0.5 text-blue-600">{stats.recent}</p>
                    <p className="text-xs text-muted-foreground">last 90 days</p>
                  </div>
                  <div className="rounded-lg border px-4 py-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${tier.dotClass}`} />
                      <Badge variant="outline" className={`text-sm ${tier.className}`}>{tier.label}</Badge>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead>Product Type</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No purchase records
                          </TableCell>
                        </TableRow>
                      ) : purchases.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </TableCell>
                          <TableCell><span className="font-mono text-xs">{p.orderNumber}</span></TableCell>
                          <TableCell className="font-medium">{p.productType}</TableCell>
                          <TableCell className="text-right tabular-nums">{p.quantity}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">${p.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              p.status === 'Completed' ? 'bg-green-500/10 text-green-600 border-0' :
                              p.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-0' :
                              'bg-red-500/10 text-red-500 border-0'
                            }>
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseTarget(null)}>Close</Button>
            <Button variant="outline" onClick={() => purchaseTarget && router.push(`/franchise/franchisees/${purchaseTarget.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Full Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate / Deactivate confirmation */}
      <Dialog open={!!confirmTarget} onOpenChange={open => { if (!open) setConfirmTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={confirmTarget?.action === 'activate' ? 'text-green-600' : 'text-red-600'}>
              {confirmTarget?.action === 'activate' ? 'Activate Franchisee' : 'Deactivate Franchisee'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.action === 'activate'
                ? `This will mark ${confirmTarget.franchisee.name} as Active. They will be able to receive orders and access franchise resources.`
                : `This will mark ${confirmTarget?.franchisee.name} as Inactive. Their access will be suspended until reactivated.`}
            </DialogDescription>
          </DialogHeader>
          {confirmTarget && (
            <div className="rounded-lg border px-4 py-3 text-sm space-y-0.5 bg-muted/40">
              <p className="font-medium">{confirmTarget.franchisee.name}</p>
              <p className="text-muted-foreground">{confirmTarget.franchisee.storeNumber} · {confirmTarget.franchisee.location}</p>
              <p className="text-muted-foreground">Owner: {confirmTarget.franchisee.owner}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            <Button
              variant={confirmTarget?.action === 'activate' ? 'default' : 'destructive'}
              className={confirmTarget?.action === 'activate' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              onClick={confirmAction}
            >
              {confirmTarget?.action === 'activate' ? (
                <><ShieldCheck className="mr-2 h-4 w-4" />Confirm Activation</>
              ) : (
                <><Ban className="mr-2 h-4 w-4" />Confirm Deactivation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
