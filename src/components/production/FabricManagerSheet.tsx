'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Upload,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { QUOTE_COLLECTIONS } from '@/lib/quoteConstants'

interface FabricEntry {
  id: string
  color: string
  pricingCollectionId?: string
  imageUrl?: string
  opacity?: string
  width?: string
  minWidth?: string
  maxWidth?: string
  rollLength?: string
  fabricWidth?: number | null
  inStock?: boolean
  rollsAvailable?: number
}

interface FabricForm {
  color: string
  pricingCollectionId: string
  imageUrl: string
  cloudinaryPublicId: string
  opacity: string
  width: string
  minWidth: string
  maxWidth: string
  rollLength: string
  fabricWidth: string
  inStock: boolean
  rollsAvailable: string
}

const EMPTY_FORM: FabricForm = {
  color: '',
  pricingCollectionId: '',
  imageUrl: '',
  cloudinaryPublicId: '',
  opacity: '',
  width: '',
  minWidth: '',
  maxWidth: '',
  rollLength: '',
  fabricWidth: '',
  inStock: true,
  rollsAvailable: '0',
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  productName: string
  catName: string
  colName: string
  token: string | null
}

function FabricCard({
  fabric,
  onEdit,
  onDelete,
}: {
  fabric: FabricEntry
  onEdit: (f: FabricEntry) => void
  onDelete: (f: FabricEntry) => void
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="rounded-lg border bg-white dark:bg-[#111] overflow-hidden group">
      <div className="relative aspect-square bg-muted">
        {fabric.imageUrl && !imgError ? (
          <Image
            src={fabric.imageUrl}
            alt={fabric.color}
            fill
            className="object-contain"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onEdit(fabric)}
            className="bg-white text-gray-800 rounded-md p-1.5 hover:bg-gray-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(fabric)}
            className="bg-red-500 text-white rounded-md p-1.5 hover:bg-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-2.5 space-y-1">
        <p className="text-sm font-medium leading-tight truncate">{fabric.color}</p>
        <div className="flex flex-wrap gap-1">
          {fabric.inStock === false ? (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Out of Stock</Badge>
          ) : (fabric.rollsAvailable ?? 0) > 0 ? (
            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">{fabric.rollsAvailable} rolls</Badge>
          ) : (
            <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">In Stock</Badge>
          )}
        </div>
        {fabric.pricingCollectionId && (
          <p className="text-[10px] text-muted-foreground font-mono truncate">{fabric.pricingCollectionId}</p>
        )}
      </div>
    </div>
  )
}

export function FabricManagerSheet({ open, onOpenChange, productName, catName, colName, token }: Props) {
  const [fabrics, setFabrics] = useState<FabricEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Add / Edit dialog
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FabricForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const fetchFabrics = useCallback(async () => {
    if (!token || !productName || !catName) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ category: productName, subcategory: catName })
      if (colName) params.set('collection', colName)
      const res = await fetch(`/api/fabric-gallery?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setFabrics(data.fabrics || [])
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [token, productName, catName, colName])

  useEffect(() => {
    if (open) {
      fetchFabrics()
      setSearch('')
    }
  }, [open, fetchFabrics])

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowAdvanced(false)
    setFormOpen(true)
  }

  function openEdit(fabric: FabricEntry) {
    setEditingId(fabric.id)
    setForm({
      color: fabric.color,
      pricingCollectionId: fabric.pricingCollectionId ?? '',
      imageUrl: fabric.imageUrl ?? '',
      cloudinaryPublicId: '',
      opacity: fabric.opacity ?? '',
      width: fabric.width ?? '',
      minWidth: fabric.minWidth ?? '',
      maxWidth: fabric.maxWidth ?? '',
      rollLength: fabric.rollLength ?? '',
      fabricWidth: fabric.fabricWidth != null ? String(fabric.fabricWidth) : '',
      inStock: fabric.inStock ?? true,
      rollsAvailable: String(fabric.rollsAvailable ?? 0),
    })
    setShowAdvanced(false)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.color.trim()) return
    setSaving(true)
    try {
      const payload = {
        color: form.color.trim(),
        category: productName,
        subcategory: catName,
        collection: colName || undefined,
        pricingCollectionId: form.pricingCollectionId || undefined,
        imageUrl: form.imageUrl || undefined,
        cloudinaryPublicId: form.cloudinaryPublicId || undefined,
        opacity: form.opacity || undefined,
        width: form.width || undefined,
        minWidth: form.minWidth || undefined,
        maxWidth: form.maxWidth || undefined,
        rollLength: form.rollLength || undefined,
        fabricWidth: form.fabricWidth !== '' ? Number(form.fabricWidth) : null,
        inStock: form.inStock,
        rollsAvailable: Number(form.rollsAvailable) || 0,
      }

      if (editingId) {
        await fetch(`/api/fabric-gallery/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/fabric-gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
      }
      setFormOpen(false)
      await fetchFabrics()
    } catch {
      alert('Failed to save fabric')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(fabric: FabricEntry) {
    if (!confirm(`Delete "${fabric.color}"?`)) return
    try {
      await fetch(`/api/fabric-gallery/${fabric.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setFabrics((prev) => prev.filter((f) => f.id !== fabric.id))
    } catch {
      alert('Failed to delete fabric')
    }
  }

  async function handleUpload(file: File) {
    if (!token) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/fabric-gallery/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      const { url, publicId } = await res.json()
      setForm((prev) => ({ ...prev, imageUrl: url, cloudinaryPublicId: publicId ?? '' }))
    } catch (e: any) {
      alert(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const filtered = fabrics.filter((f) => {
    if (!search) return true
    return f.color.toLowerCase().includes(search.toLowerCase())
  })

  const outOfStock = fabrics.filter((f) => f.inStock === false).length
  const inStock = fabrics.length - outOfStock

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle className="text-left">
              <span className="text-muted-foreground font-normal text-sm">{productName}</span>
              <span className="text-muted-foreground font-normal text-sm mx-1.5">›</span>
              <span className="text-muted-foreground font-normal text-sm">{catName}</span>
              {colName && (
                <>
                  <span className="text-muted-foreground font-normal text-sm mx-1.5">›</span>
                  <span className="text-sm">{colName}</span>
                </>
              )}
            </SheetTitle>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {fabrics.length} fabric{fabrics.length !== 1 ? 's' : ''}
                </span>
                {fabrics.length > 0 && (
                  <>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{inStock} in stock</span>
                    {outOfStock > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{outOfStock} out of stock</span>}
                  </>
                )}
              </div>
              <Button size="sm" onClick={openAdd} className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Fabric Color
              </Button>
            </div>
            {fabrics.length > 0 && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search colors…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {fabrics.length === 0 ? 'No fabric colors yet' : 'No colors match your search'}
                </p>
                {fabrics.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Fabric Color" to add the first one</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filtered.map((fabric) => (
                  <FabricCard
                    key={fabric.id}
                    fabric={fabric}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Fabric Color' : 'Add Fabric Color'}</DialogTitle>
            {!editingId && (
              <p className="text-xs text-muted-foreground mt-1">
                {productName} › {catName}{colName ? ` › ${colName}` : ''}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Color name */}
            <div className="space-y-1.5">
              <Label>Color Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="e.g., White, Sandstone, Charcoal"
                autoFocus
              />
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>In Stock</Label>
                <div className="flex items-center gap-2.5 pt-1">
                  <Switch
                    checked={form.inStock}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, inStock: v }))}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <span className="text-sm text-muted-foreground">{form.inStock ? 'In Stock' : 'Out of Stock'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Rolls Available</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.rollsAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, rollsAvailable: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Pricing chart */}
            <div className="space-y-1.5">
              <Label>Pricing Chart</Label>
              <Select
                value={form.pricingCollectionId}
                onValueChange={(v) => setForm((f) => ({ ...f, pricingCollectionId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing chart" />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_COLLECTIONS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Determines which pricing table is used in quotes.</p>
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label>Fabric Image</Label>
              <div className="flex items-center gap-3">
                <Label
                  htmlFor="sheet-fabric-upload"
                  className="cursor-pointer border rounded-md px-3 py-2 text-sm font-medium hover:bg-muted flex items-center gap-2 shrink-0"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Upload'}
                </Label>
                <input
                  id="sheet-fabric-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) { e.target.value = ''; handleUpload(file) }
                  }}
                />
                {form.imageUrl && (
                  <div className="relative w-14 h-14 shrink-0 border rounded overflow-hidden bg-muted">
                    <Image src={form.imageUrl} alt="Preview" fill className="object-contain" unoptimized />
                  </div>
                )}
                {form.imageUrl && (
                  <button
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '', cloudinaryPublicId: '' }))}
                    className="text-xs text-muted-foreground hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Advanced fields toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showAdvanced ? 'Hide' : 'Show'} advanced fields (opacity, widths, roll length)
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Opacity</Label>
                  <Input
                    value={form.opacity}
                    onChange={(e) => setForm((f) => ({ ...f, opacity: e.target.value }))}
                    placeholder="e.g., 10%"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Roll Width</Label>
                  <Input
                    value={form.width}
                    onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))}
                    placeholder='e.g., 126"'
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Min Width</Label>
                  <Input
                    value={form.minWidth}
                    onChange={(e) => setForm((f) => ({ ...f, minWidth: e.target.value }))}
                    placeholder='e.g., 24"'
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Width</Label>
                  <Input
                    value={form.maxWidth}
                    onChange={(e) => setForm((f) => ({ ...f, maxWidth: e.target.value }))}
                    placeholder='e.g., 144"'
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Roll Length</Label>
                  <Input
                    value={form.rollLength}
                    onChange={(e) => setForm((f) => ({ ...f, rollLength: e.target.value }))}
                    placeholder="e.g., 22 yd/roll"
                    className="h-8 text-sm"
                  />
                </div>
                {productName === 'Duo Shades' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fabric Width (in)</Label>
                    <Input
                      type="number"
                      value={form.fabricWidth}
                      onChange={(e) => setForm((f) => ({ ...f, fabricWidth: e.target.value }))}
                      placeholder="e.g., 3.5"
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.color.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Save Changes' : 'Add Fabric Color'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
