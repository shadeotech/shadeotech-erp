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
import { Plus, AlertTriangle, Edit, Trash2, Search, X, Settings, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { INVENTORY_PRODUCTS } from '@/constants'
import { useToast } from '@/components/ui/use-toast'
import FabricDetailDialog from '@/components/inventory/FabricDetailDialog'

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
]

export default function ProductionInventoryPage() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const isAdmin = user?.role === 'ADMIN'

  const [fabrics, setFabrics] = useState<FabricItem[]>([])
  const [cassettes, setCassettes] = useState<CassetteItem[]>([])
  const [components, setComponents] = useState<ComponentItem[]>([])
  const [cutPieces, setCutPieces] = useState<CutPieceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cutPieceDialogOpen, setCutPieceDialogOpen] = useState(false)
  const [newCutPiece, setNewCutPiece] = useState({ fabric: '', label: '', width: 0, length: 0, quantity: 1, unit: 'mm' })
  const [editingId, setEditingId] = useState<string | null>(null)

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
      const [fRes, cRes, compRes, cpRes] = await Promise.all([
        fetch('/api/inventory/fabrics', { headers }),
        fetch('/api/inventory/cassettes', { headers }),
        fetch('/api/inventory/components', { headers }),
        fetch('/api/inventory/cut-pieces', { headers }),
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

  return (
    <div className="space-y-6">
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

      {/* Custom categories */}
      {!['fabrics', 'cassettes', 'bottom-rails', 'components', 'cut-pieces'].includes(selectedCategory) && (
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
    </div>
  )
}
