'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Plus, AlertTriangle, Edit, Trash2, Search, X, Settings, Loader2, RefreshCw, ExternalLink, ChevronRight, Package, CheckCircle2, Check, ChevronsUpDown } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { INVENTORY_PRODUCTS } from '@/constants'
import { useToast } from '@/components/ui/use-toast'
import FabricDetailDialog from '@/components/inventory/FabricDetailDialog'
import Link from 'next/link'

const products = [...INVENTORY_PRODUCTS]

interface FabricItem {
  _id: string
  name: string
  collection: string
  width: number
  quantity: number
  product: string
  specs?: string
  fabricCode?: string
  colorName?: string
  colorCode?: string
  isDuo?: boolean
  duoSpecs?: string
  lowStockThreshold?: number
  createdAt?: string
  updatedAt?: string
}
interface CassetteItem {
  _id: string
  type: 'Square' | 'Round'
  color: string
  specs: string
  quantity: number
  createdAt?: string
  updatedAt?: string
}
interface ComponentItem {
  _id: string
  name: string
  type: string
  quantity: number
  unit: string
  createdAt?: string
  updatedAt?: string
}
interface CutPieceItem {
  _id: string
  fabric: string
  fabricId?: string
  label?: string
  width: number
  length: number
  quantity: number
  unit: string
  createdAt?: string
  updatedAt?: string
}

interface InventoryCategory {
  id: string
  name: string
  value: string
}

const defaultCategories: InventoryCategory[] = [
  { id: '1', name: 'Fabrics', value: 'fabrics' },
  { id: '2', name: 'Cassettes', value: 'cassettes' },
  { id: '3', name: 'Bottom Rails', value: 'bottom-rails' },
  { id: '4', name: 'Other Components', value: 'components' },
  { id: '5', name: 'Cut Pieces', value: 'cut-pieces' },
  { id: '6', name: 'Catalog Stock', value: 'catalog-stock' },
]

export default function ProductionInventoryPage() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const isAdmin = user?.role === 'ADMIN'

  const [fabrics, setFabrics] = useState<FabricItem[]>([])
  const [cassettes, setCassettes] = useState<CassetteItem[]>([])
  const [components, setComponents] = useState<ComponentItem[]>([])
  const [cutPieces, setCutPieces] = useState<CutPieceItem[]>([])
  const [catalogFabrics, setCatalogFabrics] = useState<any[]>([])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cutPieceDialogOpen, setCutPieceDialogOpen] = useState(false)
  const [newCutPiece, setNewCutPiece] = useState({ fabric: '', label: '', width: 0, length: 0, quantity: 1, unit: 'mm' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const [inventoryView, setInventoryView] = useState<'overview' | 'detail' | 'products'>('overview')

  // Products & Services state
  const [psSearch, setPsSearch] = useState('')
  const [psNewProductOpen, setPsNewProductOpen] = useState(false)
  const [psNewProductType, setPsNewProductType] = useState<'Service' | 'Inventory item' | 'Non-inventory item' | 'Bundle'>('Service')
  const [psProduct, setPsProduct] = useState({
    name: '', itemType: 'Service', sku: '', category: '', description: '',
    priceRate: '', incomeAccount: '410 Services', salesTaxCategory: 'Taxable–standard rate',
    sellToCustomers: true, purchaseFromVendor: false, purchaseDescription: '', purchaseCost: '',
    expenseAccount: '', vendorId: '', vendorName: '',
  })
  // Vendors
  const [vendors, setVendors] = useState<{ id: string; name: string; email: string; phone: string }[]>([])
  const [vendorSaving, setVendorSaving] = useState(false)
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')
  // Product/service categories (persisted via settings)
  const DEFAULT_PS_CATEGORIES = ['Fabrics', 'Cassettes', 'Components', 'Services', 'Installation', 'Other']
  const [psCategories, setPsCategories] = useState<string[]>(DEFAULT_PS_CATEGORIES)
  const [showAddPsCategory, setShowAddPsCategory] = useState(false)
  const [newPsCategoryName, setNewPsCategoryName] = useState('')
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [vendorPopoverOpen, setVendorPopoverOpen] = useState(false)
  // P&S filter state
  const [psTypeFilter, setPsTypeFilter] = useState<string>('All')
  const [psCategoryFilter, setPsCategoryFilter] = useState<string>('All')

  const [categories, setCategories] = useState<InventoryCategory[]>(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState<string>('fabrics')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'fabric' | 'cassette' | 'component'>('fabric')
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Fabric detail dialog
  const [fabricDetailOpen, setFabricDetailOpen] = useState(false)
  const [selectedFabric, setSelectedFabric] = useState<FabricItem | null>(null)

  // Update stock dialog
  const [updateStockOpen, setUpdateStockOpen] = useState(false)
  const [stockDraft, setStockDraft] = useState<{ id: string; name: string; quantity: number }[]>([])

  const [search, setSearch] = useState('')
  const [fabricCollectionFilter, setFabricCollectionFilter] = useState<string>('all')
  const [fabricStatusFilter, setFabricStatusFilter] = useState<string>('all')
  const [fabricTypeFilter, setFabricTypeFilter] = useState<string>('all')
  const [cassetteTypeFilter, setCassetteTypeFilter] = useState<string>('all')
  const [cassetteStatusFilter, setCassetteStatusFilter] = useState<string>('all')
  const [componentTypeFilter, setComponentTypeFilter] = useState<string>('all')
  const [componentStatusFilter, setComponentStatusFilter] = useState<string>('all')

  const [newFabric, setNewFabric] = useState({
    name: '',
    collection: '',
    width: 0,
    quantity: 0,
    product: '',
    specs: '',
    fabricCode: '',
    colorName: '',
    colorCode: '',
    isDuo: false,
    duoSpecs: '',
    lowStockThreshold: 10,
  })
  const [newCassette, setNewCassette] = useState({
    type: 'Square' as 'Square' | 'Round',
    color: '',
    specs: '',
    quantity: 0,
  })
  const [newComponent, setNewComponent] = useState({
    name: '',
    type: '',
    quantity: 0,
    unit: 'pieces',
  })

  const fetchAll = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [fRes, cRes, compRes, cpRes, catRes, vendorRes, settingsRes] = await Promise.all([
        fetch('/api/inventory/fabrics', { headers }),
        fetch('/api/inventory/cassettes', { headers }),
        fetch('/api/inventory/components', { headers }),
        fetch('/api/inventory/cut-pieces', { headers }),
        fetch('/api/fabric-gallery', { headers }),
        fetch('/api/vendors', { headers }),
        fetch('/api/settings/company'),
      ])
      if (fRes.ok) {
        const d = await fRes.json()
        setFabrics(d.fabrics || [])
      }
      if (cRes.ok) {
        const d = await cRes.json()
        setCassettes(d.cassettes || [])
      }
      if (compRes.ok) {
        const d = await compRes.json()
        setComponents(d.components || [])
      }
      if (cpRes.ok) {
        const d = await cpRes.json()
        setCutPieces(d.cutPieces || [])
      }
      if (catRes.ok) {
        const d = await catRes.json()
        setCatalogFabrics(d.fabrics || [])
      }
      if (vendorRes.ok) {
        const d = await vendorRes.json()
        setVendors(d.vendors || [])
      }
      if (settingsRes.ok) {
        const d = await settingsRes.json()
        if (d.productCategories?.length) setPsCategories(d.productCategories)
      }
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Failed to load inventory', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const collections = useMemo(() => {
    return Array.from(new Set(fabrics.map(f => f.collection).filter(Boolean))) as string[]
  }, [fabrics])

  const filteredFabrics = useMemo(() => {
    return fabrics.filter(fabric => {
      let matchesSearch = true
      if (search) {
        const q = search.toLowerCase()
        matchesSearch = fabric.name.toLowerCase().includes(q) ||
          (fabric.collection || '').toLowerCase().includes(q) ||
          fabric.width.toString().includes(q) ||
          (fabric.fabricCode || '').toLowerCase().includes(q) ||
          (fabric.colorCode || '').toLowerCase().includes(q) ||
          (fabric.colorName || '').toLowerCase().includes(q)
      }
      const threshold = fabric.lowStockThreshold ?? 10
      const matchesCollection = fabricCollectionFilter === 'all' || fabric.collection === fabricCollectionFilter
      const matchesStatus = fabricStatusFilter === 'all' ||
        (fabricStatusFilter === 'low' && fabric.quantity <= threshold) ||
        (fabricStatusFilter === 'in-stock' && fabric.quantity > threshold)
      const matchesType = fabricTypeFilter === 'all' || fabric.product === fabricTypeFilter
      return matchesSearch && matchesCollection && matchesStatus && matchesType
    })
  }, [fabrics, search, fabricCollectionFilter, fabricStatusFilter, fabricTypeFilter])

  const filteredCassettes = useMemo(() => {
    return cassettes.filter(cassette => {
      let matchesSearch = true
      if (search) {
        matchesSearch = cassette.type.toLowerCase().includes(search.toLowerCase()) ||
          cassette.color.toLowerCase().includes(search.toLowerCase()) ||
          (cassette.specs || '').toLowerCase().includes(search.toLowerCase())
      }
      const matchesType = cassetteTypeFilter === 'all' || cassette.type === cassetteTypeFilter
      const matchesStatus = cassetteStatusFilter === 'all' ||
        (cassetteStatusFilter === 'low' && cassette.quantity < 20) ||
        (cassetteStatusFilter === 'in-stock' && cassette.quantity >= 20)
      return matchesSearch && matchesType && matchesStatus
    })
  }, [cassettes, search, cassetteTypeFilter, cassetteStatusFilter])

  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      let matchesSearch = true
      if (search) {
        matchesSearch = component.name.toLowerCase().includes(search.toLowerCase()) ||
          component.type.toLowerCase().includes(search.toLowerCase())
      }
      const matchesType = componentTypeFilter === 'all' || component.type === componentTypeFilter
      const matchesStatus = componentStatusFilter === 'all' ||
        (componentStatusFilter === 'low' && component.quantity < 50) ||
        (componentStatusFilter === 'in-stock' && component.quantity >= 50)
      return matchesSearch && matchesType && matchesStatus
    })
  }, [components, search, componentTypeFilter, componentStatusFilter])

  const filteredCutPieces = useMemo(() => {
    return cutPieces.filter(piece => {
      if (!search) return true
      const q = search.toLowerCase()
      return piece.fabric.toLowerCase().includes(q) ||
        (piece.label || '').toLowerCase().includes(q) ||
        piece.width.toString().includes(q) ||
        piece.length.toString().includes(q)
    })
  }, [cutPieces, search])

  // Low stock counts for banner
  const lowStockFabrics = fabrics.filter(f => f.quantity <= (f.lowStockThreshold ?? 10))
  const lowStockCassettes = cassettes.filter(c => c.quantity < 20)
  const lowStockComponents = components.filter(c => c.quantity < 50)
  const totalLowStock = lowStockFabrics.length + lowStockCassettes.length + lowStockComponents.length

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    setSearch('')
  }

  const openDialog = (type: 'fabric' | 'cassette' | 'component') => {
    setEditingId(null)
    setDialogType(type)
    setNewFabric({ name: '', collection: '', width: 0, quantity: 0, product: '', specs: '', fabricCode: '', colorName: '', colorCode: '', isDuo: false, duoSpecs: '', lowStockThreshold: 10 })
    setNewCassette({ type: 'Square', color: '', specs: '', quantity: 0 })
    setNewComponent({ name: '', type: '', quantity: 0, unit: 'pieces' })
    setDialogOpen(true)
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    const newCategory: InventoryCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      value: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
    }
    setCategories([...categories, newCategory])
    setNewCategoryName('')
    setAddCategoryDialogOpen(false)
  }

  const handleAddVendor = async () => {
    if (!newVendorName.trim() || !token) return
    setVendorSaving(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newVendorName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setVendors(prev => [...prev, data.vendor].sort((a, b) => a.name.localeCompare(b.name)))
        setPsProduct(prev => ({ ...prev, vendorId: data.vendor.id, vendorName: data.vendor.name }))
        setNewVendorName('')
        setShowAddVendor(false)
      }
    } catch {}
    finally { setVendorSaving(false) }
  }

  const handleAddPsCategory = async () => {
    const name = newPsCategoryName.trim()
    if (!name) return
    const next = [...psCategories, name]
    setPsCategories(next)
    setPsProduct(prev => ({ ...prev, category: name }))
    setNewPsCategoryName('')
    setShowAddPsCategory(false)
    // persist to settings
    try {
      await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productCategories: next }),
      })
    } catch {}
  }

  const handleAddFabric = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/inventory/fabrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newFabric),
      })
      if (!res.ok) throw new Error('Failed to add fabric')
      setDialogOpen(false)
      setNewFabric({ name: '', collection: '', width: 0, quantity: 0, product: '', specs: '', fabricCode: '', colorName: '', colorCode: '', isDuo: false, duoSpecs: '', lowStockThreshold: 10 })
      await fetchAll()
      toast({ title: 'Success', description: 'Fabric added' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to add fabric', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCassette = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/inventory/cassettes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCassette),
      })
      if (!res.ok) throw new Error('Failed to add cassette')
      setDialogOpen(false)
      setNewCassette({ type: 'Square', color: '', specs: '', quantity: 0 })
      await fetchAll()
      toast({ title: 'Success', description: 'Cassette added' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to add cassette', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddComponent = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/inventory/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newComponent),
      })
      if (!res.ok) throw new Error('Failed to add component')
      setDialogOpen(false)
      setNewComponent({ name: '', type: '', quantity: 0, unit: 'pieces' })
      await fetchAll()
      toast({ title: 'Success', description: 'Component added' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to add component', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditFabric = (item: FabricItem) => {
    setEditingId(item._id)
    setNewFabric({
      name: item.name,
      collection: item.collection || '',
      width: item.width,
      quantity: item.quantity,
      product: item.product || '',
      specs: item.specs || '',
      fabricCode: item.fabricCode || '',
      colorName: item.colorName || '',
      colorCode: item.colorCode || '',
      isDuo: item.isDuo ?? false,
      duoSpecs: item.duoSpecs || '',
      lowStockThreshold: item.lowStockThreshold ?? 10,
    })
    setDialogType('fabric')
    setDialogOpen(true)
  }
  const handleEditCassette = (item: CassetteItem) => {
    setEditingId(item._id)
    setNewCassette({ type: item.type, color: item.color, specs: item.specs || '', quantity: item.quantity })
    setDialogType('cassette')
    setDialogOpen(true)
  }
  const handleEditComponent = (item: ComponentItem) => {
    setEditingId(item._id)
    setNewComponent({ name: item.name, type: item.type, quantity: item.quantity, unit: item.unit || 'pieces' })
    setDialogType('component')
    setDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!token || !editingId) return
    setSaving(true)
    try {
      const url =
        dialogType === 'fabric' ? `/api/inventory/fabrics/${editingId}` :
        dialogType === 'cassette' ? `/api/inventory/cassettes/${editingId}` :
        `/api/inventory/components/${editingId}`
      const body =
        dialogType === 'fabric' ? newFabric :
        dialogType === 'cassette' ? newCassette :
        newComponent
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update')
      setDialogOpen(false)
      setEditingId(null)
      setNewFabric({ name: '', collection: '', width: 0, quantity: 0, product: '', specs: '', fabricCode: '', colorName: '', colorCode: '', isDuo: false, duoSpecs: '', lowStockThreshold: 10 })
      setNewCassette({ type: 'Square', color: '', specs: '', quantity: 0 })
      setNewComponent({ name: '', type: '', quantity: 0, unit: 'pieces' })
      await fetchAll()
      toast({ title: 'Success', description: 'Item updated' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to update', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFabric = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/inventory/fabrics/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchAll()
      toast({ title: 'Success', description: 'Fabric removed' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }
  const handleDeleteCassette = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/inventory/cassettes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchAll()
      toast({ title: 'Success', description: 'Cassette removed' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }
  const handleDeleteComponent = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/inventory/components/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchAll()
      toast({ title: 'Success', description: 'Component removed' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }
  const handleDeleteCutPiece = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/inventory/cut-pieces/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchAll()
      toast({ title: 'Success', description: 'Cut piece removed' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddCutPiece = async () => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/inventory/cut-pieces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCutPiece),
      })
      if (!res.ok) throw new Error('Failed to add cut piece')
      setCutPieceDialogOpen(false)
      setNewCutPiece({ fabric: '', label: '', width: 0, length: 0, quantity: 1, unit: 'mm' })
      await fetchAll()
      toast({ title: 'Success', description: 'Cut piece added' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to add cut piece', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const openUpdateStock = () => {
    setStockDraft(fabrics.map(f => ({ id: f._id, name: f.name, quantity: f.quantity })))
    setUpdateStockOpen(true)
  }

  const handleSaveStock = async () => {
    if (!token) return
    setSaving(true)
    try {
      await Promise.all(
        stockDraft.map(item =>
          fetch(`/api/inventory/fabrics/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ quantity: item.quantity }),
          })
        )
      )
      setUpdateStockOpen(false)
      await fetchAll()
      toast({ title: 'Stock updated' })
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─── Overview derived data ───────────────────────────────────────────────
  const outOfStockFabrics = fabrics.filter(f => f.quantity === 0)
  const outOfStockCassettes = cassettes.filter(c => c.quantity === 0)
  const allLowItems = [
    ...lowStockFabrics.map(f => ({ name: f.colorName || f.name, qty: f.quantity, type: 'Fabric' })),
    ...lowStockCassettes.map(c => ({ name: `${c.type} ${c.color}`, qty: c.quantity, type: 'Cassette' })),
    ...lowStockComponents.map(c => ({ name: c.name, qty: c.quantity, type: 'Component' })),
  ]
  const allOutOfStock = [
    ...outOfStockFabrics.map(f => ({ name: f.colorName || f.name, qty: 0, type: 'Fabric' })),
    ...outOfStockCassettes.map(c => ({ name: `${c.type} ${c.color}`, qty: 0, type: 'Cassette' })),
    ...components.filter(c => c.quantity === 0).map(c => ({ name: c.name, qty: 0, type: 'Component' })),
  ]
  // Top products from catalog (sorted by rolls descending as proxy for popularity)
  const topProducts = [...catalogFabrics]
    .sort((a: any, b: any) => (b.rollsAvailable ?? 0) - (a.rollsAvailable ?? 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-1 w-fit">
        {([['overview','Overview'],['detail','Manage Inventory']] as const).map(([v,label]) => (
          <button
            key={v}
            onClick={() => setInventoryView(v)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${inventoryView === v ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ──────────────── OVERVIEW ──────────────── */}
      {inventoryView === 'overview' && (
        <div className="space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Inventory Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">As of today</p>
          </div>

          {/* Row 1: Low on Stock + Out of Stock + Top Selling */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Low on Stock */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Low on Stock</p>
                  <p className="text-3xl font-bold mt-1">{allLowItems.length}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600 dark:text-amber-400">Low on stock</span>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">Product</th>
                      <th className="text-center py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">QTY</th>
                      <th className="text-right py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLowItems.slice(0, 4).map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                        <td className="py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{item.name}</td>
                        <td className="py-1.5 text-center text-red-600 dark:text-red-400 font-medium">{item.qty}</td>
                        <td className="py-1.5 text-right">
                          <Link href="/production/purchase-orders" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">Reorder</Link>
                        </td>
                      </tr>
                    ))}
                    {allLowItems.length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-center text-gray-400">All items well stocked</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 mt-1">
                <button onClick={() => setInventoryView('detail')} className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1">
                  View all low on stock <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Out of Stock */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Out of Stock</p>
                  <p className="text-3xl font-bold mt-1">{allOutOfStock.length}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs text-red-600 dark:text-red-400">Out of stock</span>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">Product</th>
                      <th className="text-center py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">QTY</th>
                      <th className="text-right py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOutOfStock.slice(0, 4).map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                        <td className="py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[140px]">{item.name}</td>
                        <td className="py-1.5 text-center text-red-600 dark:text-red-400 font-bold">0</td>
                        <td className="py-1.5 text-right">
                          <Link href="/production/purchase-orders" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">Reorder</Link>
                        </td>
                      </tr>
                    ))}
                    {allOutOfStock.length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-center text-gray-400">No items out of stock</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 mt-1">
                <button onClick={() => setInventoryView('detail')} className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1">
                  View all out of stock <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Top Selling Products</p>
                <span className="text-xs text-gray-400 dark:text-gray-500">Last 30 days</span>
              </div>
              <div className="px-4 pb-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">Product Name</th>
                      <th className="text-center py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">Rolls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.slice(0, 5).map((f: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                        <td className="py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                          {f.color} <span className="text-gray-400">({f.subcategory})</span>
                        </td>
                        <td className="py-1.5 text-center font-medium text-gray-700 dark:text-gray-300">{f.rollsAvailable ?? 0}</td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && (
                      <tr><td colSpan={2} className="py-4 text-center text-gray-400">No product data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 mt-1">
                <Link href="/fabric-gallery" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1">
                  View fabric gallery <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Row 2: Open Purchase Orders + Inventory Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Open Purchase Orders */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Open Purchase Orders</p>
                  <p className="text-3xl font-bold mt-1">$0.00</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">0 open purchase orders</p>
                </div>
              </div>
              <div className="px-4 pb-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">PO No.</th>
                      <th className="text-left py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">Vendor</th>
                      <th className="text-right py-1.5 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={3} className="py-5 text-center text-gray-400">No open purchase orders</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 mt-1">
                <Link href="/production/purchase-orders" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1">
                  Create purchase order <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Inventory Reports */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Inventory Reports</p>
              </div>
              <div className="px-4 pb-2 divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { label: 'Inventory Valuation Summary', href: '/reports?section=inventory-valuation' },
                  { label: 'Inventory Valuation Detail', href: '/reports?section=inventory-detail' },
                  { label: 'Physical Inventory Worksheet', href: '/reports?section=physical-inventory' },
                  { label: 'Products and Services List', href: '/production/products' },
                  { label: 'Sales by Products — Summary', href: '/reports?section=sales-by-product' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{r.label}</span>
                    <Link href={r.href} className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium">View</Link>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
                <Link href="/reports" className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium flex items-center gap-1">
                  View all reports <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Products & Services ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Products &amp; Services</h2>
                <p className="text-xs text-muted-foreground mt-0.5">All inventory items, services, and bundles</p>
              </div>
              <div className="relative group">
                <Button className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs pr-3" onClick={() => { setPsNewProductType('Service'); setPsNewProductOpen(true) }}>
                  <Plus className="h-3.5 w-3.5" />
                  New
                </Button>
                <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-20 hidden group-hover:block">
                  {(['Service', 'Inventory item', 'Non-inventory item', 'Bundle'] as const).map((t) => (
                    <button key={t} onClick={() => { setPsNewProductType(t); setPsProduct(p => ({ ...p, itemType: t })); setPsNewProductOpen(true) }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toolbar: search + filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={psSearch} onChange={(e) => setPsSearch(e.target.value)} placeholder="Search name, SKU…" className="pl-9 h-8 text-sm" />
              </div>
              {/* Type filter */}
              <Select value={psTypeFilter} onValueChange={setPsTypeFilter}>
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All types</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Inventory">Inventory item</SelectItem>
                  <SelectItem value="Non-Invent.">Non-inventory</SelectItem>
                  <SelectItem value="Bundle">Bundle</SelectItem>
                </SelectContent>
              </Select>
              {/* Category filter */}
              <Select value={psCategoryFilter} onValueChange={setPsCategoryFilter}>
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All categories</SelectItem>
                  {psCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  {/* also cover categories derived from inventory data */}
                  {['Cassettes', 'Fabrics'].filter(c => !psCategories.includes(c)).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(psSearch || psTypeFilter !== 'All' || psCategoryFilter !== 'All') && (
                <button onClick={() => { setPsSearch(''); setPsTypeFilter('All'); setPsCategoryFilter('All') }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden bg-white dark:bg-gray-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SKU</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Qty</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Price</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taxable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const rows = [
                      ...fabrics.map(f => ({ id: f._id, name: f.colorName || f.name, sku: f.fabricCode || '—', category: f.collection || f.product || 'Fabrics', type: 'Inventory', qty: f.quantity, price: 0, taxable: true })),
                      ...cassettes.map(c => ({ id: c._id, name: `${c.type} ${c.color}`, sku: '—', category: 'Cassettes', type: 'Inventory', qty: c.quantity, price: 0, taxable: true })),
                      ...components.map(c => ({ id: c._id, name: c.name, sku: '—', category: c.type || '—', type: c.type === 'Service' ? 'Service' : 'Non-Invent.', qty: c.quantity, price: 0, taxable: true })),
                    ]
                    .filter(r => !psSearch || r.name.toLowerCase().includes(psSearch.toLowerCase()) || r.sku.toLowerCase().includes(psSearch.toLowerCase()))
                    .filter(r => psTypeFilter === 'All' || r.type === psTypeFilter)
                    .filter(r => psCategoryFilter === 'All' || r.category === psCategoryFilter)
                    if (rows.length === 0) return (
                      <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No items match the current filters</TableCell></TableRow>
                    )
                    return rows.map(item => (
                      <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <div className="h-7 w-7 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${item.type === 'Service' ? 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' : item.type === 'Inventory' ? 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' : 'border-gray-200 text-gray-600'}`}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-right">{item.qty}</TableCell>
                        <TableCell className="text-sm text-right text-muted-foreground">—</TableCell>
                        <TableCell className="text-sm">
                          {item.taxable && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </TableCell>
                      </TableRow>
                    ))
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── DETAIL / MANAGE ──────────────── */}
      {inventoryView === 'detail' && <div className="space-y-6">

      {/* Low-stock banner */}
      {totalLowStock > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-medium">{totalLowStock} item{totalLowStock !== 1 ? 's' : ''} low on stock</span>
            {lowStockFabrics.length > 0 && ` · ${lowStockFabrics.length} fabric${lowStockFabrics.length !== 1 ? 's' : ''}`}
            {lowStockCassettes.length > 0 && ` · ${lowStockCassettes.length} cassette${lowStockCassettes.length !== 1 ? 's' : ''}`}
            {lowStockComponents.length > 0 && ` · ${lowStockComponents.length} component${lowStockComponents.length !== 1 ? 's' : ''}`}
            . Consider creating a purchase order.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Manage fabrics, cassettes, components, and cut pieces
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCategory === 'fabrics' && (
            <Button variant="outline" className="gap-2" onClick={openUpdateStock}>
              <RefreshCw className="h-4 w-4" />
              Update Stock
            </Button>
          )}
          {isAdmin && (
            <Dialog open={addCategoryDialogOpen} onOpenChange={setAddCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Inventory Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Motors, Brackets, Hardware"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                    Add Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {selectedCategory === 'cut-pieces' && (
            <Dialog open={cutPieceDialogOpen} onOpenChange={setCutPieceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Cut Piece
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Cut Piece</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Fabric</Label>
                    <Input
                      value={newCutPiece.fabric}
                      onChange={(e) => setNewCutPiece({ ...newCutPiece, fabric: e.target.value })}
                      placeholder="Fabric name"
                    />
                  </div>
                  <div>
                    <Label>Label (optional)</Label>
                    <Input
                      value={newCutPiece.label}
                      onChange={(e) => setNewCutPiece({ ...newCutPiece, label: e.target.value })}
                      placeholder="e.g., Bedroom Left"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Width</Label>
                      <Input
                        type="number"
                        value={newCutPiece.width || ''}
                        onChange={(e) => setNewCutPiece({ ...newCutPiece, width: Number(e.target.value) || 0 })}
                        placeholder="Width"
                      />
                    </div>
                    <div>
                      <Label>Drop (Length)</Label>
                      <Input
                        type="number"
                        value={newCutPiece.length || ''}
                        onChange={(e) => setNewCutPiece({ ...newCutPiece, length: Number(e.target.value) || 0 })}
                        placeholder="Length"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={newCutPiece.quantity || ''}
                        onChange={(e) => setNewCutPiece({ ...newCutPiece, quantity: Number(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={newCutPiece.unit}
                        onChange={(e) => setNewCutPiece({ ...newCutPiece, unit: e.target.value })}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCutPieceDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddCutPiece} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {selectedCategory !== 'cut-pieces' && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null) }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => openDialog(selectedCategory === 'fabrics' ? 'fabric' : selectedCategory === 'cassettes' ? 'cassette' : 'component')}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit' : 'Add'} {dialogType === 'fabric' ? 'Fabric' : dialogType === 'cassette' ? 'Cassette' : 'Component'}
              </DialogTitle>
            </DialogHeader>
            {dialogType === 'fabric' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Fabric Name *</label>
                    <Input
                      value={newFabric.name}
                      onChange={(e) => setNewFabric({ ...newFabric, name: e.target.value })}
                      placeholder="Enter fabric name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Collection (optional)</label>
                    <Input
                      value={newFabric.collection}
                      onChange={(e) => setNewFabric({ ...newFabric, collection: e.target.value })}
                      placeholder="Collection name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fabric Code (optional)</label>
                    <Input
                      value={newFabric.fabricCode}
                      onChange={(e) => setNewFabric({ ...newFabric, fabricCode: e.target.value })}
                      placeholder="e.g. 110"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color Name (optional)</label>
                    <Input
                      value={newFabric.colorName}
                      onChange={(e) => setNewFabric({ ...newFabric, colorName: e.target.value })}
                      placeholder="e.g. Beige Wide"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color Code (optional)</label>
                    <Input
                      value={newFabric.colorCode}
                      onChange={(e) => setNewFabric({ ...newFabric, colorCode: e.target.value })}
                      placeholder="e.g. BV04"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Width (mm)</label>
                    <Input
                      type="number"
                      value={newFabric.width || ''}
                      onChange={(e) => setNewFabric({ ...newFabric, width: parseFloat(e.target.value) || 0 })}
                      placeholder="Maximum width"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity on Hand</label>
                    <Input
                      type="number"
                      value={newFabric.quantity || ''}
                      onChange={(e) => setNewFabric({ ...newFabric, quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="Current quantity"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Low Stock Threshold</label>
                    <Input
                      type="number"
                      value={newFabric.lowStockThreshold || ''}
                      onChange={(e) => setNewFabric({ ...newFabric, lowStockThreshold: parseFloat(e.target.value) || 10 })}
                      placeholder="10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Product</label>
                  <Select
                    value={newFabric.product}
                    onValueChange={(value) => setNewFabric({ ...newFabric, product: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Duo Shade</label>
                  <button
                    type="button"
                    onClick={() => setNewFabric({ ...newFabric, isDuo: !newFabric.isDuo })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${newFabric.isDuo ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${newFabric.isDuo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {newFabric.isDuo && (
                  <div>
                    <label className="text-sm font-medium">Duo Specs</label>
                    <Textarea
                      value={newFabric.duoSpecs}
                      onChange={(e) => setNewFabric({ ...newFabric, duoSpecs: e.target.value })}
                      placeholder="Enter duo shade specifications"
                      rows={2}
                    />
                  </div>
                )}
                {newFabric.product && (
                  <div>
                    <label className="text-sm font-medium">Product Specs (optional)</label>
                    <Textarea
                      value={newFabric.specs}
                      onChange={(e) => setNewFabric({ ...newFabric, specs: e.target.value })}
                      placeholder="Enter product specifications"
                      rows={3}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Image (optional)</label>
                  <Input type="file" accept="image/*" />
                </div>
              </div>
            )}
            {dialogType === 'cassette' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newCassette.type}
                    onValueChange={(value) => setNewCassette({ ...newCassette, type: value as 'Square' | 'Round' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Square">Square</SelectItem>
                      <SelectItem value="Round">Round</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Input
                    value={newCassette.color}
                    onChange={(e) => setNewCassette({ ...newCassette, color: e.target.value })}
                    placeholder="Enter color"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Specs</label>
                  <Textarea
                    value={newCassette.specs}
                    onChange={(e) => setNewCassette({ ...newCassette, specs: e.target.value })}
                    placeholder="Enter specifications"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={newCassette.quantity || ''}
                    onChange={(e) => setNewCassette({ ...newCassette, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Image (optional)</label>
                  <Input type="file" accept="image/*" />
                </div>
              </div>
            )}
            {dialogType === 'component' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Component Name</label>
                  <Input
                    value={newComponent.name}
                    onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                    placeholder="Enter component name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Input
                    value={newComponent.type}
                    onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value })}
                    placeholder="Enter component type"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={newComponent.quantity || ''}
                    onChange={(e) => setNewComponent({ ...newComponent, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    value={newComponent.unit}
                    onChange={(e) => setNewComponent({ ...newComponent, unit: e.target.value })}
                    placeholder="e.g., pieces, meters"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              {editingId ? (
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              ) : (
                <Button onClick={dialogType === 'fabric' ? handleAddFabric : dialogType === 'cassette' ? handleAddCassette : handleAddComponent} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
          )}
        </div>
      </div>

      {/* Category Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="category-select" className="text-sm font-medium">
              Category:
            </Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category-select" className="w-[250px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.value}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fabrics */}
      {selectedCategory === 'fabrics' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, collection, fabric code, color code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Select value={fabricCollectionFilter} onValueChange={setFabricCollectionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collections</SelectItem>
                    {collections.map((col) => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={fabricStatusFilter} onValueChange={setFabricStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={fabricTypeFilter} onValueChange={setFabricTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product} value={product}>{product}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fabrics ({filteredFabrics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fabric Name</TableHead>
                      <TableHead>Fabric Code</TableHead>
                      <TableHead>Color Name</TableHead>
                      <TableHead>Color Code</TableHead>
                      <TableHead>Collection</TableHead>
                      <TableHead>Max Width</TableHead>
                      <TableHead>Qty on Hand</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFabrics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                          No fabrics found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFabrics.map((fabric) => {
                        const threshold = fabric.lowStockThreshold ?? 10
                        const isLow = fabric.quantity <= threshold
                        const isWarning = fabric.quantity <= threshold * 2 && !isLow
                        return (
                          <TableRow key={fabric._id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <TableCell
                              className="font-medium"
                              onClick={() => { setSelectedFabric(fabric); setFabricDetailOpen(true) }}
                            >
                              <div className="flex items-center gap-1">
                                {fabric.name}
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60" />
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fabric.fabricCode || '—'}</TableCell>
                            <TableCell className="text-sm">{fabric.colorName || '—'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{fabric.colorCode || '—'}</TableCell>
                            <TableCell>{fabric.collection || '—'}</TableCell>
                            <TableCell>{fabric.width} mm</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={isLow ? 'text-red-600 font-medium' : ''}>{fabric.quantity}</span>
                                {isLow && (
                                  <Badge variant="destructive" className="gap-1 text-[10px]">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    Low
                                  </Badge>
                                )}
                                {isWarning && (
                                  <Badge className="gap-1 text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    Warning
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isLow ? (
                                <Badge variant="destructive">Low</Badge>
                              ) : (
                                <Badge variant="outline">In Stock</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {fabric.product && <Badge variant="outline" className="text-xs">{fabric.product}</Badge>}
                              {fabric.isDuo && <Badge variant="secondary" className="text-xs ml-1">Duo</Badge>}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEditFabric(fabric) }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDeleteFabric(fabric._id) }} disabled={deletingId === fabric._id}>
                                  {deletingId === fabric._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cassettes */}
      {selectedCategory === 'cassettes' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search cassettes by type, color, specs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Select value={cassetteTypeFilter} onValueChange={setCassetteTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Square">Square</SelectItem>
                    <SelectItem value="Round">Round</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={cassetteStatusFilter} onValueChange={setCassetteStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cassettes ({filteredCassettes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Specs</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCassettes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No cassettes found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCassettes.map((cassette) => (
                        <TableRow key={cassette._id}>
                          <TableCell>{cassette.type}</TableCell>
                          <TableCell>{cassette.color}</TableCell>
                          <TableCell>{cassette.specs}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {cassette.quantity}
                              {cassette.quantity < 20 && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {cassette.quantity < 20 ? (
                              <Badge variant="destructive">Low</Badge>
                            ) : (
                              <Badge variant="outline">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCassette(cassette)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCassette(cassette._id)} disabled={deletingId === cassette._id}>
                                {deletingId === cassette._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
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
      )}

      {/* Bottom Rails */}
      {selectedCategory === 'bottom-rails' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search bottom rails by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Select value={componentStatusFilter} onValueChange={setComponentStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bottom Rails ({filteredComponents.filter(c => c.type === 'Bottom Rail').length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComponents.filter(c => c.type === 'Bottom Rail').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No bottom rails found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredComponents.filter(c => c.type === 'Bottom Rail').map((component) => (
                        <TableRow key={component._id}>
                          <TableCell className="font-medium">{component.name}</TableCell>
                          <TableCell>{component.type}</TableCell>
                          <TableCell>{component.quantity}</TableCell>
                          <TableCell>{component.unit}</TableCell>
                          <TableCell>
                            {component.quantity < 50 ? (
                              <Badge variant="destructive">Low</Badge>
                            ) : (
                              <Badge variant="outline">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditComponent(component)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteComponent(component._id)} disabled={deletingId === component._id}>
                                {deletingId === component._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
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
      )}

      {/* Other Components */}
      {selectedCategory === 'components' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search components by name, type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <Select value={componentTypeFilter} onValueChange={setComponentTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Side Chain">Side Chain</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={componentStatusFilter} onValueChange={setComponentStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Components ({filteredComponents.filter(c => c.type !== 'Bottom Rail').length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComponents.filter(c => c.type !== 'Bottom Rail').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No components found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredComponents.filter(c => c.type !== 'Bottom Rail').map((component) => (
                        <TableRow key={component._id}>
                          <TableCell className="font-medium">{component.name}</TableCell>
                          <TableCell>{component.type}</TableCell>
                          <TableCell>{component.quantity}</TableCell>
                          <TableCell>{component.unit}</TableCell>
                          <TableCell>
                            {component.quantity < 50 ? (
                              <Badge variant="destructive">Low</Badge>
                            ) : (
                              <Badge variant="outline">In Stock</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditComponent(component)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteComponent(component._id)} disabled={deletingId === component._id}>
                                {deletingId === component._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
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
      )}

      {/* Cut Pieces */}
      {selectedCategory === 'cut-pieces' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cut pieces by fabric, label, width, length..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-9"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cut Pieces ({filteredCutPieces.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fabric</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Width</TableHead>
                      <TableHead>Drop</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCutPieces.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No cut pieces found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCutPieces.map((piece) => (
                        <TableRow key={piece._id}>
                          <TableCell className="font-medium">{piece.fabric}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{piece.label || '—'}</TableCell>
                          <TableCell>{piece.width}</TableCell>
                          <TableCell>{piece.length}</TableCell>
                          <TableCell>{piece.quantity}</TableCell>
                          <TableCell>{piece.unit}</TableCell>
                          <TableCell>{piece.createdAt ? new Date(piece.createdAt).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCutPiece(piece._id)} disabled={deletingId === piece._id}>
                              {deletingId === piece._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
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
      )}

      {/* Catalog Stock (FabricGallery with inStock/rollsAvailable) */}
      {selectedCategory === 'catalog-stock' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Catalog Stock</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Stock levels for fabric colors in your Fabric Gallery. Update these in the{' '}
                    <a href="/fabric-gallery" className="text-amber-600 underline">Fabric Gallery</a>.
                  </p>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {catalogFabrics.filter((f: any) => f.inStock !== false).length} in stock
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700">
                    {catalogFabrics.filter((f: any) => f.inStock === false).length} out of stock
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by color, category, collection…"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Color</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Openness</TableHead>
                      <TableHead>Collection</TableHead>
                      <TableHead>Rolls Available</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogFabrics
                      .filter((f: any) => {
                        if (!catalogSearch) return true
                        const q = catalogSearch.toLowerCase()
                        return (
                          f.color?.toLowerCase().includes(q) ||
                          f.category?.toLowerCase().includes(q) ||
                          f.collection?.toLowerCase().includes(q) ||
                          f.subcategory?.toLowerCase().includes(q)
                        )
                      })
                      .map((f: any) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.color}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{f.category}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{f.subcategory}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{f.collection || '—'}</TableCell>
                          <TableCell className="text-sm">{f.rollsAvailable ?? 0}</TableCell>
                          <TableCell>
                            {f.inStock === false ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Out of Stock</Badge>
                            ) : (f.rollsAvailable ?? 0) > 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">0 rolls</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    {catalogFabrics.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No catalog fabrics found. Add fabrics in the Fabric Gallery.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom categories */}
      {!['fabrics', 'cassettes', 'bottom-rails', 'components', 'cut-pieces', 'catalog-stock'].includes(selectedCategory) && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{categories.find(cat => cat.value === selectedCategory)?.name || 'Custom Category'} (0)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No items found. Add items to get started.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fabric Detail Dialog */}
      <FabricDetailDialog
        open={fabricDetailOpen}
        onOpenChange={setFabricDetailOpen}
        fabric={selectedFabric}
      />

      {/* Update Stock Dialog */}
      <Dialog open={updateStockOpen} onOpenChange={setUpdateStockOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Stock Quantities</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {stockDraft.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm truncate">{item.name}</span>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const updated = [...stockDraft]
                    updated[idx] = { ...updated[idx], quantity: Number(e.target.value) || 0 }
                    setStockDraft(updated)
                  }}
                  className="w-24 h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStockOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStock} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>}{/* end detail */}

      {/* ──────────────── PRODUCTS & SERVICES ──────────────── */}
      {inventoryView === 'products' && (
        <div className="space-y-4">
          {/* Alert banners */}
          {fabrics.filter(f => f.quantity === 0).length > 0 && (
            <div className="flex items-start gap-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium text-red-700 dark:text-red-300">Out of stock — </span>
                <span className="text-red-600 dark:text-red-400">{fabrics.filter(f => f.quantity === 0).length + cassettes.filter(c => c.quantity === 0).length} items are out of stock.</span>
                <button className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium">See all</button>
              </div>
            </div>
          )}
          {totalLowStock > 0 && (
            <div className="flex items-start gap-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium text-amber-700 dark:text-amber-300">Low stock — </span>
                <span className="text-amber-600 dark:text-amber-400">{totalLowStock} items are running low on stock.</span>
                <button className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium">See all</button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={psSearch}
                onChange={(e) => setPsSearch(e.target.value)}
                placeholder="Search by name, SKU or category"
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Filter
            </Button>
            <div className="relative group">
              <Button className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white pr-3" onClick={() => { setPsNewProductType('Service'); setPsNewProductOpen(true) }}>
                <Plus className="h-4 w-4" />
                New product/service
              </Button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-20 hidden group-hover:block">
                {(['Service', 'Inventory item', 'Non-inventory item', 'Bundle'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setPsNewProductType(t); setPsProduct({ ...psProduct, itemType: t }); setPsNewProductOpen(true) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 first:rounded-t-lg"
                  >
                    {t}
                  </button>
                ))}
                <div className="border-t dark:border-gray-700">
                  <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Batch import</button>
                </div>
              </div>
            </div>
          </div>

          {/* Products table */}
          <div className="rounded-xl border overflow-hidden bg-white dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="w-8"><input type="checkbox" className="h-4 w-4 rounded" /></TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">QTY ON HAND</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SKU</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Price</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Cost</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taxable</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ...fabrics
                    .filter(f => !psSearch || f.name.toLowerCase().includes(psSearch.toLowerCase()) || (f.fabricCode || '').toLowerCase().includes(psSearch.toLowerCase()))
                    .map(f => ({ id: f._id, image: null, name: f.colorName || f.name, qty: f.quantity, category: f.collection || f.product || '—', sku: f.fabricCode || '—', type: 'Inventory', price: 0, cost: 0, taxable: true })),
                  ...cassettes
                    .filter(c => !psSearch || `${c.type} ${c.color}`.toLowerCase().includes(psSearch.toLowerCase()))
                    .map(c => ({ id: c._id, image: null, name: `${c.type} ${c.color}`, qty: c.quantity, category: 'Cassettes', sku: '—', type: 'Inventory', price: 0, cost: 0, taxable: true })),
                  ...components
                    .filter(c => !psSearch || c.name.toLowerCase().includes(psSearch.toLowerCase()))
                    .map(c => ({ id: c._id, image: null, name: c.name, qty: c.quantity, category: c.type || '—', sku: '—', type: c.type === 'Service' ? 'Service' : 'Non-Invent.', price: 0, cost: 0, taxable: true })),
                ].map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell><input type="checkbox" className="h-4 w-4 rounded" /></TableCell>
                    <TableCell>
                      <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{item.name}</TableCell>
                    <TableCell className="text-sm text-right">{item.qty}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                    <TableCell className="text-sm">{item.type}</TableCell>
                    <TableCell className="text-sm text-right">{item.price}</TableCell>
                    <TableCell className="text-sm text-right">{item.cost}</TableCell>
                    <TableCell>
                      {item.taxable && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </TableCell>
                    <TableCell>
                      <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                    </TableCell>
                  </TableRow>
                ))}
                {fabrics.length + cassettes.length + components.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-10 text-muted-foreground text-sm">
                      No products found. Click "New product/service" to add your first item.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Add new product/service dialog */}
          <Dialog open={psNewProductOpen} onOpenChange={(v) => { setPsNewProductOpen(v); if (!v) { setShowAddVendor(false); setShowAddPsCategory(false) } }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="px-6 py-4 border-b dark:border-gray-700">
                <DialogTitle>Add a new {psNewProductType.toLowerCase()}</DialogTitle>
              </DialogHeader>

              <div className="divide-y dark:divide-gray-700">
                {/* ── Basic info ── */}
                <div className="px-6 py-5">
                  <h4 className="text-sm font-semibold mb-4">Basic info</h4>
                  <div className="flex gap-5">
                    {/* Left column */}
                    <div className="flex-1 space-y-4">
                      {/* Row 1: Name + Item type */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Name *</Label>
                          <Input
                            value={psProduct.name}
                            onChange={(e) => setPsProduct({ ...psProduct, name: e.target.value })}
                            placeholder="e.g. Installation Service"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Item type</Label>
                          <Select value={psProduct.itemType} onValueChange={(v) => setPsProduct({ ...psProduct, itemType: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Service">Service</SelectItem>
                              <SelectItem value="Inventory item">Inventory item</SelectItem>
                              <SelectItem value="Non-inventory item">Non-inventory item</SelectItem>
                              <SelectItem value="Bundle">Bundle</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Row 2: SKU + Category (same line) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">SKU</Label>
                          <Input
                            value={psProduct.sku}
                            onChange={(e) => setPsProduct({ ...psProduct, sku: e.target.value })}
                            placeholder="e.g. SVC-001"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Category</Label>
                          <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="mt-1 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-10 hover:bg-accent/30 transition-colors"
                              >
                                <span className={psProduct.category ? 'text-foreground' : 'text-muted-foreground'}>
                                  {psProduct.category || 'Select category…'}
                                </span>
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[240px] p-0" align="start" sideOffset={4}>
                              <Command>
                                <CommandInput placeholder="Search categories…" className="h-9" />
                                <CommandList>
                                  <CommandEmpty>No category found.</CommandEmpty>
                                  <CommandGroup heading="Categories">
                                    {psCategories.map((cat) => (
                                      <CommandItem
                                        key={cat}
                                        value={cat}
                                        onSelect={() => {
                                          setPsProduct(prev => ({ ...prev, category: cat }))
                                          setCategoryPopoverOpen(false)
                                        }}
                                        className="flex items-center gap-2 cursor-pointer"
                                      >
                                        <Check className={`h-4 w-4 shrink-0 ${psProduct.category === cat ? 'text-amber-600 opacity-100' : 'opacity-0'}`} />
                                        {cat}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  <CommandSeparator />
                                  <CommandGroup>
                                    {showAddPsCategory ? (
                                      <div className="px-2 py-1.5 space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium">New category name</p>
                                        <Input
                                          value={newPsCategoryName}
                                          onChange={(e) => setNewPsCategoryName(e.target.value)}
                                          placeholder="e.g. Motorization"
                                          className="h-8 text-sm"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            e.stopPropagation()
                                            if (e.key === 'Enter') { handleAddPsCategory(); setCategoryPopoverOpen(false) }
                                            if (e.key === 'Escape') { setShowAddPsCategory(false); setNewPsCategoryName('') }
                                          }}
                                        />
                                        <div className="flex gap-1.5">
                                          <Button
                                            size="sm"
                                            className="flex-1 h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                            onClick={() => { handleAddPsCategory(); setCategoryPopoverOpen(false) }}
                                            disabled={!newPsCategoryName.trim()}
                                          >
                                            Add category
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs px-2"
                                            onClick={() => { setShowAddPsCategory(false); setNewPsCategoryName('') }}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <CommandItem
                                        onSelect={() => setShowAddPsCategory(true)}
                                        className="flex items-center gap-2 cursor-pointer text-amber-600 font-medium"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add new category…
                                      </CommandItem>
                                    )}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>

                    {/* Image upload box */}
                    <div className="shrink-0">
                      <div className="h-28 w-28 border-2 border-dashed dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                        <Package className="h-8 w-8 text-muted-foreground/40 mb-1" />
                        <span className="text-xs text-blue-500 text-center">Add image</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Sales ── */}
                <div className="px-6 py-5">
                  <h4 className="text-sm font-semibold mb-4">Sales</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={psProduct.sellToCustomers} onChange={(e) => setPsProduct({ ...psProduct, sellToCustomers: e.target.checked })} className="h-4 w-4 rounded accent-amber-500" />
                      <span className="text-sm">I sell this {psProduct.itemType.toLowerCase()} to my customers</span>
                    </label>
                    {psProduct.sellToCustomers && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3">
                          <Label className="text-sm">Description</Label>
                          <Textarea value={psProduct.description} onChange={(e) => setPsProduct({ ...psProduct, description: e.target.value })} rows={2} className="mt-1 resize-none" placeholder="Shown on invoices and quotes" />
                        </div>
                        <div>
                          <Label className="text-sm">Price / Rate</Label>
                          <Input value={psProduct.priceRate} onChange={(e) => setPsProduct({ ...psProduct, priceRate: e.target.value })} className="mt-1" type="number" placeholder="0.00" />
                        </div>
                        <div>
                          <Label className="text-sm">Income account *</Label>
                          <Select value={psProduct.incomeAccount} onValueChange={(v) => setPsProduct({ ...psProduct, incomeAccount: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="410 Services">410 Services</SelectItem>
                              <SelectItem value="400 Sales">400 Sales</SelectItem>
                              <SelectItem value="420 Other Income">420 Other Income</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Sales tax</Label>
                          <Select value={psProduct.salesTaxCategory} onValueChange={(v) => setPsProduct({ ...psProduct, salesTaxCategory: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Taxable–standard rate">Taxable – standard rate</SelectItem>
                              <SelectItem value="Non-taxable">Non-taxable</SelectItem>
                              <SelectItem value="Out of scope">Out of scope</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Purchasing ── */}
                <div className="px-6 py-5">
                  <h4 className="text-sm font-semibold mb-4">Purchasing</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={psProduct.purchaseFromVendor} onChange={(e) => setPsProduct({ ...psProduct, purchaseFromVendor: e.target.checked })} className="h-4 w-4 rounded accent-amber-500" />
                      <span className="text-sm">I purchase this {psProduct.itemType.toLowerCase()} from a vendor</span>
                    </label>
                    {psProduct.purchaseFromVendor && (
                      <div className="grid grid-cols-3 gap-4">
                        {/* Vendor combobox */}
                        <div className="col-span-3">
                          <Label className="text-sm">Vendor</Label>
                          <Popover open={vendorPopoverOpen} onOpenChange={setVendorPopoverOpen}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="mt-1 w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-10 hover:bg-accent/30 transition-colors"
                              >
                                <span className={psProduct.vendorName ? 'text-foreground' : 'text-muted-foreground'}>
                                  {psProduct.vendorName || 'Select vendor…'}
                                </span>
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[340px] p-0" align="start" sideOffset={4}>
                              <Command>
                                <CommandInput placeholder="Search vendors…" className="h-9" />
                                <CommandList>
                                  {vendors.length === 0
                                    ? <CommandEmpty>No vendors yet.</CommandEmpty>
                                    : <CommandEmpty>No vendor found.</CommandEmpty>
                                  }
                                  {vendors.length > 0 && (
                                    <CommandGroup heading="Vendors">
                                      {vendors.map((v) => (
                                        <CommandItem
                                          key={v.id}
                                          value={v.name}
                                          onSelect={() => {
                                            setPsProduct(prev => ({ ...prev, vendorId: v.id, vendorName: v.name }))
                                            setVendorPopoverOpen(false)
                                          }}
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          <Check className={`h-4 w-4 shrink-0 ${psProduct.vendorId === v.id ? 'text-amber-600 opacity-100' : 'opacity-0'}`} />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{v.name}</p>
                                            {v.phone && <p className="text-xs text-muted-foreground">{v.phone}</p>}
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                  <CommandSeparator />
                                  <CommandGroup>
                                    {showAddVendor ? (
                                      <div className="px-2 py-1.5 space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium">New vendor name</p>
                                        <Input
                                          value={newVendorName}
                                          onChange={(e) => setNewVendorName(e.target.value)}
                                          placeholder="e.g. Hunter Douglas"
                                          className="h-8 text-sm"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            e.stopPropagation()
                                            if (e.key === 'Enter') { handleAddVendor(); setVendorPopoverOpen(false) }
                                            if (e.key === 'Escape') { setShowAddVendor(false); setNewVendorName('') }
                                          }}
                                        />
                                        <div className="flex gap-1.5">
                                          <Button
                                            size="sm"
                                            className="flex-1 h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                            onClick={() => { handleAddVendor(); setVendorPopoverOpen(false) }}
                                            disabled={vendorSaving || !newVendorName.trim()}
                                          >
                                            {vendorSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                            Save vendor
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs px-2"
                                            onClick={() => { setShowAddVendor(false); setNewVendorName('') }}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <CommandItem
                                        onSelect={() => setShowAddVendor(true)}
                                        className="flex items-center gap-2 cursor-pointer text-amber-600 font-medium"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add new vendor…
                                      </CommandItem>
                                    )}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label className="text-sm">Purchase cost</Label>
                          <Input value={psProduct.purchaseCost} onChange={(e) => setPsProduct({ ...psProduct, purchaseCost: e.target.value })} className="mt-1" type="number" placeholder="0.00" />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm">Expense account</Label>
                          <Select value={psProduct.expenseAccount} onValueChange={(v) => setPsProduct({ ...psProduct, expenseAccount: v })}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Select account" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cost of Goods Sold">Cost of Goods Sold</SelectItem>
                              <SelectItem value="Purchases">Purchases</SelectItem>
                              <SelectItem value="Other Expenses">Other Expenses</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700">
                <Button variant="outline" onClick={() => setPsNewProductOpen(false)}>Cancel</Button>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white" disabled={!psProduct.name.trim()}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}{/* end products */}
    </div>
  )
}
