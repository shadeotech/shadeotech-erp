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
import { Search, X, Plus, Trash2, Loader2, Upload, Pencil, ChevronLeft, ChevronRight, Layers, Palette, Grid3X3 } from 'lucide-react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import type { Fabric } from '@/types/fabric'
import { QUOTE_COLLECTIONS } from '@/lib/quoteConstants'
import { getFabricImageUrl } from '@/constants/fabrics'

const FABRIC_CATEGORIES = [
  'Duo Shades', 'Roller Shades', 'Tri Shades', 'Uni Shades', 'Roman Shades',
  'Exterior - Zip Track', 'Exterior - Wire Guide', 'Exterior - Free Hang',
]

const FABRIC_SUBCATEGORIES = [
  'Light Filtering', 'Room Dimming', 'Blackout',
  '0%', '80%', '85%', '90%', '95%', '99%',
]

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
}

export default function FabricGalleryPage() {
  const { user, token } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
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

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [selectedCollection, setSelectedCollection] = useState('all')
  const [page, setPage] = useState(1)
  const [PAGE_SIZE, setPageSize] = useState(24)

  const fetchFabrics = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      setLoading(true)
      const res = await fetch('/api/fabric-gallery', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch fabrics')
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
      })))
    } catch (err) {
      console.error(err)
      setFabrics([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchFabrics() }, [fetchFabrics])

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

  const hasFilters = selectedCategory !== 'all' || selectedSubcategory !== 'all' || selectedCollection !== 'all' || !!searchTerm

  const allCollections = useMemo(() => Array.from(new Set(fabrics.map(f => f.collection).filter(Boolean))), [fabrics])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Fabric Gallery</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your fabric catalogue by product type and collection</p>
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
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Fabric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Fabric</DialogTitle>
                <DialogDescription>Fill in the required fields (Category, Subcategory, Color).</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={newFabric.category} onValueChange={v => setNewFabric({ ...newFabric, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {FABRIC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcategory */}
                  <div className="space-y-2">
                    <Label>Subcategory *</Label>
                    <Select value={newFabric.subcategory} onValueChange={v => setNewFabric({ ...newFabric, subcategory: v })}>
                      <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                      <SelectContent>
                        {FABRIC_SUBCATEGORIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <Label>Color Name *</Label>
                    <Input
                      value={newFabric.color}
                      onChange={e => setNewFabric({ ...newFabric, color: e.target.value })}
                      placeholder="e.g., White, Sunrise, Sand"
                    />
                  </div>

                  {/* Collection */}
                  <div className="space-y-2">
                    <Label>Collection</Label>
                    <Input
                      value={newFabric.collection}
                      onChange={e => setNewFabric({ ...newFabric, collection: e.target.value })}
                      placeholder="e.g., Infra, Salvus, Geneva"
                    />
                  </div>

                  {/* Pricing Collection */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Pricing Chart</Label>
                    <Select value={newFabric.pricingCollectionId} onValueChange={v => setNewFabric({ ...newFabric, pricingCollectionId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select pricing chart (required for quotes)" /></SelectTrigger>
                      <SelectContent>
                        {QUOTE_COLLECTIONS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Determines which pricing table is used when this fabric is added to a quote.</p>
                  </div>

                  {/* Opacity */}
                  <div className="space-y-2">
                    <Label>Opacity</Label>
                    <Input
                      value={newFabric.opacity}
                      onChange={e => setNewFabric({ ...newFabric, opacity: e.target.value })}
                      placeholder="e.g., 10%, 5%"
                    />
                  </div>

                  {/* Width */}
                  <div className="space-y-2">
                    <Label>Roll Width</Label>
                    <Input
                      value={newFabric.width}
                      onChange={e => setNewFabric({ ...newFabric, width: e.target.value })}
                      placeholder='e.g., 126"'
                    />
                  </div>

                  {/* Min Width */}
                  <div className="space-y-2">
                    <Label>Min Width</Label>
                    <Input
                      value={newFabric.minWidth}
                      onChange={e => setNewFabric({ ...newFabric, minWidth: e.target.value })}
                      placeholder='e.g., 24"'
                    />
                  </div>

                  {/* Max Width */}
                  <div className="space-y-2">
                    <Label>Max Width</Label>
                    <Input
                      value={newFabric.maxWidth}
                      onChange={e => setNewFabric({ ...newFabric, maxWidth: e.target.value })}
                      placeholder='e.g., 126"'
                    />
                  </div>

                  {/* Roll Length */}
                  <div className="space-y-2">
                    <Label>Roll Length</Label>
                    <Input
                      value={newFabric.rollLength}
                      onChange={e => setNewFabric({ ...newFabric, rollLength: e.target.value })}
                      placeholder="e.g., 22 yd/roll"
                    />
                  </div>
                </div>

                {/* Image: upload (saved to Cloudinary and shown from DB/Cloudinary) */}
                <div className="space-y-2">
                  <Label>Fabric Image</Label>
                  <div className="flex gap-4 items-start flex-wrap">
                    <Label htmlFor="fabric-upload" className="cursor-pointer border rounded-md px-3 py-2 text-sm font-medium hover:bg-muted flex items-center gap-2 shrink-0">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading…' : 'Upload image'}
                    </Label>
                    <input
                      id="fabric-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !token) return
                        setUploading(true)
                        e.target.value = ''
                        try {
                          const form = new FormData()
                          form.append('file', file)
                          const res = await fetch('/api/fabric-gallery/upload', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: form,
                          })
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}))
                            throw new Error(data.error || 'Upload failed')
                          }
                          const { url, publicId } = await res.json()
                          setNewFabric((prev) => ({ ...prev, imageUrl: url, cloudinaryPublicId: publicId ?? '' }))
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Upload failed')
                        } finally {
                          setUploading(false)
                        }
                      }}
                    />
                    {newFabric.imageUrl && (
                      <div className="relative w-24 h-24 shrink-0 border rounded overflow-hidden bg-muted">
                        <Image
                          src={newFabric.imageUrl}
                          alt="Preview"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Upload an image for this fabric.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddDialogOpen(false); setNewFabric(EMPTY_NEW_FABRIC) }}>
                  Cancel
                </Button>
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
            {fabrics.length === 0
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

      {/* Edit Fabric Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingFabric(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fabric</DialogTitle>
            <DialogDescription>Update the details for this fabric.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={editForm.category} onValueChange={v => setEditForm({ ...editForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {FABRIC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              <div className="space-y-2">
                <Label>Subcategory *</Label>
                <Select value={editForm.subcategory} onValueChange={v => setEditForm({ ...editForm, subcategory: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {FABRIC_SUBCATEGORIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Color Name *</Label>
                <Input value={editForm.color} onChange={e => setEditForm({ ...editForm, color: e.target.value })} placeholder="e.g., White, Sunrise, Sand" />
              </div>

              {/* Collection */}
              <div className="space-y-2">
                <Label>Collection</Label>
                <Input value={editForm.collection} onChange={e => setEditForm({ ...editForm, collection: e.target.value })} placeholder="e.g., Infra, Salvus, Geneva" />
              </div>

              {/* Pricing Collection */}
              <div className="space-y-2 md:col-span-2">
                <Label>Pricing Chart</Label>
                <Select value={editForm.pricingCollectionId} onValueChange={v => setEditForm({ ...editForm, pricingCollectionId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select pricing chart" /></SelectTrigger>
                  <SelectContent>
                    {QUOTE_COLLECTIONS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Opacity */}
              <div className="space-y-2">
                <Label>Opacity</Label>
                <Input value={editForm.opacity} onChange={e => setEditForm({ ...editForm, opacity: e.target.value })} placeholder="e.g., 10%, 5%" />
              </div>

              {/* Roll Width */}
              <div className="space-y-2">
                <Label>Roll Width</Label>
                <Input value={editForm.width} onChange={e => setEditForm({ ...editForm, width: e.target.value })} placeholder='e.g., 126"' />
              </div>

              {/* Min Width */}
              <div className="space-y-2">
                <Label>Min Width</Label>
                <Input value={editForm.minWidth} onChange={e => setEditForm({ ...editForm, minWidth: e.target.value })} placeholder='e.g., 24"' />
              </div>

              {/* Max Width */}
              <div className="space-y-2">
                <Label>Max Width</Label>
                <Input value={editForm.maxWidth} onChange={e => setEditForm({ ...editForm, maxWidth: e.target.value })} placeholder='e.g., 126"' />
              </div>

              {/* Roll Length */}
              <div className="space-y-2">
                <Label>Roll Length</Label>
                <Input value={editForm.rollLength} onChange={e => setEditForm({ ...editForm, rollLength: e.target.value })} placeholder="e.g., 22 yd/roll" />
              </div>

              {/* Fabric Width — Duo Shades only */}
              {editForm.category === 'Duo Shades' && (
                <div className="space-y-2">
                  <Label>Fabric Width (inches)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.25}
                    value={editForm.fabricWidth}
                    onChange={e => setEditForm({ ...editForm, fabricWidth: e.target.value })}
                    placeholder="e.g., 2.5"
                  />
                  <p className="text-xs text-muted-foreground">If less than 3&quot;, fabric wrap will be disabled in quotes.</p>
                </div>
              )}
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Fabric Image</Label>
              <div className="flex gap-4 items-start flex-wrap">
                <Label htmlFor="edit-fabric-upload" className="cursor-pointer border rounded-md px-3 py-2 text-sm font-medium hover:bg-muted flex items-center gap-2 shrink-0">
                  <Upload className="h-4 w-4" />
                  {editUploading ? 'Uploading…' : 'Upload new image'}
                </Label>
                <input
                  id="edit-fabric-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={editUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !token) return
                    setEditUploading(true)
                    e.target.value = ''
                    try {
                      const form = new FormData()
                      form.append('file', file)
                      const res = await fetch('/api/fabric-gallery/upload', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: form,
                      })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.error || 'Upload failed')
                      }
                      const { url, publicId } = await res.json()
                      setEditForm((prev) => ({ ...prev, imageUrl: url, cloudinaryPublicId: publicId ?? '' }))
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setEditUploading(false)
                    }
                  }}
                />
                {editForm.imageUrl && (
                  <div className="relative w-24 h-24 shrink-0 border rounded overflow-hidden bg-muted">
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
