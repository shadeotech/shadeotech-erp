'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FabricManagerSheet } from '@/components/production/FabricManagerSheet'
import {
  Package,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Layers,
  Tag,
  ImageIcon,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react'
import Link from 'next/link'

interface CollectionData {
  _id: string
  name: string
  sortOrder: number
}

interface CategoryData {
  _id: string
  name: string
  visibleInQuote: boolean
  sortOrder: number
  collections: CollectionData[]
}

interface ProductData {
  _id: string
  name: string
  type: 'interior' | 'exterior'
  visibleInQuote: boolean
  sortOrder: number
  fabricCount: number
  categories: CategoryData[]
}

interface OpenCollection {
  productName: string
  catName: string
  colName: string
}

export default function ProductsPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()

  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)

  // Expand state: product IDs expanded, category keys (productId:catId) expanded
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  // Fabric manager sheet
  const [openCollection, setOpenCollection] = useState<OpenCollection | null>(null)

  // Add product dialog
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'interior' | 'exterior'>('interior')
  const [adding, setAdding] = useState(false)

  // Inline product name edit
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editProductName, setEditProductName] = useState('')
  const [savingProductName, setSavingProductName] = useState(false)

  // Inline category add (per product)
  const [addCatProductId, setAddCatProductId] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  // Inline category rename
  const [editingCatKey, setEditingCatKey] = useState<string | null>(null) // "productId:catId"
  const [editCatName, setEditCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  // Inline collection add (per category)
  const [addColKey, setAddColKey] = useState<string | null>(null) // "productId:catId"
  const [newColName, setNewColName] = useState('')
  const [addingCol, setAddingCol] = useState(false)

  const fetchProducts = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/production/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch {
      toast({ title: 'Error loading products', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [token]) // eslint-disable-line

  const callApi = async (method: string, body?: object) => {
    const res = await fetch('/api/production/products', {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Request failed')
    }
    return res.json()
  }

  // ── Add product ──
  async function handleAddProduct() {
    if (!newName.trim()) return
    setAdding(true)
    try {
      await callApi('POST', { name: newName.trim(), type: newType })
      await fetchProducts()
      setAddOpen(false)
      setNewName('')
      setNewType('interior')
      toast({ title: 'Product added' })
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  // ── Delete product ──
  async function handleDeleteProduct(productId: string, name: string) {
    if (!confirm(`Delete product "${name}" and all its openness options and collections? This does not delete linked fabrics.`)) return
    try {
      const res = await fetch(`/api/production/products?productId=${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      setProducts((prev) => prev.filter((p) => p._id !== productId))
      toast({ title: 'Product deleted' })
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    }
  }

  // ── Rename product ──
  async function handleSaveProductName(productId: string) {
    if (!editProductName.trim()) return
    setSavingProductName(true)
    try {
      const { product } = await callApi('PUT', { action: 'rename', productId, name: editProductName.trim() })
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, name: product.name } : p)))
      setEditingProductId(null)
      toast({ title: 'Product renamed' })
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setSavingProductName(false)
    }
  }

  // ── Toggle product visibility ──
  async function handleToggleProduct(productId: string, current: boolean) {
    try {
      await callApi('PUT', { action: 'toggleVisibility', productId, visibleInQuote: !current })
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, visibleInQuote: !current } : p)))
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    }
  }

  // ── Add category ──
  async function handleAddCategory(productId: string) {
    if (!newCatName.trim()) return
    setAddingCat(true)
    try {
      const { product } = await callApi('PUT', { action: 'addCategory', productId, name: newCatName.trim() })
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, categories: product.categories } : p)))
      setAddCatProductId(null)
      setNewCatName('')
      toast({ title: 'Openness option added' })
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setAddingCat(false)
    }
  }

  // ── Delete category ──
  async function handleDeleteCategory(productId: string, catId: string, catName: string) {
    if (!confirm(`Delete openness option "${catName}"?`)) return
    try {
      const { product } = await callApi('PUT', { action: 'deleteCategory', productId, catId })
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, categories: product.categories } : p)))
      toast({ title: 'Openness option deleted' })
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    }
  }

  // ── Rename category ──
  async function handleSaveCategoryName(productId: string, catId: string) {
    if (!editCatName.trim()) return
    setSavingCat(true)
    try {
      const { product } = await callApi('PUT', { action: 'renameCategory', productId, catId, name: editCatName.trim() })
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, categories: product.categories } : p)))
      setEditingCatKey(null)
      toast({ title: 'Openness option renamed' })
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setSavingCat(false)
    }
  }

  // ── Toggle category visibility ──
  async function handleToggleCategory(productId: string, catId: string, current: boolean) {
    try {
      const { product } = await callApi('PUT', { action: 'toggleCategoryVisibility', productId, catId, visibleInQuote: !current })
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, categories: product.categories } : p)))
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    }
  }

  // ── Add collection ──
  async function handleAddCollection(productId: string, catId: string) {
    if (!newColName.trim()) return
    setAddingCol(true)
    try {
      const { product } = await callApi('PUT', { action: 'addCollection', productId, catId, name: newColName.trim() })
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, categories: product.categories } : p)))
      setAddColKey(null)
      setNewColName('')
      toast({ title: 'Collection added' })
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setAddingCol(false)
    }
  }

  // ── Delete collection ──
  async function handleDeleteCollection(productId: string, catId: string, colId: string) {
    try {
      const { product } = await callApi('PUT', { action: 'deleteCollection', productId, catId, colId })
      setProducts((prev) => prev.map((p) => (p._id === productId ? { ...p, categories: product.categories } : p)))
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    }
  }

  const interior = products.filter((p) => p.type === 'interior')
  const exterior = products.filter((p) => p.type === 'exterior')
  const totalFabrics = products.reduce((s, p) => s + p.fabricCount, 0)

  const toggleProduct = (id: string) =>
    setExpandedProducts((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleCat = (key: string) =>
    setExpandedCats((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your product catalog — products, openness options, and collections. This drives the Quote Builder dropdown.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/fabric-gallery">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Fabric Gallery
            </Button>
          </Link>
          <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{interior.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Interior Products</div>
          </div>
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{exterior.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Exterior Products</div>
          </div>
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 text-center">
            <div className="text-2xl font-bold">{totalFabrics}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Fabrics</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border bg-white dark:bg-[#111] py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No products yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Product" to create your first product.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Interior */}
          {interior.length > 0 && (
            <ProductGroup
              title="Interior Products"
              color="amber"
              products={interior}
              expandedProducts={expandedProducts}
              expandedCats={expandedCats}
              editingProductId={editingProductId}
              editProductName={editProductName}
              savingProductName={savingProductName}
              addCatProductId={addCatProductId}
              newCatName={newCatName}
              addingCat={addingCat}
              editingCatKey={editingCatKey}
              editCatName={editCatName}
              savingCat={savingCat}
              addColKey={addColKey}
              newColName={newColName}
              addingCol={addingCol}
              onToggleProduct={toggleProduct}
              onToggleCat={toggleCat}
              onStartEditProduct={(p) => { setEditingProductId(p._id); setEditProductName(p.name) }}
              onCancelEditProduct={() => setEditingProductId(null)}
              onChangeProductName={setEditProductName}
              onSaveProductName={handleSaveProductName}
              onDeleteProduct={handleDeleteProduct}
              onToggleProductVisibility={handleToggleProduct}
              onStartAddCat={(pid) => { setAddCatProductId(pid); setNewCatName('') }}
              onCancelAddCat={() => setAddCatProductId(null)}
              onChangeCatName={setNewCatName}
              onAddCategory={handleAddCategory}
              onStartEditCat={(key, name) => { setEditingCatKey(key); setEditCatName(name) }}
              onCancelEditCat={() => setEditingCatKey(null)}
              onChangeEditCatName={setEditCatName}
              onSaveCatName={handleSaveCategoryName}
              onDeleteCategory={handleDeleteCategory}
              onToggleCategoryVisibility={handleToggleCategory}
              onStartAddCol={(key) => { setAddColKey(key); setNewColName('') }}
              onCancelAddCol={() => setAddColKey(null)}
              onChangeColName={setNewColName}
              onAddCollection={handleAddCollection}
              onDeleteCollection={handleDeleteCollection}
              onOpenCollection={(pn, cn, coln) => setOpenCollection({ productName: pn, catName: cn, colName: coln })}
            />
          )}

          {/* Exterior */}
          {exterior.length > 0 && (
            <ProductGroup
              title="Exterior Products"
              color="blue"
              products={exterior}
              expandedProducts={expandedProducts}
              expandedCats={expandedCats}
              editingProductId={editingProductId}
              editProductName={editProductName}
              savingProductName={savingProductName}
              addCatProductId={addCatProductId}
              newCatName={newCatName}
              addingCat={addingCat}
              editingCatKey={editingCatKey}
              editCatName={editCatName}
              savingCat={savingCat}
              addColKey={addColKey}
              newColName={newColName}
              addingCol={addingCol}
              onToggleProduct={toggleProduct}
              onToggleCat={toggleCat}
              onStartEditProduct={(p) => { setEditingProductId(p._id); setEditProductName(p.name) }}
              onCancelEditProduct={() => setEditingProductId(null)}
              onChangeProductName={setEditProductName}
              onSaveProductName={handleSaveProductName}
              onDeleteProduct={handleDeleteProduct}
              onToggleProductVisibility={handleToggleProduct}
              onStartAddCat={(pid) => { setAddCatProductId(pid); setNewCatName('') }}
              onCancelAddCat={() => setAddCatProductId(null)}
              onChangeCatName={setNewCatName}
              onAddCategory={handleAddCategory}
              onStartEditCat={(key, name) => { setEditingCatKey(key); setEditCatName(name) }}
              onCancelEditCat={() => setEditingCatKey(null)}
              onChangeEditCatName={setEditCatName}
              onSaveCatName={handleSaveCategoryName}
              onDeleteCategory={handleDeleteCategory}
              onToggleCategoryVisibility={handleToggleCategory}
              onStartAddCol={(key) => { setAddColKey(key); setNewColName('') }}
              onCancelAddCol={() => setAddColKey(null)}
              onChangeColName={setNewColName}
              onAddCollection={handleAddCollection}
              onDeleteCollection={handleDeleteCollection}
              onOpenCollection={(pn, cn, coln) => setOpenCollection({ productName: pn, catName: cn, colName: coln })}
            />
          )}

          {/* Info note */}
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How the Product hub works</p>
            <ul className="list-disc pl-4 space-y-0.5 text-xs mt-2">
              <li>Products appear in the Quote Builder dropdown (use the visibility toggle to show/hide)</li>
              <li><strong>Openness Options</strong> = the subcategory step in the quote (e.g. "1%", "3%", "Light Filtering")</li>
              <li><strong>Collections</strong> = fabric collection grouping within each openness option</li>
              <li>Go to <strong>Fabric Gallery</strong> to add individual fabric colors for each product</li>
              <li>Exterior products should be named with the prefix <code className="bg-muted px-1 rounded">Exterior -</code></li>
            </ul>
          </div>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Roller Shades"
                onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as 'interior' | 'exterior')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddProduct} disabled={adding || !newName.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fabric Manager Sheet */}
      <FabricManagerSheet
        open={!!openCollection}
        onOpenChange={(v) => { if (!v) setOpenCollection(null) }}
        productName={openCollection?.productName ?? ''}
        catName={openCollection?.catName ?? ''}
        colName={openCollection?.colName ?? ''}
        token={token}
      />
    </div>
  )
}

// ── ProductGroup ─────────────────────────────────────────────────────────────

interface ProductGroupProps {
  title: string
  color: 'amber' | 'blue'
  products: ProductData[]
  expandedProducts: Set<string>
  expandedCats: Set<string>
  editingProductId: string | null
  editProductName: string
  savingProductName: boolean
  addCatProductId: string | null
  newCatName: string
  addingCat: boolean
  editingCatKey: string | null
  editCatName: string
  savingCat: boolean
  addColKey: string | null
  newColName: string
  addingCol: boolean
  onToggleProduct: (id: string) => void
  onToggleCat: (key: string) => void
  onStartEditProduct: (p: ProductData) => void
  onCancelEditProduct: () => void
  onChangeProductName: (v: string) => void
  onSaveProductName: (id: string) => void
  onDeleteProduct: (id: string, name: string) => void
  onToggleProductVisibility: (id: string, current: boolean) => void
  onStartAddCat: (pid: string) => void
  onCancelAddCat: () => void
  onChangeCatName: (v: string) => void
  onAddCategory: (pid: string) => void
  onStartEditCat: (key: string, name: string) => void
  onCancelEditCat: () => void
  onChangeEditCatName: (v: string) => void
  onSaveCatName: (pid: string, catId: string) => void
  onDeleteCategory: (pid: string, catId: string, name: string) => void
  onToggleCategoryVisibility: (pid: string, catId: string, current: boolean) => void
  onStartAddCol: (key: string) => void
  onCancelAddCol: () => void
  onChangeColName: (v: string) => void
  onAddCollection: (pid: string, catId: string) => void
  onDeleteCollection: (pid: string, catId: string, colId: string) => void
  onOpenCollection: (productName: string, catName: string, colName: string) => void
}

function ProductGroup({ title, color, products, ...props }: ProductGroupProps) {
  const iconColor = color === 'amber' ? 'text-amber-500' : 'text-blue-500'
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 pb-1 border-b">
        <Layers className={`h-4 w-4 ${iconColor}`} />
        <h2 className="text-sm font-semibold">{title}</h2>
        <Badge variant="outline" className="text-xs">{products.length}</Badge>
      </div>
      <div className="rounded-xl border overflow-hidden divide-y bg-white dark:bg-[#111]">
        {products.map((product) => (
          <ProductRow key={product._id} product={product} color={color} {...props} />
        ))}
      </div>
    </div>
  )
}

// ── ProductRow ───────────────────────────────────────────────────────────────

function ProductRow({
  product, color,
  expandedProducts, expandedCats,
  editingProductId, editProductName, savingProductName,
  addCatProductId, newCatName, addingCat,
  editingCatKey, editCatName, savingCat,
  addColKey, newColName, addingCol,
  onToggleProduct, onToggleCat,
  onStartEditProduct, onCancelEditProduct, onChangeProductName, onSaveProductName,
  onDeleteProduct, onToggleProductVisibility,
  onStartAddCat, onCancelAddCat, onChangeCatName, onAddCategory,
  onStartEditCat, onCancelEditCat, onChangeEditCatName, onSaveCatName,
  onDeleteCategory, onToggleCategoryVisibility,
  onStartAddCol, onCancelAddCol, onChangeColName, onAddCollection,
  onDeleteCollection, onOpenCollection,
}: { product: ProductData; color: 'amber' | 'blue' } & Omit<ProductGroupProps, 'title' | 'color' | 'products'>) {
  const isExpanded = expandedProducts.has(product._id)
  const isEditingName = editingProductId === product._id
  const typeBadge = product.type === 'exterior'
    ? <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Exterior</span>
    : <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Interior</span>

  return (
    <div>
      {/* Product header */}
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-muted/20 transition-colors">
        <button onClick={() => onToggleProduct(product._id)} className="shrink-0">
          {isExpanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* Name (inline edit or display) */}
        {isEditingName ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Input
              value={editProductName}
              onChange={(e) => onChangeProductName(e.target.value)}
              className="h-7 text-sm py-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveProductName(product._id)
                if (e.key === 'Escape') onCancelEditProduct()
              }}
            />
            <button onClick={() => onSaveProductName(product._id)} disabled={savingProductName} className="text-green-600 hover:text-green-700">
              {savingProductName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button onClick={onCancelEditProduct} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => onToggleProduct(product._id)}>
            <span className="font-medium text-sm truncate">{product.name}</span>
            {typeBadge}
            <span className="text-xs text-muted-foreground">
              {product.categories.length} openness · <ImageIcon className="h-3 w-3 inline -mt-0.5" /> {product.fabricCount} fabrics
            </span>
          </div>
        )}

        {/* Actions */}
        {!isEditingName && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{product.visibleInQuote ? 'Visible' : 'Hidden'}</span>
              <Switch
                checked={product.visibleInQuote}
                onCheckedChange={() => onToggleProductVisibility(product._id, product.visibleInQuote)}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
            <button
              onClick={() => onStartEditProduct(product)}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <Link
              href={`/fabric-gallery?category=${encodeURIComponent(product.name)}`}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
              title="View fabrics"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => onDeleteProduct(product._id, product.name)}
              className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-muted"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded: categories */}
      {isExpanded && (
        <div className="border-t bg-muted/10 px-4 py-3 space-y-3">
          {/* Openness section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Openness / Subcategories
              </p>
              {addCatProductId !== product._id && (
                <button
                  onClick={() => onStartAddCat(product._id)}
                  className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-0.5 font-medium"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              )}
            </div>

            {product.categories.length === 0 && addCatProductId !== product._id && (
              <p className="text-xs text-muted-foreground italic">No openness options yet. Click "Add" to create one.</p>
            )}

            <div className="space-y-1">
              {product.categories.map((cat) => {
                const catKey = `${product._id}:${cat._id}`
                const isCatExpanded = expandedCats.has(catKey)
                const isEditingCat = editingCatKey === catKey

                return (
                  <div key={cat._id} className="rounded-lg border bg-background overflow-hidden">
                    {/* Category row */}
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button onClick={() => onToggleCat(catKey)} className="shrink-0">
                        {isCatExpanded
                          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>

                      {isEditingCat ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Input
                            value={editCatName}
                            onChange={(e) => onChangeEditCatName(e.target.value)}
                            className="h-6 text-xs py-0"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onSaveCatName(product._id, cat._id)
                              if (e.key === 'Escape') onCancelEditCat()
                            }}
                          />
                          <button onClick={() => onSaveCatName(product._id, cat._id)} disabled={savingCat} className="text-green-600">
                            {savingCat ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          </button>
                          <button onClick={onCancelEditCat} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={() => onToggleCat(catKey)}>
                          <span className="text-sm font-medium">{cat.name}</span>
                          {cat.collections.length > 0 && (
                            <span className="text-xs text-muted-foreground">{cat.collections.length} collection{cat.collections.length !== 1 ? 's' : ''}</span>
                          )}
                          {!cat.visibleInQuote && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><EyeOff className="h-3 w-3" />hidden</span>
                          )}
                        </div>
                      )}

                      {!isEditingCat && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={cat.visibleInQuote}
                            onCheckedChange={() => onToggleCategoryVisibility(product._id, cat._id, cat.visibleInQuote)}
                            className="data-[state=checked]:bg-amber-500 scale-75"
                          />
                          <button onClick={() => onStartEditCat(catKey, cat.name)} className="text-muted-foreground hover:text-foreground p-0.5">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button onClick={() => onDeleteCategory(product._id, cat._id, cat.name)} className="text-muted-foreground hover:text-red-500 p-0.5">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded: collections */}
                    {isCatExpanded && (
                      <div className="border-t bg-muted/20 px-3 py-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                            <Layers className="h-2.5 w-2.5" /> Collections
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenCollection(product.name, cat.name, '')}
                              className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium"
                              title="Manage all fabric colors in this openness option"
                            >
                              <ImageIcon className="h-2.5 w-2.5" /> Fabrics
                            </button>
                            {addColKey !== catKey && (
                              <button
                                onClick={() => onStartAddCol(catKey)}
                                className="text-[11px] text-amber-600 hover:text-amber-700 flex items-center gap-0.5 font-medium"
                              >
                                <Plus className="h-2.5 w-2.5" /> Add collection
                              </button>
                            )}
                          </div>
                        </div>

                        {cat.collections.length === 0 && addColKey !== catKey && (
                          <p className="text-xs text-muted-foreground italic">No collections — click "Add collection" or "Fabrics" to add fabric colors directly.</p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {cat.collections.map((col) => (
                            <span
                              key={col._id}
                              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-background hover:bg-amber-50 hover:border-amber-300 group/col transition-colors cursor-pointer"
                              onClick={() => onOpenCollection(product.name, cat.name, col.name)}
                              title="Click to manage fabric colors"
                            >
                              <ImageIcon className="h-2.5 w-2.5 text-muted-foreground group-hover/col:text-amber-600" />
                              {col.name}
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteCollection(product._id, cat._id, col._id) }}
                                className="text-muted-foreground hover:text-red-500 -mr-0.5"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add collection inline */}
                        {addColKey === catKey && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Input
                              value={newColName}
                              onChange={(e) => onChangeColName(e.target.value)}
                              placeholder="Collection name"
                              className="h-7 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') onAddCollection(product._id, cat._id)
                                if (e.key === 'Escape') onCancelAddCol()
                              }}
                            />
                            <button
                              onClick={() => onAddCollection(product._id, cat._id)}
                              disabled={addingCol || !newColName.trim()}
                              className="text-green-600 hover:text-green-700 disabled:opacity-40"
                            >
                              {addingCol ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={onCancelAddCol} className="text-muted-foreground hover:text-foreground">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add category inline */}
              {addCatProductId === product._id && (
                <div className="flex items-center gap-1.5 pt-1">
                  <Input
                    value={newCatName}
                    onChange={(e) => onChangeCatName(e.target.value)}
                    placeholder="Openness option (e.g. 1%, 3%, Light Filtering)"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onAddCategory(product._id)
                      if (e.key === 'Escape') onCancelAddCat()
                    }}
                  />
                  <button
                    onClick={() => onAddCategory(product._id)}
                    disabled={addingCat || !newCatName.trim()}
                    className="text-green-600 hover:text-green-700 disabled:opacity-40"
                  >
                    {addingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </button>
                  <button onClick={onCancelAddCat} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
