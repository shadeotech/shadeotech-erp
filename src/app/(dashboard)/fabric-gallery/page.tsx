'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Search, X, Plus, Trash2, Loader2, Upload, Pencil, ChevronLeft, ChevronRight, Layers, Palette, Grid3X3, Package, FileSpreadsheet, Download, CheckCircle2, AlertCircle, CircleOff, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import type { Fabric } from '@/types/fabric'
import { QUOTE_COLLECTIONS } from '@/lib/quoteConstants'
import { getFabricImageUrl } from '@/constants/fabrics'

interface ProductOption {
  _id: string
  name: string
  categories: { _id: string; name: string; collections: { _id: string; name: string }[] }[]
}

function FabricImage({ fabric, alt }: { fabric: { imageUrl?: string | null; imageFilename: string; color?: string }; alt: string }) {
  const [error, setError] = useState(false)
  const src = getFabricImageUrl(fabric)
  const showPlaceholder = !src || error
  return showPlaceholder ? (
    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs text-center p-2 select-none">
      {alt}
    </div>
  ) : (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-contain"
      unoptimized
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      onError={() => setError(true)}
    />
  )
}

type StockStatusValue = 'in_stock' | 'back_order' | 'discontinued'

const STOCK_OPTIONS: { value: StockStatusValue; label: string; icon: React.ElementType; active: string; inactive: string }[] = [
  {
    value: 'in_stock',
    label: 'In Stock',
    icon: CheckCircle2,
    active: 'bg-green-500 text-white border-green-500',
    inactive: 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400',
  },
  {
    value: 'back_order',
    label: 'Back Order',
    icon: Clock,
    active: 'bg-amber-500 text-white border-amber-500',
    inactive: 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400',
  },
  {
    value: 'discontinued',
    label: 'Discontinued',
    icon: CircleOff,
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400',
  },
]

function StockStatusSelector({ value, onChange }: { value: StockStatusValue; onChange: (v: StockStatusValue) => void }) {
  return (
    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden divide-x divide-gray-200 dark:divide-gray-700">
      {STOCK_OPTIONS.map(opt => {
        const Icon = opt.icon
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm font-medium transition-colors border-0 ${isActive ? opt.active : opt.inactive}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

type FabricForm = {
  category: string
  subcategory: string
  color: string
  collection: string
  pricingCollectionId: string
  imageFilename: string
  imageUrl: string
  cloudinaryPublicId: string
  opacity: string
  width: string
  minWidth: string
  maxWidth: string
  rollLength: string
  fabricWidth: string
  stockStatus: 'in_stock' | 'back_order' | 'discontinued'
  expectedArrival: string
  rollsAvailable: string
}

type NewFabric = FabricForm

const EMPTY_NEW_FABRIC: FabricForm = {
  category: '',
  subcategory: '',
  color: '',
  collection: '',
  pricingCollectionId: '',
  imageFilename: '',
  imageUrl: '',
  cloudinaryPublicId: '',
  opacity: '',
  width: '',
  minWidth: '',
  maxWidth: '',
  rollLength: '',
  fabricWidth: '',
  stockStatus: 'in_stock',
  expectedArrival: '',
  rollsAvailable: '0',
}

export default function FabricGalleryPage() {
  const { user, token } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newFabric, setNewFabric] = useState<NewFabric>(EMPTY_NEW_FABRIC)
  const [uploading, setUploading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null)
  const [editForm, setEditForm] = useState<FabricForm>(EMPTY_NEW_FABRIC)
  const [editSaving, setEditSaving] = useState(false)
  const [editUploading, setEditUploading] = useState(false)

  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ inserted: number; errors: { row: number; error: string }[]; total: number } | null>(null)

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [page, setPage] = useState(1)
  const [PAGE_SIZE, setPageSize] = useState(24)

  const fetchFabrics = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      setLoading(true)
      setFetchError(null)
      const res = await fetch('/api/fabric-gallery', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Server error ${res.status}`)
      }
      const data = await res.json()
      setFabrics((data.fabrics ?? []).map((f: any) => ({
        id: f.id,
        category: f.category ?? '',
        subcategory: f.subcategory ?? '',
        mountType: f.mountType,
        mountTypeStockStatus: f.mountTypeStockStatus,
        opacity: f.opacity,
        color: f.color ?? '',
        collection: f.collection ?? '',
        pricingCollectionId: f.pricingCollectionId ?? '',
        imageFilename: f.imageFilename ?? 'white.jpg',
        imageUrl: f.imageUrl ?? undefined,
        width: f.width,
        minWidth: f.minWidth,
        maxWidth: f.maxWidth,
        rollLength: f.rollLength,
        fabricWidth: f.fabricWidth ?? undefined,
        stockStatus: f.stockStatus ?? (f.inStock === false ? 'back_order' : 'in_stock'),
        expectedArrival: f.expectedArrival ?? undefined,
        inStock: f.inStock ?? true,
        rollsAvailable: f.rollsAvailable ?? 0,
      })))
    } catch (err) {
      console.error(err)
      setFetchError(err instanceof Error ? err.message : 'Failed to load fabrics')
      setFabrics([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchFabrics() }, [fetchFabrics])

  useEffect(() => {
    if (!token) return
    fetch('/api/production/products', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: ProductOption[]) => setProductOptions(data))
      .catch(() => {})
  }, [token])

  const categories = useMemo(() => Array.from(new Set(fabrics.map(f => f.category))).sort(), [fabrics])

  const subcategories = useMemo(() => {
    const base = selectedCategory === 'all' ? fabrics : fabrics.filter(f => f.category === selectedCategory)
    return Array.from(new Set(base.map(f => f.subcategory))).sort()
  }, [selectedCategory, fabrics])

  // Collections scoped to the current category + subcategory selection
  const collections = useMemo(() => {
    let base = fabrics
    if (selectedCategory !== 'all') base = base.filter(f => f.category === selectedCategory)
    if (selectedSubcategory !== 'all') base = base.filter(f => f.subcategory === selectedSubcategory)
    return Array.from(new Set(base.map(f => f.collection).filter(Boolean))).sort()
  }, [selectedCategory, selectedSubcategory, fabrics])

  const filteredFabrics = useMemo(() => fabrics.filter(fabric => {
    const q = searchTerm.toLowerCase()
    const matchesSearch = !q ||
      fabric.color.toLowerCase().includes(q) ||
      fabric.collection.toLowerCase().includes(q) ||
      fabric.category.toLowerCase().includes(q) ||
      fabric.subcategory.toLowerCase().includes(q)
    return matchesSearch &&
      (selectedCategory === 'all' || fabric.category === selectedCategory) &&
      (selectedSubcategory === 'all' || fabric.subcategory === selectedSubcategory) &&
      (selectedCollection === 'all' || fabric.collection === selectedCollection)
  }), [fabrics, searchTerm, selectedCategory, selectedSubcategory, selectedCollection])

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [searchTerm, selectedCategory, selectedSubcategory, selectedCollection])

  const totalPages = Math.max(1, Math.ceil(filteredFabrics.length / PAGE_SIZE))
  const paginatedFabrics = filteredFabrics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function clearFilters() {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedSubcategory('all')
    setSelectedCollection('all')
  }

  async function handleAddFabric() {
    if (!newFabric.category || !newFabric.subcategory || !newFabric.color) {
      alert('Please fill in Category, Subcategory, and Color')
      return
    }
    if (!token) return
    setAddSaving(true)
    try {
      const res = await fetch('/api/fabric-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: newFabric.category,
          subcategory: newFabric.subcategory,
          color: newFabric.color,
          collection: newFabric.collection || undefined,
          pricingCollectionId: newFabric.pricingCollectionId || undefined,
          imageFilename: newFabric.imageFilename || 'white.jpg',
          imageUrl: newFabric.imageUrl || undefined,
          cloudinaryPublicId: newFabric.cloudinaryPublicId || undefined,
          opacity: newFabric.opacity || undefined,
          width: newFabric.width || undefined,
          minWidth: newFabric.minWidth || undefined,
          maxWidth: newFabric.maxWidth || undefined,
          rollLength: newFabric.rollLength || undefined,
          stockStatus: newFabric.stockStatus,
          expectedArrival: newFabric.expectedArrival || undefined,
          rollsAvailable: Number(newFabric.rollsAvailable) || 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to add fabric')
      }
      setNewFabric(EMPTY_NEW_FABRIC)
      setAddDialogOpen(false)
      await fetchFabrics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add fabric')
    } finally {
      setAddSaving(false)
    }
  }

  function handleEditClick(fabric: Fabric) {
    setEditingFabric(fabric)
    setEditForm({
      category: fabric.category,
      subcategory: fabric.subcategory,
      color: fabric.color,
      collection: fabric.collection ?? '',
      pricingCollectionId: (fabric as any).pricingCollectionId ?? '',
      imageFilename: fabric.imageFilename ?? '',
      imageUrl: fabric.imageUrl ?? '',
      cloudinaryPublicId: '',
      opacity: fabric.opacity ?? '',
      width: fabric.width ?? '',
      minWidth: fabric.minWidth ?? '',
      maxWidth: fabric.maxWidth ?? '',
      rollLength: fabric.rollLength ?? '',
      fabricWidth: (fabric as any).fabricWidth != null ? String((fabric as any).fabricWidth) : '',
      stockStatus: (fabric as any).stockStatus ?? (fabric.inStock === false ? 'back_order' : 'in_stock'),
      expectedArrival: (fabric as any).expectedArrival ?? '',
      rollsAvailable: String(fabric.rollsAvailable ?? 0),
    })
    setEditDialogOpen(true)
  }

  async function handleSaveEdit() {
    if (!editingFabric || !token) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/fabric-gallery/${editingFabric.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: editForm.category,
          subcategory: editForm.subcategory,
          color: editForm.color,
          collection: editForm.collection || undefined,
          pricingCollectionId: editForm.pricingCollectionId || undefined,
          imageFilename: editForm.imageFilename || 'placeholder.jpg',
          imageUrl: editForm.imageUrl || undefined,
          cloudinaryPublicId: editForm.cloudinaryPublicId || undefined,
          opacity: editForm.opacity || undefined,
          width: editForm.width || undefined,
          minWidth: editForm.minWidth || undefined,
          maxWidth: editForm.maxWidth || undefined,
          rollLength: editForm.rollLength || undefined,
          fabricWidth: editForm.fabricWidth !== '' ? Number(editForm.fabricWidth) : null,
          stockStatus: editForm.stockStatus,
          expectedArrival: editForm.expectedArrival || undefined,
          rollsAvailable: Number(editForm.rollsAvailable) || 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }
      setEditDialogOpen(false)
      setEditingFabric(null)
      await fetchFabrics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save fabric')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteClick(fabric: Fabric) {
    if (!window.confirm(`Delete "${fabric.color}" from the fabric gallery?`)) return
    if (!token) return
    try {
      const res = await fetch(`/api/fabric-gallery/${fabric.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete fabric')
      }
      await fetchFabrics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete fabric')
    }
  }

  async function handleBulkUpload() {
    if (!bulkFile || !token) return
    setBulkUploading(true)
    setBulkResult(null)
    try {
      const form = new FormData()
      form.append('file', bulkFile)
      const res = await fetch('/api/fabric-gallery/bulk', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bulk upload failed')
      setBulkResult(data)
      if (data.inserted > 0) await fetchFabrics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk upload failed')
    } finally {
      setBulkUploading(false)
    }
  }

  async function downloadTemplate() {
    if (!token) return
    const res = await fetch('/api/fabric-gallery/bulk', { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fabric-upload-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasFilters = selectedCategory !== 'all' || selectedSubcategory !== 'all' || selectedCollection !== 'all' || !!searchTerm

  const allCollections = useMemo(() => Array.from(new Set(fabrics.map(f => f.collection).filter(Boolean))), [fabrics])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Fabric Gallery</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add fabric colors here. Manage products, openness options, and collections in{' '}
              <Link href="/production/products" className="text-amber-600 underline underline-offset-2">Products</Link>.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-3 py-1.5">
              <Grid3X3 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{fabrics.length}</span>
              <span className="text-xs text-amber-600/70 dark:text-amber-400/70">fabrics</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 px-3 py-1.5">
              <Layers className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{categories.length}</span>
              <span className="text-xs text-stone-500/70 dark:text-stone-400/70">product types</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 px-3 py-1.5">
              <Palette className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{allCollections.length}</span>
              <span className="text-xs text-stone-500/70 dark:text-stone-400/70">collections</span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/production/products">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Manage Products
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setBulkDialogOpen(true); setBulkResult(null); setBulkFile(null) }}>
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Bulk Upload
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Fabric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Fabric</DialogTitle>
                <DialogDescription>Fields marked * are required.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-5">
                {/* Row 1: Identity */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select value={newFabric.category} onValueChange={v => setNewFabric({ ...newFabric, category: v, subcategory: '', collection: '' })}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {productOptions.map(p => <SelectItem key={p._id} value={p.name}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Openness *</Label>
                    {(() => {
                      const sel = productOptions.find(p => p.name === newFabric.category)
                      const cats = sel?.categories ?? []
                      return cats.length > 0 ? (
                        <Select value={newFabric.subcategory} onValueChange={v => setNewFabric({ ...newFabric, subcategory: v, collection: '' })}>
                          <SelectTrigger><SelectValue placeholder="Select openness" /></SelectTrigger>
                          <SelectContent>{cats.map(c => <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Input value={newFabric.subcategory} onChange={e => setNewFabric({ ...newFabric, subcategory: e.target.value })} placeholder="e.g., 1%, Light Filtering" />
                      )
                    })()}
                  </div>
                  <div className="space-y-2">
                    <Label>Color Name *</Label>
                    <Input value={newFabric.color} onChange={e => setNewFabric({ ...newFabric, color: e.target.value })} placeholder="e.g., White, Sunrise" />
                  </div>
                </div>

                {/* Row 2: Collection + Pricing */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Collection</Label>
                    {(() => {
                      const sel = productOptions.find(p => p.name === newFabric.category)
                      const cat = sel?.categories.find(c => c.name === newFabric.subcategory)
                      const cols = cat?.collections ?? []
                      return cols.length > 0 ? (
                        <Select value={newFabric.collection} onValueChange={v => setNewFabric({ ...newFabric, collection: v })}>
                          <SelectTrigger><SelectValue placeholder="Select collection" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {cols.map(c => <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={newFabric.collection} onChange={e => setNewFabric({ ...newFabric, collection: e.target.value })} placeholder="e.g., Infra, Salvus" />
                      )
                    })()}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Pricing Chart</Label>
                    <Select value={newFabric.pricingCollectionId} onValueChange={v => setNewFabric({ ...newFabric, pricingCollectionId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select pricing chart" /></SelectTrigger>
                      <SelectContent>{QUOTE_COLLECTIONS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Stock Status */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
                  <Label className="text-sm font-medium">Availability</Label>
                  <StockStatusSelector value={newFabric.stockStatus} onChange={v => setNewFabric({ ...newFabric, stockStatus: v, expectedArrival: v !== 'back_order' ? '' : newFabric.expectedArrival })} />
                  {newFabric.stockStatus === 'back_order' && (
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div className="space-y-2">
                        <Label className="text-xs text-amber-700 dark:text-amber-400 font-medium">Expected Arrival Date</Label>
                        <Input
                          type="date"
                          value={newFabric.expectedArrival}
                          onChange={e => setNewFabric({ ...newFabric, expectedArrival: e.target.value })}
                          className="border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs text-muted-foreground">Rolls Available</Label>
                        <Input type="number" min="0" value={newFabric.rollsAvailable} onChange={e => setNewFabric({ ...newFabric, rollsAvailable: e.target.value })} placeholder="0" />
                      </div>
                    </div>
                  )}
                  {newFabric.stockStatus === 'in_stock' && (
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Rolls Available</Label>
                        <Input type="number" min="0" value={newFabric.rollsAvailable} onChange={e => setNewFabric({ ...newFabric, rollsAvailable: e.target.value })} placeholder="0" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 4: Specs */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Opacity</Label>
                    <Input value={newFabric.opacity} onChange={e => setNewFabric({ ...newFabric, opacity: e.target.value })} placeholder="e.g., 10%, 5%" />
                  </div>
                  <div className="space-y-2">
                    <Label>Roll Width</Label>
                    <Input value={newFabric.width} onChange={e => setNewFabric({ ...newFabric, width: e.target.value })} placeholder='e.g., 126"' />
                  </div>
                  <div className="space-y-2">
                    <Label>Roll Length</Label>
                    <Input value={newFabric.rollLength} onChange={e => setNewFabric({ ...newFabric, rollLength: e.target.value })} placeholder="e.g., 22 yd/roll" />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Width</Label>
                    <Input value={newFabric.minWidth} onChange={e => setNewFabric({ ...newFabric, minWidth: e.target.value })} placeholder='e.g., 24"' />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Width</Label>
                    <Input value={newFabric.maxWidth} onChange={e => setNewFabric({ ...newFabric, maxWidth: e.target.value })} placeholder='e.g., 126"' />
                  </div>
                </div>

                {/* Row 5: Image */}
                <div className="space-y-2">
                  <Label>Fabric Image</Label>
                  <div className="flex gap-4 items-center flex-wrap">
                    <Label htmlFor="fabric-upload" className="cursor-pointer border rounded-md px-3 py-2 text-sm font-medium hover:bg-muted flex items-center gap-2 shrink-0">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading…' : 'Upload image'}
                    </Label>
                    <input id="fabric-upload" type="file" accept="image/*" className="hidden" disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file || !token) return
                        setUploading(true); e.target.value = ''
                        try {
                          const form = new FormData(); form.append('file', file)
                          const res = await fetch('/api/fabric-gallery/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
                          if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Upload failed') }
                          const { url, publicId } = await res.json()
                          setNewFabric(prev => ({ ...prev, imageUrl: url, cloudinaryPublicId: publicId ?? '' }))
                        } catch (err) { alert(err instanceof Error ? err.message : 'Upload failed') }
                        finally { setUploading(false) }
                      }}
                    />
                    {newFabric.imageUrl && (
                      <div className="relative w-20 h-20 shrink-0 border rounded overflow-hidden bg-muted">
                        <Image src={newFabric.imageUrl} alt="Preview" fill className="object-contain" unoptimized />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddDialogOpen(false); setNewFabric(EMPTY_NEW_FABRIC) }}>Cancel</Button>
                <Button onClick={handleAddFabric} disabled={addSaving}>
                  {addSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Fabric
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative w-48 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <Select
              value={selectedCategory}
              onValueChange={v => {
                setSelectedCategory(v)
                setSelectedSubcategory('all')
                setSelectedCollection('all')
              }}
            >
              <SelectTrigger className="h-9 flex-1 min-w-[140px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={selectedSubcategory}
              onValueChange={v => {
                setSelectedSubcategory(v)
                setSelectedCollection('all')
              }}
            >
              <SelectTrigger className="h-9 flex-1 min-w-[140px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
                <SelectValue placeholder="All Subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategories.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="h-9 flex-1 min-w-[140px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
                <SelectValue placeholder={selectedCategory === 'all' ? 'All Collections' : `Collections (${collections.length})`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {collections.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-gray-500 hover:text-gray-700">
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results bar */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          {filteredFabrics.length === 0 ? (
            'No fabrics match your filters'
          ) : (
            <>
              Showing <span className="font-medium text-gray-700 dark:text-gray-300">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredFabrics.length)}</span> of <span className="font-medium text-gray-700 dark:text-gray-300">{filteredFabrics.length}</span> fabrics
              {filteredFabrics.length !== fabrics.length && <span className="text-gray-400"> (filtered from {fabrics.length})</span>}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 dark:text-gray-500">Per page</span>
          <Select
            value={String(PAGE_SIZE)}
            onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}
          >
            <SelectTrigger className="h-8 w-20 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
              <SelectItem value="72">72</SelectItem>
              <SelectItem value="96">96</SelectItem>
              <SelectItem value="120">120</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredFabrics.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {fetchError ? (
              <div className="space-y-3">
                <p className="text-red-500 font-medium">Failed to load fabrics</p>
                <p className="text-sm">{fetchError}</p>
                <Button variant="outline" size="sm" onClick={fetchFabrics}>Retry</Button>
              </div>
            ) : fabrics.length === 0
              ? (token ? 'No fabrics yet. Add one to get started.' : 'Please log in to view the fabric gallery.')
              : 'No fabrics match your filters.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedFabrics.map(fabric => (
            <Card key={fabric.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square bg-muted overflow-hidden">
                {isAdmin && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 shadow-md"
                      onClick={() => handleEditClick(fabric)}
                      aria-label="Edit fabric"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 shadow-md"
                      onClick={() => handleDeleteClick(fabric)}
                      aria-label="Delete fabric"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <FabricImage fabric={fabric} alt={fabric.color} />
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-semibold leading-tight">{fabric.color}</h3>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{fabric.category}</Badge>
                  <Badge variant="outline" className="text-xs">{fabric.subcategory}</Badge>
                  {fabric.collection && (
                    <Badge variant="outline" className="text-xs">{fabric.collection}</Badge>
                  )}
                  {(fabric as any).stockStatus === 'discontinued' ? (
                    <Badge className="text-xs bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-100 flex items-center gap-1">
                      <CircleOff className="h-3 w-3" /> Discontinued
                    </Badge>
                  ) : (fabric as any).stockStatus === 'back_order' ? (
                    <Badge className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 hover:bg-amber-50 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(fabric as any).expectedArrival
                        ? `Due ${new Date((fabric as any).expectedArrival).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'Back Order'}
                    </Badge>
                  ) : (fabric.rollsAvailable ?? 0) > 0 ? (
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 hover:bg-green-100 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {fabric.rollsAvailable} rolls
                    </Badge>
                  ) : (
                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 hover:bg-green-100 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> In Stock
                    </Badge>
                  )}
                </div>
                {(fabric as any).pricingCollectionId && (
                  <p className="text-xs text-muted-foreground">
                    Chart: <span className="font-mono">{(fabric as any).pricingCollectionId}</span>
                  </p>
                )}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {fabric.opacity && <p>Opacity: {fabric.opacity}</p>}
                  {fabric.width && <p>Width: {fabric.width}</p>}
                  {(fabric.minWidth || fabric.maxWidth) && (
                    <p>Range: {fabric.minWidth && `min ${fabric.minWidth}`}{fabric.minWidth && fabric.maxWidth && ' – '}{fabric.maxWidth && `max ${fabric.maxWidth}`}</p>
                  )}
                  {fabric.rollLength && <p>Roll: {fabric.rollLength}</p>}
                  {fabric.category === 'Duo Shades' && (fabric as any).fabricWidth != null && (
                    <p className={(fabric as any).fabricWidth < 3 ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                      Fabric width: {(fabric as any).fabricWidth}&quot;
                      {(fabric as any).fabricWidth < 3 && ' — no fabric wrap'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = totalPages <= 7
                ? i + 1
                : page <= 4
                ? i + 1
                : page >= totalPages - 3
                ? totalPages - 6 + i
                : page - 3 + i
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={(open) => { setBulkDialogOpen(open); if (!open) { setBulkFile(null); setBulkResult(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Upload Fabrics</DialogTitle>
            <DialogDescription>Upload a CSV file to add multiple fabrics at once.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Template download */}
            <div className="rounded-lg border border-amber-100 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Step 1 — Download the template</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/70">Fill in the CSV with your fabric data. Required columns: <span className="font-mono">category</span>, <span className="font-mono">subcategory</span>, <span className="font-mono">color</span>.</p>
              <Button variant="outline" size="sm" className="gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40" onClick={downloadTemplate}>
                <Download className="h-3.5 w-3.5" />
                Download CSV Template
              </Button>
            </div>

            {/* CSV column reference */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1.5">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">CSV Columns</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                <span><span className="font-mono text-gray-700 dark:text-gray-300">category</span> <span className="text-red-500">*</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">subcategory</span> <span className="text-red-500">*</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">color</span> <span className="text-red-500">*</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">collection</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">pricingCollectionId</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">opacity</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">width</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">minWidth</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">maxWidth</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">rollLength</span></span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">inStock</span> (true/false)</span>
                <span><span className="font-mono text-gray-700 dark:text-gray-300">rollsAvailable</span> (number)</span>
              </div>
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Step 2 — Upload your CSV</p>
              <Label
                htmlFor="bulk-csv-upload"
                className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-5 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
              >
                <Upload className="h-5 w-5 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  {bulkFile ? (
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate block">{bulkFile.name}</span>
                  ) : (
                    <span className="text-sm text-gray-500">Click to select a .csv file</span>
                  )}
                </div>
              </Label>
              <input
                id="bulk-csv-upload"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => { setBulkFile(e.target.files?.[0] ?? null); setBulkResult(null) }}
              />
            </div>

            {/* Results */}
            {bulkResult && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    {bulkResult.inserted} of {bulkResult.total} fabrics imported successfully
                  </p>
                </div>
                {bulkResult.errors.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {bulkResult.errors.length} row{bulkResult.errors.length !== 1 ? 's' : ''} skipped
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                      {bulkResult.errors.map(e => (
                        <p key={e.row} className="text-xs text-red-500">Row {e.row}: {e.error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkDialogOpen(false); setBulkFile(null); setBulkResult(null) }}>
              {bulkResult ? 'Close' : 'Cancel'}
            </Button>
            {!bulkResult && (
              <Button onClick={handleBulkUpload} disabled={!bulkFile || bulkUploading}>
                {bulkUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Import Fabrics
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Fabric Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingFabric(null) }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fabric{editingFabric ? ` — ${editingFabric.color}` : ''}</DialogTitle>
            <DialogDescription>Update the details for this fabric.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-5">
            {/* Row 1: Identity */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Product *</Label>
                <Select value={editForm.category} onValueChange={v => setEditForm({ ...editForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {productOptions.map(p => <SelectItem key={p._id} value={p.name}>{p.name}</SelectItem>)}
                    {!productOptions.some(p => p.name === editForm.category) && editForm.category && (
                      <SelectItem value={editForm.category}>{editForm.category}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Openness *</Label>
                {(() => {
                  const sel = productOptions.find(p => p.name === editForm.category)
                  const cats = sel?.categories ?? []
                  return cats.length > 0 ? (
                    <Select value={editForm.subcategory} onValueChange={v => setEditForm({ ...editForm, subcategory: v })}>
                      <SelectTrigger><SelectValue placeholder="Select openness" /></SelectTrigger>
                      <SelectContent>
                        {cats.map(c => <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>)}
                        {!cats.some(c => c.name === editForm.subcategory) && editForm.subcategory && (
                          <SelectItem value={editForm.subcategory}>{editForm.subcategory}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={editForm.subcategory} onChange={e => setEditForm({ ...editForm, subcategory: e.target.value })} placeholder="e.g., 1%, Light Filtering" />
                  )
                })()}
              </div>
              <div className="space-y-2">
                <Label>Color Name *</Label>
                <Input value={editForm.color} onChange={e => setEditForm({ ...editForm, color: e.target.value })} placeholder="e.g., White, Sunrise" />
              </div>
            </div>

            {/* Row 2: Collection + Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Collection</Label>
                <Input value={editForm.collection} onChange={e => setEditForm({ ...editForm, collection: e.target.value })} placeholder="e.g., Infra, Salvus" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Pricing Chart</Label>
                <Select value={editForm.pricingCollectionId} onValueChange={v => setEditForm({ ...editForm, pricingCollectionId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select pricing chart" /></SelectTrigger>
                  <SelectContent>{QUOTE_COLLECTIONS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Availability */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 p-4 space-y-3">
              <Label className="text-sm font-medium">Availability</Label>
              <StockStatusSelector
                value={editForm.stockStatus}
                onChange={v => setEditForm({ ...editForm, stockStatus: v, expectedArrival: v !== 'back_order' ? '' : editForm.expectedArrival })}
              />
              {editForm.stockStatus === 'back_order' && (
                <div className="grid grid-cols-3 gap-4 pt-1">
                  <div className="space-y-2">
                    <Label className="text-xs text-amber-700 dark:text-amber-400 font-medium">Expected Arrival Date</Label>
                    <Input
                      type="date"
                      value={editForm.expectedArrival}
                      onChange={e => setEditForm({ ...editForm, expectedArrival: e.target.value })}
                      className="border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs text-muted-foreground">Rolls Available</Label>
                    <Input type="number" min="0" value={editForm.rollsAvailable} onChange={e => setEditForm({ ...editForm, rollsAvailable: e.target.value })} placeholder="0" />
                  </div>
                </div>
              )}
              {editForm.stockStatus === 'in_stock' && (
                <div className="grid grid-cols-3 gap-4 pt-1">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Rolls Available</Label>
                    <Input type="number" min="0" value={editForm.rollsAvailable} onChange={e => setEditForm({ ...editForm, rollsAvailable: e.target.value })} placeholder="0" />
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Specs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Opacity</Label>
                <Input value={editForm.opacity} onChange={e => setEditForm({ ...editForm, opacity: e.target.value })} placeholder="e.g., 10%, 5%" />
              </div>
              <div className="space-y-2">
                <Label>Roll Width</Label>
                <Input value={editForm.width} onChange={e => setEditForm({ ...editForm, width: e.target.value })} placeholder='e.g., 126"' />
              </div>
              <div className="space-y-2">
                <Label>Roll Length</Label>
                <Input value={editForm.rollLength} onChange={e => setEditForm({ ...editForm, rollLength: e.target.value })} placeholder="e.g., 22 yd/roll" />
              </div>
              <div className="space-y-2">
                <Label>Min Width</Label>
                <Input value={editForm.minWidth} onChange={e => setEditForm({ ...editForm, minWidth: e.target.value })} placeholder='e.g., 24"' />
              </div>
              <div className="space-y-2">
                <Label>Max Width</Label>
                <Input value={editForm.maxWidth} onChange={e => setEditForm({ ...editForm, maxWidth: e.target.value })} placeholder='e.g., 126"' />
              </div>
              {editForm.category === 'Duo Shades' && (
                <div className="space-y-2">
                  <Label>Fabric Width (in)</Label>
                  <Input type="number" min={0} step={0.25} value={editForm.fabricWidth} onChange={e => setEditForm({ ...editForm, fabricWidth: e.target.value })} placeholder="e.g., 2.5" />
                  <p className="text-xs text-muted-foreground">Under 3&quot; disables fabric wrap.</p>
                </div>
              )}
            </div>

            {/* Row 5: Image */}
            <div className="space-y-2">
              <Label>Fabric Image</Label>
              <div className="flex gap-4 items-center flex-wrap">
                <Label htmlFor="edit-fabric-upload" className="cursor-pointer border rounded-md px-3 py-2 text-sm font-medium hover:bg-muted flex items-center gap-2 shrink-0">
                  <Upload className="h-4 w-4" />
                  {editUploading ? 'Uploading…' : 'Upload new image'}
                </Label>
                <input id="edit-fabric-upload" type="file" accept="image/*" className="hidden" disabled={editUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file || !token) return
                    setEditUploading(true); e.target.value = ''
                    try {
                      const form = new FormData(); form.append('file', file)
                      const res = await fetch('/api/fabric-gallery/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
                      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Upload failed') }
                      const { url, publicId } = await res.json()
                      setEditForm(prev => ({ ...prev, imageUrl: url, cloudinaryPublicId: publicId ?? '' }))
                    } catch (err) { alert(err instanceof Error ? err.message : 'Upload failed') }
                    finally { setEditUploading(false) }
                  }}
                />
                {editForm.imageUrl && (
                  <div className="relative w-20 h-20 shrink-0 border rounded overflow-hidden bg-muted">
                    <Image src={editForm.imageUrl} alt="Preview" fill className="object-contain" unoptimized />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingFabric(null) }}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
