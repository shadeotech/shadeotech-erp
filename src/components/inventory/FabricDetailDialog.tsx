'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'

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
}

interface FabricDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fabric: FabricItem | null
}

const TABS = ['Details', 'Transactions', 'Cut Pieces'] as const
type Tab = (typeof TABS)[number]

export default function FabricDetailDialog({ open, onOpenChange, fabric }: FabricDetailDialogProps) {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('Details')
  const [cutPieces, setCutPieces] = useState<CutPieceItem[]>([])
  const [loadingCuts, setLoadingCuts] = useState(false)
  const [savingCut, setSavingCut] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addingCut, setAddingCut] = useState(false)
  const [newCut, setNewCut] = useState({ label: '', width: 0, length: 0, quantity: 1, unit: 'mm' })

  const fetchCutPieces = useCallback(async () => {
    if (!token || !fabric) return
    setLoadingCuts(true)
    try {
      const res = await fetch(`/api/inventory/fabrics/${fabric._id}/cut-pieces`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCutPieces(data.cutPieces || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCuts(false)
    }
  }, [token, fabric])

  useEffect(() => {
    if (open && activeTab === 'Cut Pieces') {
      fetchCutPieces()
    }
  }, [open, activeTab, fetchCutPieces])

  useEffect(() => {
    if (!open) {
      setActiveTab('Details')
      setAddingCut(false)
      setNewCut({ label: '', width: 0, length: 0, quantity: 1, unit: 'mm' })
    }
  }, [open])

  const handleAddCutPiece = async () => {
    if (!token || !fabric) return
    setSavingCut(true)
    try {
      const res = await fetch(`/api/inventory/fabrics/${fabric._id}/cut-pieces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newCut, fabric: fabric.name }),
      })
      if (!res.ok) throw new Error('Failed to add cut piece')
      setNewCut({ label: '', width: 0, length: 0, quantity: 1, unit: 'mm' })
      setAddingCut(false)
      await fetchCutPieces()
      toast({ title: 'Cut piece added' })
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add cut piece', variant: 'destructive' })
    } finally {
      setSavingCut(false)
    }
  }

  const handleDeleteCutPiece = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/inventory/cut-pieces/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchCutPieces()
      toast({ title: 'Cut piece removed' })
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  if (!fabric) return null

  const threshold = fabric.lowStockThreshold ?? 10
  const isLow = fabric.quantity <= threshold
  const isWarning = fabric.quantity <= threshold * 2 && fabric.quantity > threshold

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{fabric.name}</DialogTitle>
            {isLow && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Low Stock
              </Badge>
            )}
            {isWarning && (
              <Badge className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300">
                <AlertTriangle className="h-3 w-3" />
                Warning
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 -mx-6 px-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'Cut Pieces') fetchCutPieces()
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'Details' && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Fabric Name</Label>
              <p className="text-sm font-medium mt-0.5">{fabric.name || '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Collection</Label>
              <p className="text-sm font-medium mt-0.5">{fabric.collection || '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fabric Code</Label>
              <p className="text-sm font-medium mt-0.5">{fabric.fabricCode || '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Color Code</Label>
              <p className="text-sm font-medium mt-0.5">{fabric.colorCode || '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Color Name</Label>
              <p className="text-sm font-medium mt-0.5">{fabric.colorName || '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max Width (mm)</Label>
              <p className="text-sm font-medium mt-0.5">{fabric.width ?? '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Quantity on Hand</Label>
              <p className={`text-sm font-medium mt-0.5 ${isLow ? 'text-red-600' : ''}`}>
                {fabric.quantity}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Low Stock Threshold</Label>
              <p className="text-sm font-medium mt-0.5">{threshold}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Product Type</Label>
              <p className="text-sm font-medium mt-0.5">{fabric.product || '—'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Duo Shade</Label>
              <p className="text-sm font-medium mt-0.5">{fabric.isDuo ? 'Yes' : 'No'}</p>
            </div>
            {fabric.isDuo && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Duo Specs</Label>
                <p className="text-sm font-medium mt-0.5">{fabric.duoSpecs || '—'}</p>
              </div>
            )}
            {fabric.specs && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Specs</Label>
                <p className="text-sm font-medium mt-0.5 whitespace-pre-line">{fabric.specs}</p>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'Transactions' && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <p>Stock movement history coming soon.</p>
            <p className="text-xs mt-1">Purchase orders and production deductions will appear here.</p>
          </div>
        )}

        {/* Cut Pieces Tab */}
        {activeTab === 'Cut Pieces' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{cutPieces.length} cut piece{cutPieces.length !== 1 ? 's' : ''}</p>
              <Button size="sm" className="gap-1" onClick={() => setAddingCut(true)}>
                <Plus className="h-4 w-4" />
                Add Cut Piece
              </Button>
            </div>

            {addingCut && (
              <div className="rounded-lg border p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm font-medium">New Cut Piece</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={newCut.label}
                      onChange={(e) => setNewCut({ ...newCut, label: e.target.value })}
                      placeholder="e.g. Bedroom Left"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Input
                      value={newCut.unit}
                      onChange={(e) => setNewCut({ ...newCut, unit: e.target.value })}
                      placeholder="mm"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input
                      type="number"
                      value={newCut.width || ''}
                      onChange={(e) => setNewCut({ ...newCut, width: Number(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Drop (Length)</Label>
                    <Input
                      type="number"
                      value={newCut.length || ''}
                      onChange={(e) => setNewCut({ ...newCut, length: Number(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      value={newCut.quantity || ''}
                      onChange={(e) => setNewCut({ ...newCut, quantity: Number(e.target.value) || 1 })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setAddingCut(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleAddCutPiece} disabled={savingCut}>
                    {savingCut ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            {loadingCuts ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Width</TableHead>
                      <TableHead>Drop</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Dated</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cutPieces.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-6 text-sm">
                          No cut pieces. Click &quot;Add Cut Piece&quot; to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cutPieces.map((cp) => (
                        <TableRow key={cp._id}>
                          <TableCell className="text-sm">{cp.label || '—'}</TableCell>
                          <TableCell className="text-sm">{cp.width}</TableCell>
                          <TableCell className="text-sm">{cp.length}</TableCell>
                          <TableCell className="text-sm">{cp.quantity}</TableCell>
                          <TableCell className="text-sm">{cp.unit}</TableCell>
                          <TableCell className="text-sm">
                            {cp.createdAt ? new Date(cp.createdAt).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteCutPiece(cp._id)}
                              disabled={deletingId === cp._id}
                            >
                              {deletingId === cp._id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
