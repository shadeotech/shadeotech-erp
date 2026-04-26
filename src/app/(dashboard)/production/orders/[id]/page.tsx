'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  FileText,
  Factory,
  Tag,
  Upload,
  MessageSquare,
  Scissors,
  Package,
  Truck,
  Clock,
  Plus,
  X,
  Check,
  Loader2,
  ArrowLeft,
  Printer,
  MoreHorizontal,
  Camera,
  PenLine,
  Trash2,
  Search,
  CalendarDays,
  User2,
  CheckCircle2,
  MapPin,
} from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import type { ProductionStatus, ProductionOrder, ProductionOrderItem } from '@/types/production'
import { useAuthStore } from '@/stores/authStore'
import { getImagePath } from '@/constants/fabrics'
import { useToast } from '@/components/ui/use-toast'
import { decimalToFraction, computeTriShadeRow } from '@/lib/productionSheetCalc'
import ProductionSheetsTab from '@/components/production/ProductionSheetsTab'

const statusLabels: Record<ProductionStatus, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  READY_FOR_PRODUCTION: 'Ready For Production',
  PRODUCTION_CHECK: 'Production Check',
  COMPONENT_CUT: 'Component Cut',
  FABRIC_CUT: 'Fabric Cut',
  ASSEMBLE: 'Assemble',
  QUALITY_CHECK: 'Quality Check',
  PACKING: 'Packing',
  SHIPPED_INSTALLED: 'Shipped/Installed',
}

// Production workflow steps in order (excluding PENDING_APPROVAL)
const workflowSteps: ProductionStatus[] = [
  'READY_FOR_PRODUCTION',
  'PRODUCTION_CHECK',
  'COMPONENT_CUT',
  'FABRIC_CUT',
  'ASSEMBLE',
  'QUALITY_CHECK',
  'PACKING',
  'SHIPPED_INSTALLED',
]

// Calculate progress based on status
const calculateProgress = (status: ProductionStatus): number => {
  const index = workflowSteps.findIndex(step => step === status)
  if (index === -1) return 0
  return Math.round(((index + 1) / workflowSteps.length) * 100)
}

// Get status badge color
const getStatusBadgeColor = (status: ProductionStatus): string => {
  if (status === 'SHIPPED_INSTALLED') return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
  if (status === 'PACKING' || status === 'QUALITY_CHECK') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  if (status === 'ASSEMBLE' || status === 'FABRIC_CUT' || status === 'COMPONENT_CUT') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
  return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
}

export default function ProductionOrderDetailPage() {
  const params = useParams()
  const { token } = useAuthStore()
  const orderId = params.id as string
  const [order, setOrder] = useState<ProductionOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [newNote, setNewNote] = useState('')
  const [cutPieces, setCutPieces] = useState<Array<{ fabric: string; width: number; length: number }>>([])
  const [bomItems, setBomItems] = useState<Array<{ supplyId: string; supplyName: string; quantity: number; unit: string; availableQuantity?: number }>>([])
  const [shippingBoxes, setShippingBoxes] = useState<Array<{ width: number; length: number; height: number; weight: number; savedAt?: Date }>>([])
  const [trackingNumber, setTrackingNumber] = useState('')
  const [airwayBillNumber, setAirwayBillNumber] = useState('')
  const [shippingDate, setShippingDate] = useState('')
  const [trackingSearch, setTrackingSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [quoteData, setQuoteData] = useState<{ adminNote?: string; addOns?: any[]; items?: any[] } | null>(null)
  const [installDateInput, setInstallDateInput] = useState<string>('')
  const [uploadCategory, setUploadCategory] = useState<'packing' | 'installation' | 'jobsite'>('jobsite')
  const [deliveryMethod, setDeliveryMethod] = useState<'INSTALLATION' | 'PICKUP' | 'SHIPPING'>('INSTALLATION')
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  // Notes filters
  const [noteSearch, setNoteSearch] = useState('')
  const [noteUserFilter, setNoteUserFilter] = useState('all')
  const [noteDateFilter, setNoteDateFilter] = useState('all')

  // Signature pad refs
  const shippingSignatureRef = useRef<SignatureCanvas | null>(null)
  const installSignatureRef = useRef<SignatureCanvas | null>(null)
  const [shippingSignature, setShippingSignature] = useState<string | null>(null)
  const [installSignature, setInstallSignature] = useState<string | null>(null)
  const [installCompletedDate, setInstallCompletedDate] = useState('')
  const [installerName, setInstallerName] = useState('')
  const [installNotes, setInstallNotes] = useState('')
  const [savingSignature, setSavingSignature] = useState(false)

  type InventoryItem = { _id: string; name: string; type: string; category: string; quantity: number; unit: string }
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/inventory/fabrics', { headers }).then(r => r.ok ? r.json() : { fabrics: [] }),
      fetch('/api/inventory/cassettes', { headers }).then(r => r.ok ? r.json() : { cassettes: [] }),
      fetch('/api/inventory/components', { headers }).then(r => r.ok ? r.json() : { components: [] }),
    ]).then(([fData, cData, compData]) => {
      const fabrics = (fData.fabrics || []).map((f: any) => ({
        _id: f._id,
        name: f.name,
        type: 'Fabric',
        category: f.collection || 'General',
        quantity: f.quantity ?? 0,
        unit: 'yards',
      }))
      const cassettes = (cData.cassettes || []).map((c: any) => ({
        _id: c._id,
        name: `${c.type} Cassette - ${c.color}`,
        type: 'Cassette',
        category: c.type,
        quantity: c.quantity ?? 0,
        unit: 'pieces',
      }))
      const components = (compData.components || []).map((c: any) => ({
        _id: c._id,
        name: c.name,
        type: 'Component',
        category: c.type || 'Other',
        quantity: c.quantity ?? 0,
        unit: c.unit || 'pieces',
      }))
      setInventoryItems([...components, ...fabrics, ...cassettes])
    }).catch(() => setInventoryItems([]))
  }, [token])

  const fetchOrder = useCallback(async () => {
    if (!token || !orderId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load order')
      }
      const data = await res.json()
      const raw = data.order
      const orderWithDates: ProductionOrder = {
        ...raw,
        _id: raw._id,
        orderDate: raw.orderDate ? new Date(raw.orderDate) : new Date(),
        installationDate: raw.installationDate ? new Date(raw.installationDate) : undefined,
        approvalDate: raw.approvalDate ? new Date(raw.approvalDate) : undefined,
        createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
        items: (raw.items || []).map((item: any, idx: number) => ({
          ...item,
          _id: item._id?.toString() || item.lineNumber?.toString() || String(idx + 1),
        })),
        orderNotes: (raw.orderNotes || []).map((n: any) => ({
          ...n,
          createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
        })),
        activity: (raw.activity || []).map((a: any) => ({
          ...a,
          timestamp: a.timestamp ? new Date(a.timestamp) : new Date(),
        })),
      }
      setOrder(orderWithDates)
      setInstallDateInput(raw.installationDate ? new Date(raw.installationDate).toISOString().split('T')[0] : '')
      setDeliveryMethod((raw.deliveryMethod as any) || 'INSTALLATION')
      // Fetch source quote for adminNote and addOns (non-blocking)
      if (raw.quoteId) {
        fetch(`/api/quotes/${raw.quoteId}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.quote) setQuoteData({ adminNote: d.quote.adminNote, addOns: d.quote.addOns || [], items: d.quote.items || [] }) })
          .catch(() => {})
      }
      setNotes(raw.notes || '')
      setCutPieces((raw.cutPieces || []).map((p: any) => ({ fabric: p.fabric || '', width: p.width || 0, length: p.length || 0 })))
      setBomItems((raw.bom || []).map((b: any) => ({
        supplyId: b._id || '',
        supplyName: b.supplyName || '',
        quantity: b.quantity || 0,
        unit: b.unit || 'pieces',
        availableQuantity: undefined,
      })))
      setShippingBoxes((raw.shipping || []).map((s: any) => ({
        width: s.width || 0,
        length: s.length || 0,
        height: s.height || 0,
        weight: s.weight || 0,
        savedAt: undefined,
      })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [token, orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const addCutPiece = () => {
    setCutPieces([...cutPieces, { fabric: '', width: 0, length: 0 }])
  }

  const removeCutPiece = (index: number) => {
    setCutPieces(cutPieces.filter((_, i) => i !== index))
  }

  const addBOMItem = () => {
    setBomItems([...bomItems, { supplyId: '', supplyName: '', quantity: 0, unit: '', availableQuantity: 0 }])
  }

  const handleBOMItemSelect = (index: number, supplyId: string) => {
    const selectedItem = inventoryItems.find(item => item._id === supplyId)
    if (selectedItem) {
      const updated = [...bomItems]
      updated[index] = {
        ...updated[index],
        supplyId: selectedItem._id,
        supplyName: selectedItem.name,
        unit: selectedItem.unit,
        availableQuantity: selectedItem.quantity,
      }
      setBomItems(updated)
    }
  }

  const removeBOMItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index))
  }

  const addShippingBox = () => {
    setShippingBoxes([...shippingBoxes, { width: 0, length: 0, height: 0, weight: 0 }])
  }

  const removeShippingBox = (index: number) => {
    setShippingBoxes(shippingBoxes.filter((_, i) => i !== index))
  }

  const saveShippingBox = (index: number) => {
    const updated = [...shippingBoxes]
    updated[index].savedAt = new Date()
    setShippingBoxes(updated)
  }

  const saveCutPieces = async () => {
    if (!token || !order) return
    setSaving('cutPieces')
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cutPieces: cutPieces.map(p => ({ fabric: p.fabric, width: p.width, length: p.length })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      await fetchOrder()
      toast({ title: 'Saved', description: 'Cut pieces updated and visible in Activity.', variant: 'default' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save cut pieces')
    } finally {
      setSaving(null)
    }
  }

  const saveBOM = async () => {
    if (!token || !order) return
    setSaving('bom')
    try {
      const validBom = bomItems.filter(b => b.supplyName?.trim()).map(b => ({ supplyName: b.supplyName.trim(), quantity: b.quantity, unit: b.unit || 'pieces' }))
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bom: validBom }),
      })
      if (!res.ok) throw new Error('Failed to save')
      await fetchOrder()
      toast({ title: 'Saved', description: 'Bill of materials updated and visible in Activity.', variant: 'default' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save BOM')
    } finally {
      setSaving(null)
    }
  }

  const saveShipping = async () => {
    if (!token || !order) return
    setSaving('shipping')
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shipping: shippingBoxes.map(s => ({ width: s.width, length: s.length, height: s.height, weight: s.weight })),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      await fetchOrder()
      toast({ title: 'Saved', description: 'Shipping info updated and visible in Activity.', variant: 'default' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save shipping')
    } finally {
      setSaving(null)
    }
  }

  const addNote = async () => {
    if (!token || !newNote.trim()) return
    setSaving('note')
    try {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newNote.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      setNewNote('')
      await fetchOrder()
      toast({ title: 'Note added', description: 'Your note is visible in Notes and Activity tabs.', variant: 'default' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add note')
    } finally {
      setSaving(null)
    }
  }

  const getStatusIndex = (s: ProductionStatus) => workflowSteps.findIndex((step) => step === s)

  const handleStatusChange = async (newStatus: ProductionStatus) => {
    if (!token || !order || newStatus === order.status) return

    setSaving('order')
    try {
      let newStageCompletions: Array<{ status: string; completedBy: string; completedAt: string }> = []

      const userName = useAuthStore.getState().user
        ? `${useAuthStore.getState().user?.firstName} ${useAuthStore.getState().user?.lastName}`
        : 'User'

      const existing = order.stageCompletions || []

      if (newStatus === 'PENDING_APPROVAL') {
        newStageCompletions = []
      } else {
        const targetIndex = getStatusIndex(newStatus)
        const existingByStatus = new Map<string, { status: string; completedBy: string; completedAt: string }>()

        for (const sc of existing as any[]) {
          const idx = getStatusIndex(sc.status as ProductionStatus)
          if (idx !== -1 && idx <= targetIndex) {
            existingByStatus.set(sc.status, {
              status: sc.status,
              completedBy: sc.completedBy,
              completedAt:
                typeof sc.completedAt === 'string'
                  ? sc.completedAt
                  : new Date(sc.completedAt).toISOString(),
            })
          }
        }

        for (let i = 0; i <= targetIndex; i++) {
          const s = workflowSteps[i]
          if (!s) continue
          if (existingByStatus.has(s)) {
            newStageCompletions.push(existingByStatus.get(s) as any)
          } else {
            newStageCompletions.push({
              status: s,
              completedBy: userName,
              completedAt: new Date().toISOString(),
            })
          }
        }
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, stageCompletions: newStageCompletions }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      await fetchOrder()
      toast({
        title: 'Status updated',
        description: `Order status: ${statusLabels[newStatus]}`,
        variant: 'default',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setSaving(null)
    }
  }

  const handleItemChecklistToggle = async (itemId: string, checked: boolean) => {
    if (!token || !order) return
    setSaving('checklist')
    try {
      const updatedItems: ProductionOrderItem[] = order.items.map((item) =>
        item._id === itemId ? { ...item, checklistDone: checked } : item,
      )

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: updatedItems }),
      })
      if (!res.ok) throw new Error('Failed to update checklist')
      await fetchOrder()
      toast({
        title: 'Checklist updated',
        description: 'Item checklist updated for this order.',
        variant: 'default',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update checklist')
    } finally {
      setSaving(null)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/orders/${orderId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Failed to upload')
      await fetchOrder()
      e.target.value = ''
      toast({ title: 'File uploaded', description: 'File saved and visible in Uploads and Activity tabs.', variant: 'default' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleFileUploadWithCategory = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      const res = await fetch(`/api/orders/${orderId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('Failed to upload')
      await fetchOrder()
      e.target.value = ''
      const labels: Record<string, string> = { packing: 'Packing', installation: 'Installation', jobsite: 'Job Site' }
      toast({ title: 'File uploaded', description: `Added to ${labels[category] || category}.`, variant: 'default' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const saveInstallDate = async (dateStr: string) => {
    if (!token || !order) return
    setSaving('installDate')
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ installationDate: dateStr || null }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await fetchOrder()
      toast({ title: 'Installation date updated', variant: 'default' })
    } catch {
      toast({ title: 'Failed to update date', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const saveDeliveryMethod = async (method: 'INSTALLATION' | 'PICKUP' | 'SHIPPING') => {
    if (!token || !order) return
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deliveryMethod: method }),
      })
      // No fetchOrder() — state is already set optimistically before calling this
    } catch {}
  }

  const saveShippingQuiet = async (boxes?: typeof shippingBoxes) => {
    if (!token || !order) return
    const data = (boxes ?? shippingBoxes).map(s => ({ width: s.width, length: s.length, height: s.height, weight: s.weight }))
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shipping: data }),
      })
    } catch {}
  }

  const handleGroupChecklistToggle = async (productItems: ProductionOrderItem[], checked: boolean) => {
    if (!token || !order) return
    setSaving('checklist')
    try {
      const ids = new Set(productItems.map(i => i._id))
      const updatedItems = order.items.map(item =>
        ids.has(item._id) ? { ...item, checklistDone: checked } : item
      )
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: updatedItems }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await fetchOrder()
    } catch {
      toast({ title: 'Failed to update checklist', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  const buildChecklistHtml = (autoPrint = false) => {
    if (!order) return ''
    // All items as rows for the landscape table
    const allItems = order.items.map(item => ({
      product: getProductName(item),
      area: item.area || '—',
      qty: item.qty || 1,
      width: item.width || '—',
      length: item.length || '—',
      fabric: item.fabric || '—',
      mount: item.mount || '—',
      operation: item.operation || 'MANUAL',
      done: item.checklistDone,
    }))
    const addOns = (quoteData?.addOns || []).filter((a: any) => a.name)
    const itemRowsHtml = allItems.map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb"><input type="checkbox" ${item.done ? 'checked' : ''} style="width:15px;height:15px;accent-color:#f59e0b" /></td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:600">${i + 1}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:500">${item.area}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${item.product}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${item.qty}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${item.width}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${item.length}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${item.fabric}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${item.mount}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb"><span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${item.operation === 'MOTORIZED' ? '#fef3c7' : '#f0fdf4'};color:${item.operation === 'MOTORIZED' ? '#92400e' : '#166534'};font-weight:600">${item.operation}</span></td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;color:${item.done ? '#10b981' : '#9ca3af'};font-weight:700">${item.done ? '✓' : '○'}</td>
      </tr>`).join('')
    const addOnsRowsHtml = addOns.length > 0
      ? addOns.map((a: any, i: number) => `<tr style="background:${i % 2 === 0 ? '#fffbeb' : '#fef9ee'}">
          <td style="padding:8px 10px;border-bottom:1px solid #fde68a"><input type="checkbox" style="width:15px;height:15px;accent-color:#f59e0b" /></td>
          <td style="padding:8px 10px;border-bottom:1px solid #fde68a;color:#92400e;font-weight:600">+</td>
          <td colspan="8" style="padding:8px 10px;border-bottom:1px solid #fde68a;font-weight:500">${a.quantity > 1 ? a.quantity + ' × ' : ''}${a.name}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #fde68a;color:#9ca3af">○</td>
        </tr>`).join('')
      : ''
    const totalItems = allItems.reduce((s, i) => s + i.qty, 0)
    const doneItems = allItems.filter(i => i.done).reduce((s, i) => s + i.qty, 0)
    const printTrigger = autoPrint ? `<script>window.onload=function(){window.print()}<\/script>` : ''
    return `<!DOCTYPE html><html><head><title>${order.orderNumber} — Packing Checklist</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 landscape;margin:15mm}
  body{font-family:-apple-system,'Segoe UI',sans-serif;color:#111;font-size:13px;background:#fff}
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:3px solid #f59e0b;margin-bottom:18px}
  .header-left{display:flex;align-items:center;gap:16px}
  .logo{height:44px}
  .order-num{font-size:22px;font-weight:800;color:#111}
  .order-sub{font-size:13px;color:#6b7280;margin-top:2px}
  .meta-grid{display:flex;gap:28px}
  .meta-item{text-align:right}.meta-item .label{font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em}
  .meta-item .value{font-size:13px;font-weight:600;color:#374151;margin-top:1px}
  .progress-bar{background:#e5e7eb;border-radius:4px;height:6px;margin-bottom:18px;overflow:hidden}
  .progress-fill{background:linear-gradient(90deg,#f59e0b,#fbbf24);height:100%;border-radius:4px;width:${totalItems > 0 ? Math.round((doneItems/totalItems)*100) : 0}%}
  .progress-label{font-size:11px;color:#6b7280;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead tr{background:#1f2937;color:#fff}
  thead th{padding:9px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
  thead th.center{text-align:center}
  .footer{margin-top:20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e5e7eb;padding-top:12px}
  .footer .sig{width:200px}
  .footer .sig-line{border-bottom:1px solid #9ca3af;margin-bottom:4px;height:36px}
  .footer .sig-label{font-size:10px;color:#9ca3af}
  .summary{font-size:11px;color:#6b7280}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>${printTrigger}</head><body>
<div class="header">
  <div class="header-left">
    <img src="/images/logo.png" class="logo" alt="Logo" onerror="this.style.display='none'" />
    <div>
      <div class="order-num">${order.orderNumber}</div>
      <div class="order-sub">${order.customerName}${order.sideMark ? '  ·  ' + order.sideMark : ''}</div>
    </div>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><div class="label">Order Date</div><div class="value">${new Date(order.orderDate).toLocaleDateString()}</div></div>
    ${order.installationDate ? `<div class="meta-item"><div class="label">Install Date</div><div class="value">${new Date(order.installationDate).toLocaleDateString()}</div></div>` : ''}
    <div class="meta-item"><div class="label">Status</div><div class="value">${statusLabels[order.status]}</div></div>
    <div class="meta-item"><div class="label">Total Items</div><div class="value">${totalItems}</div></div>
    <div class="meta-item"><div class="label">Completed</div><div class="value" style="color:${doneItems===totalItems?'#10b981':'#f59e0b'}">${doneItems} / ${totalItems}</div></div>
  </div>
</div>
<div class="progress-label">${doneItems} of ${totalItems} items checked</div>
<div class="progress-bar"><div class="progress-fill"></div></div>
<table>
  <thead><tr>
    <th style="width:36px"></th>
    <th style="width:32px">#</th>
    <th>Location / Area</th>
    <th>Product</th>
    <th class="center" style="width:50px">Qty</th>
    <th class="center" style="width:60px">Width</th>
    <th class="center" style="width:60px">Drop</th>
    <th>Fabric</th>
    <th>Mount</th>
    <th style="width:90px">Operation</th>
    <th class="center" style="width:40px">Done</th>
  </tr></thead>
  <tbody>${itemRowsHtml}${addOnsRowsHtml}</tbody>
</table>
<div class="footer">
  <div class="summary">Generated ${new Date().toLocaleString()} · ${order.orderNumber}</div>
  <div class="sig"><div class="sig-line"></div><div class="sig-label">Checked by / Signature</div></div>
  <div class="sig"><div class="sig-line"></div><div class="sig-label">Date</div></div>
</div>
</body></html>`
  }

  const handlePreviewChecklist = () => {
    const html = buildChecklistHtml(false)
    if (!html) return
    const win = window.open('', '_blank', 'width=1050,height=750')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  const handlePrintChecklist = () => {
    const html = buildChecklistHtml(true)
    if (!html) return
    const win = window.open('', '_blank', 'width=1050,height=750')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  const handleEmailChecklist = () => {
    if (!order) return
    const subject = encodeURIComponent(`Packing Checklist — ${order.orderNumber}`)
    const body = encodeURIComponent(`Hi,\n\nPlease find the packing checklist for order ${order.orderNumber} (${order.customerName}).\n\nOrder: ${order.orderNumber}\nCustomer: ${order.customerName}\nSide Mark: ${order.sideMark || '—'}\nInstallation: ${order.installationDate ? new Date(order.installationDate).toLocaleDateString() : '—'}\n\nThank you`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleTextChecklist = () => {
    if (!order) return
    const text = encodeURIComponent(`Packing Checklist: ${order.orderNumber} — ${order.customerName}${order.sideMark ? ' ('+order.sideMark+')' : ''}. Install: ${order.installationDate ? new Date(order.installationDate).toLocaleDateString() : '—'}.`)
    window.location.href = `sms:?body=${text}`
  }

  const downloadShippingCSV = () => {
    if (!shippingBoxes.length || !order) return
    const headers = ['Length (in)', 'Width (in)', 'Height (in)', 'Weight (oz)']
    const rows = shippingBoxes.map(b => [b.length, b.width, b.height, Math.round(b.weight * 16)])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${order.orderNumber}-shipping.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Link href="/production/orders">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-red-800 dark:text-red-200">
          <p className="font-medium">Error loading order</p>
          <p className="text-sm mt-1">{error || 'Order not found'}</p>
        </div>
      </div>
    )
  }

  // Calculate countdown
  const daysUntilInstallation = order.installationDate
    ? Math.ceil((order.installationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // Calculate progress
  const progress = calculateProgress(order.status)

  // Calculate manual and motorized shades
  const totalManualShades = order.items
    .filter(item => item.operation !== 'MOTORIZED')
    .reduce((sum, item) => sum + (item.qty || 1), 0)
  
  const totalMotorizedShades = order.items
    .filter(item => item.operation === 'MOTORIZED')
    .reduce((sum, item) => sum + (item.qty || 1), 0)
  
  // Count unique remotes and hubs for motorized items
  const motorizedItems = order.items.filter(item => item.operation === 'MOTORIZED')
  const uniqueRemotes = new Set(motorizedItems.map(item => item.remoteNumber).filter(Boolean)).size
  const uniqueHubs = new Set(motorizedItems.map(item => item.smartAccessoriesType).filter(Boolean)).size

  const fabricOptions = Array.from(new Set([
    ...(order.items?.map(i => i.fabric).filter(Boolean) || []),
    ...inventoryItems.filter(i => i.type === 'Fabric').map(i => i.name),
  ]))

  // Normalize images to {url, category} objects for backward compat
  const normalizedImages = (order.images || []).map(img =>
    typeof img === 'string' ? { url: img, category: 'jobsite' } : img
  )

  // Resolve product type name: prefer quote item productName, fall back to item.product
  const productLabel = (raw: string) => raw ? raw.split(' - ')[0].trim() : 'Other'
  const getProductName = (item: ProductionOrderItem): string => {
    if (quoteData?.items?.length) {
      const qi = quoteData.items.find((q: any) => q.lineNumber === item.lineNumber)
      if (qi?.productName) return qi.productName.split(' - ')[0].trim()
    }
    return productLabel(item.product)
  }

  // Grouped checklist by product type
  const checklistGroups: Record<string, typeof order.items> = {}
  for (const item of order.items) {
    const key = getProductName(item)
    if (!checklistGroups[key]) checklistGroups[key] = []
    checklistGroups[key].push(item)
  }
  const checklistSummary = Object.entries(checklistGroups)
    .map(([product, items]) => `${items.reduce((s, i) => s + (i.qty || 1), 0)} ${product}`)
    .join(' · ')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">
            <Link href={`/customers/${order.customerId}`} className="hover:underline text-amber-600 dark:text-amber-500">{order.customerName}</Link>
            {' • '}{order.sideMark || '-'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full grid grid-cols-10">
          <TabsTrigger value="overview" className="text-xs whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="production-sheets" className="text-xs whitespace-nowrap">Production Sheets</TabsTrigger>
          <TabsTrigger value="workshop" className="text-xs whitespace-nowrap">Workshop</TabsTrigger>
          <TabsTrigger value="labels" className="text-xs whitespace-nowrap">Labels</TabsTrigger>
          <TabsTrigger value="uploads" className="text-xs whitespace-nowrap">Uploads</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs whitespace-nowrap">Notes</TabsTrigger>
          <TabsTrigger value="cut-piece" className="text-xs whitespace-nowrap">Cut Piece</TabsTrigger>
          <TabsTrigger value="bom" className="text-xs whitespace-nowrap">BOM</TabsTrigger>
          <TabsTrigger value="shipping" className="text-xs whitespace-nowrap">Shipping</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs whitespace-nowrap">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Order Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Amber top accent */}
            <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-100" />
            {/* Title row */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-lg flex-shrink-0">
                  {deliveryMethod === 'SHIPPING' ? '📦' : deliveryMethod === 'PICKUP' ? '🏪' : '🔧'}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{order.customerName}{order.sideMark ? ` · ${order.sideMark}` : ''}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeColor(order.status)} border-transparent`}>
                {statusLabels[order.status]}
              </span>
            </div>
            {/* Stat grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-700">
              {/* Status selector */}
              <div className="px-4 py-3 col-span-2 sm:col-span-2 lg:col-span-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Status</p>
                <Select value={order.status} onValueChange={(value) => handleStatusChange(value as ProductionStatus)} disabled={saving === 'order'}>
                  <SelectTrigger className="h-8 w-full text-xs border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Install date */}
              <div className="px-4 py-3 lg:col-span-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Install Date</p>
                <input
                  type="date"
                  value={installDateInput}
                  onChange={e => setInstallDateInput(e.target.value)}
                  onBlur={e => { if (e.target.value !== (order.installationDate ? new Date(order.installationDate).toISOString().split('T')[0] : '')) saveInstallDate(e.target.value) }}
                  className="h-8 w-full text-sm bg-transparent border border-gray-200 dark:border-gray-600 rounded-md px-2 focus:border-amber-500 outline-none text-gray-900 dark:text-white cursor-pointer"
                />
              </div>
              {/* Days until */}
              <div className="px-4 py-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Days Left</p>
                {daysUntilInstallation !== null ? (
                  <p className={`text-2xl font-bold leading-none ${daysUntilInstallation < 0 ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                    {Math.abs(daysUntilInstallation)}
                    <span className="text-[10px] font-normal text-gray-400 ml-1">{daysUntilInstallation < 0 ? 'overdue' : 'days'}</span>
                  </p>
                ) : <p className="text-sm text-gray-400">—</p>}
              </div>
              {/* Items */}
              <div className="px-4 py-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                  {order.items.reduce((s, i) => s + (i.qty || 1), 0)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{totalManualShades}M {totalMotorizedShades > 0 ? `· ${totalMotorizedShades}E` : ''}</p>
              </div>
              {/* Progress */}
              <div className="px-4 py-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Progress</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 leading-none">{progress}%</p>
                <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Progress Bar — same width as card above */}
          <div className="flex rounded-lg overflow-hidden">
            {workflowSteps.map((step, idx) => {
              const stepProgress = Math.round(((idx + 1) / workflowSteps.length) * 100)
              const isActive = order.status === step
              const isDone = workflowSteps.indexOf(order.status) > idx
              return (
                <button
                  key={step}
                  onClick={() => handleStatusChange(step)}
                  disabled={saving === 'order'}
                  title={statusLabels[step]}
                  className={`relative flex flex-1 items-center gap-1.5 px-3 py-2.5 transition-colors min-w-0
                    ${isActive
                      ? 'bg-amber-500 text-white'
                      : isDone
                        ? 'bg-gray-400 dark:bg-gray-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }
                    ${idx > 0 ? '-ml-2.5' : ''}
                  `}
                  style={{
                    clipPath: idx === workflowSteps.length - 1
                      ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10px 50%)'
                      : idx === 0
                        ? 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)'
                        : 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)',
                    zIndex: isActive ? 2 : isDone ? 1 : 0,
                  }}
                >
                  <Clock className="h-3 w-3 flex-shrink-0 opacity-80" />
                  <div className="text-left min-w-0 overflow-hidden">
                    <div className="font-bold text-[10px] leading-tight">{stepProgress}%</div>
                    <div className="text-[10px] leading-tight opacity-90 truncate">{statusLabels[step]}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Side Mark:</span>
                  <span className="font-medium">{order.sideMark || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Customer:</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge>{statusLabels[order.status]}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Order Date:</span>
                  <span>{format(order.orderDate, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Approval Date:</span>
                  <span>{order.approvalDate ? format(order.approvalDate, 'MMM dd, yyyy') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Installation Date:</span>
                  <span>{order.installationDate ? format(order.installationDate, 'MMM dd, yyyy') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Manual Shades:</span>
                  <span className="font-medium">{totalManualShades}</span>
                </div>
                {totalMotorizedShades > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Motorized Shades:</span>
                      <span className="font-medium">{totalMotorizedShades}</span>
                    </div>
                    {uniqueRemotes > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Number of Remotes:</span>
                        <span className="font-medium">{uniqueRemotes}</span>
                      </div>
                    )}
                    {uniqueHubs > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Number of Hubs:</span>
                        <span className="font-medium">{uniqueHubs}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order Checklist */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Order Checklist</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {checklistSummary || 'No items yet'}
                    </p>
                  </div>
                  {order.items.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={handlePreviewChecklist} className="gap-2">
                          <FileText className="h-4 w-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handlePrintChecklist} className="gap-2">
                          <Printer className="h-4 w-4" /> Print
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleEmailChecklist} className="gap-2">
                          <MessageSquare className="h-4 w-4" /> Send by Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleTextChecklist} className="gap-2">
                          <Tag className="h-4 w-4" /> Send by Text
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.length === 0 && (
                    <p className="text-sm text-muted-foreground">No items on this order yet.</p>
                  )}
                  {Object.entries(checklistGroups).map(([product, items]) => {
                    const total = items.reduce((s, i) => s + (i.qty || 1), 0)
                    const allDone = items.every(i => i.checklistDone)
                    const groupId = `group-check-${product.replace(/\s+/g, '-')}`
                    return (
                      <div key={product} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <Checkbox
                          id={groupId}
                          checked={allDone}
                          onCheckedChange={(checked) => handleGroupChecklistToggle(items, !!checked)}
                          disabled={saving === 'checklist' || order.status === 'PENDING_APPROVAL'}
                        />
                        <label
                          htmlFor={groupId}
                          className={`text-sm font-medium cursor-pointer ${allDone ? 'line-through text-muted-foreground' : 'text-gray-900 dark:text-white'}`}
                        >
                          {total} {product}
                        </label>
                        {allDone && <Check className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />}
                      </div>
                    )
                  })}
                  {(quoteData?.addOns || []).filter((a: any) => a.name).map((addon: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <Checkbox id={`addon-check-${idx}`} />
                      <label htmlFor={`addon-check-${idx}`} className="text-sm font-medium cursor-pointer text-gray-900 dark:text-white">
                        {addon.quantity > 1 ? `${addon.quantity} ` : ''}{addon.name}
                      </label>
                    </div>
                  ))}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Fabric & Cassette Reference — horizontal scrollable card below the two columns */}
          {order.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fabric & Cassette Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {order.items.map((item, idx) => (
                    <div key={item._id} className="flex-shrink-0 w-44 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.area}</p>
                        <p className="text-xs text-muted-foreground truncate">{getProductName(item)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Fabric: {item.fabric || '—'}</p>
                        <div className="w-full aspect-square rounded border bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                          {item.fabricImage ? (
                            <img src={item.fabricImage.startsWith('/') || item.fabricImage.startsWith('http') ? item.fabricImage : getImagePath(item.fabricImage)} alt={item.fabric} className="w-full h-full object-cover" />
                          ) : (
                            <p className="text-[10px] text-gray-400 text-center px-1">{item.fabric || 'No image'}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground">Cassette: {item.cassetteTypeColor || '—'}</p>
                        <div className="w-full aspect-square rounded border bg-gray-50 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                          {item.cassetteImage ? (
                            <img src={item.cassetteImage.startsWith('/') || item.cassetteImage.startsWith('http') ? item.cassetteImage : getImagePath(item.cassetteImage)} alt={item.cassetteTypeColor} className="w-full h-full object-cover" />
                          ) : (
                            <p className="text-[10px] text-gray-400 text-center px-1">{item.cassetteTypeColor || 'No image'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Description / Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Production Sheets Tab */}
        <TabsContent value="production-sheets">
          <ProductionSheetsTab order={order} quoteData={quoteData} />
        </TabsContent>

        {/* Workshop Tab */}
        <TabsContent value="workshop">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left: Items list */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={item._id}
                      onClick={() => setSelectedItem(selectedItem === item._id ? null : item._id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedItem === item._id
                          ? 'border-l-4 border-l-cyan-500 border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Item {idx + 1}</p>
                        <Badge variant="outline" className="text-[10px]">{item.operation}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.area} — {item.product}</p>
                      <p className="text-xs text-muted-foreground">{item.width} × {item.length}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right: Item details + stage timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Item Details & Status</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedItem ? (() => {
                  const item = order.items.find(i => i._id === selectedItem)
                  if (!item) return null
                  return (
                    <div className="space-y-5">
                      {/* Status selector */}
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-gray-900 dark:text-white">Order Status</label>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(value as ProductionStatus)}
                          disabled={saving === 'order'}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Item details grid */}
                      <div className="rounded-lg border dark:border-gray-700 overflow-hidden">
                        <div className="divide-y dark:divide-gray-700">
                          {[
                            ['Unit Type', 'mm'],
                            ['Quantity', String(item.qty || 1)],
                            ['Measure To', item.mount || '—'],
                            ['Control Type', item.operation || '—'],
                            ['Fabric', item.fabric || '—'],
                            ['Collection', item.collection || '—'],
                            ['Cassette Type/Color', item.cassetteTypeColor || '—'],
                            ['Bottom Rail', item.bottomRail || '—'],
                            ['Side Chain', item.sideChain || '—'],
                            ['Brackets', item.brackets || '—'],
                            ...(item.operation === 'MOTORIZED' ? [
                              ['Motor', item.motor || '—'],
                              ['Motor Type', item.motorType || '—'],
                              ['Motor Accessories', item.smartAccessories || '—'],
                              ['Remote Control', item.remoteControl || '—'],
                              ['Remote No.', item.remoteNumber || '—'],
                              ['Channel #', item.channelNumber || '—'],
                            ] : []),
                            ...(item.operation === 'MANUAL' ? [
                              ['Cord/Chain', item.cordChain || '—'],
                              ['Cord/Chain Color', item.cordChainColor || '—'],
                            ] : []),
                          ].map(([label, value], i) => (
                            <div key={label} className={`flex items-center px-3 py-2 ${i % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                              <span className="text-xs text-muted-foreground w-40 flex-shrink-0">{label}</span>
                              <span className="text-xs text-gray-900 dark:text-white font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stage completion timeline */}
                      <div>
                        <p className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Stage History</p>
                        <div className="space-y-2">
                          {workflowSteps.map((step) => {
                            const completion = (order.stageCompletions || []).find((sc: any) => sc.status === step)
                            const done = !!completion
                            return (
                              <div key={step} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${done ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                <div>
                                  <p className={`text-xs font-medium ${done ? 'text-gray-900 dark:text-white' : 'text-muted-foreground'}`}>
                                    {statusLabels[step]}
                                  </p>
                                  {completion && (
                                    <p className="text-[11px] text-muted-foreground">
                                      {(completion as any).completedBy} · {new Date((completion as any).completedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })() : (
                  <p className="text-muted-foreground text-sm">Select an item from the left to view details</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Labels Tab */}
        <TabsContent value="labels">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #labels-print-root, #labels-print-root * { visibility: visible; }
              #labels-print-root { position: fixed; left: 0; top: 0; width: 100%; padding: 8px; box-sizing: border-box; }
              .label-card { break-inside: avoid; page-break-inside: avoid; border: 1px solid #000 !important; }
              .labels-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; }
            }
          `}</style>

          <div className="space-y-4">
            {/* Toolbar — hidden on print */}
            <div className="flex items-center justify-between no-print">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {order.items.length} label{order.items.length !== 1 ? 's' : ''}
              </p>
              <Button size="sm" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" />
                Print All Labels
              </Button>
            </div>

            {/* Labels grid */}
            <div id="labels-print-root">
              <div className="labels-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.items.map((item, idx) => {
                  const barcodeVal = `${order.orderNumber.replace(/-/g, '')}${String(idx + 1).padStart(4, '0')}`
                  const motorInfo = item.operation === 'MOTORIZED' && (item.remoteNumber || item.channelNumber)
                    ? ` | Remote: ${item.remoteNumber || '—'}, CH: ${item.channelNumber || '—'}`
                    : ''
                  const specialInstructions = `${item.mount || '—'}${motorInfo}`
                  const qrData = [
                    `ID:${barcodeVal}`,
                    `ORDER:${order.orderNumber}`,
                    `CUSTOMER:${order.customerName}`,
                    `AREA:${item.area || '—'}`,
                    `SIZE:${item.width}x${item.length}`,
                    `PRODUCT:${item.product || '—'}`,
                    `FABRIC:${item.fabric || '—'}`,
                    `MOUNT:${item.mount || '—'}`,
                    `OP:${item.operation || 'MANUAL'}`,
                    `MFG:${format(order.orderDate, 'dd-MM-yyyy')}`,
                    `ITEM:${idx + 1}/${order.items.length}`,
                  ].join('\n')
                  return (
                    <div
                      key={item._id}
                      className="label-card border border-gray-300 rounded bg-white text-black p-3"
                      style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', lineHeight: '1.4' }}
                    >
                      {/* Top section: 2 columns */}
                      <div className="grid grid-cols-2 gap-x-3 mb-2">
                        {/* Left */}
                        <div className="space-y-0.5">
                          <div><span className="font-semibold">Customer Name:</span> {order.customerName}</div>
                          <div>
                            <span className="font-semibold">Width:</span> {item.width}&nbsp;&nbsp;
                            <span className="font-semibold">Drop:</span> {item.length}
                          </div>
                          <div><span className="font-semibold">Fabric:</span> {item.fabric || '—'}</div>
                          <div><span className="font-semibold">Location:</span> {item.area || '—'}</div>
                          <div><span className="font-semibold">Special Instructions:</span> {specialInstructions}</div>
                        </div>
                        {/* Right */}
                        <div className="space-y-0.5 text-right">
                          {/* Company logo */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/images/logo.png" alt="Logo" style={{ height: 28, marginLeft: 'auto', marginBottom: 4, display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <div><span className="font-semibold">Order Date:</span> {format(order.orderDate, 'dd-MM-yyyy')}</div>
                          <div><span className="font-semibold">Due Date:</span> {order.installationDate ? format(order.installationDate, 'dd-MM-yyyy') : '—'}</div>
                          <div><span className="font-semibold">Order No:</span> {order.orderNumber}</div>
                          <div><span className="font-semibold">Cust Ref:</span> {order.sideMark || '—'}</div>
                          <div><span className="font-semibold">Items</span> {idx + 1} of {order.items.length}</div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-300 my-1.5" />

                      {/* Middle section */}
                      <div className="grid grid-cols-3 gap-x-2 mb-1.5" style={{ fontSize: '10px' }}>
                        <div><span className="font-semibold">Fabric Width:</span> {item.width}</div>
                        <div><span className="font-semibold">Fabric Drop:</span> {item.length}</div>
                        <div><span className="font-semibold">Mount:</span> {item.mount || '—'}</div>
                        <div><span className="font-semibold">Colour:</span> {item.fabric || '—'}</div>
                        <div><span className="font-semibold">Collection:</span> {item.collection || '—'}</div>
                        <div><span className="font-semibold">Created By:</span> {(order as any).dealerName || '—'}</div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-300 my-1.5" />

                      {/* Bottom section */}
                      <div className="flex items-end justify-between">
                        <span className="font-bold text-red-600" style={{ fontSize: '13px' }}>{item.product}</span>
                        <div className="flex flex-col items-center gap-1">
                          <QRCode
                            value={qrData}
                            size={72}
                            style={{ height: 72, width: 72 }}
                          />
                          <span className="font-mono" style={{ fontSize: '9px' }}>{barcodeVal}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Uploads Tab */}
        <TabsContent value="uploads">
          <Card>
            <CardHeader>
              <CardTitle>Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={uploadCategory} onValueChange={(v) => setUploadCategory(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="packing">Packing</TabsTrigger>
                  <TabsTrigger value="installation">Installation</TabsTrigger>
                  <TabsTrigger value="jobsite">Job Site</TabsTrigger>
                </TabsList>

                {(['packing', 'installation', 'jobsite'] as const).map((cat) => {
                  const catImages = normalizedImages.filter(img => img.category === cat)
                  const inputId = `upload-${cat}`
                  return (
                    <TabsContent key={cat} value={cat} className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id={inputId}
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUploadWithCategory(e, cat)}
                        />
                        <input
                          type="file"
                          id={`${inputId}-camera`}
                          className="hidden"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleFileUploadWithCategory(e, cat)}
                        />
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <label htmlFor={inputId}>
                            <Button type="button" size="sm" disabled={uploading} asChild>
                              <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                            </Button>
                          </label>
                          <label htmlFor={`${inputId}-camera`}>
                            <Button type="button" size="sm" variant="outline" disabled={uploading} asChild>
                              <span>📷 Take Photo</span>
                            </Button>
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Images or PDF</p>
                      </div>
                      {catImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {catImages.map((img, idx) => (
                            <a
                              key={idx}
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg border overflow-hidden hover:opacity-90"
                            >
                              {img.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={img.url} alt={`${cat} ${idx + 1}`} className="w-full aspect-square object-cover" />
                              ) : (
                                <div className="aspect-square bg-muted flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No files uploaded here yet.</p>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <div className="space-y-4">
            {/* Add note */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-3">
                <PenLine className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Add Note</h3>
              </div>
              <Textarea
                placeholder="Write a note visible to all team members…"
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="resize-none text-sm"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">Saved with your name and timestamp</p>
                <Button size="sm" onClick={addNote} disabled={!newNote.trim() || saving === 'note'} className="bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs">
                  {saving === 'note' ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Adding…</> : 'Add Note'}
                </Button>
              </div>
            </div>

            {/* Filters */}
            {order.orderNotes && order.orderNotes.length > 0 && (() => {
              const uniqueUsers = Array.from(new Set(order.orderNotes.map(n => n.createdByName).filter(Boolean)))
              const now = new Date()
              const filtered = [...order.orderNotes].reverse().filter(note => {
                const matchSearch = !noteSearch || note.content.toLowerCase().includes(noteSearch.toLowerCase()) || note.createdByName?.toLowerCase().includes(noteSearch.toLowerCase())
                const matchUser = noteUserFilter === 'all' || note.createdByName === noteUserFilter
                let matchDate = true
                if (noteDateFilter === 'today') {
                  matchDate = format(note.createdAt, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
                } else if (noteDateFilter === 'week') {
                  matchDate = (now.getTime() - note.createdAt.getTime()) < 7 * 86400 * 1000
                } else if (noteDateFilter === 'month') {
                  matchDate = (now.getTime() - note.createdAt.getTime()) < 30 * 86400 * 1000
                }
                return matchSearch && matchUser && matchDate
              })
              return (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Filter bar */}
                  <div className="flex items-center gap-2 p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex-wrap">
                    <div className="relative flex-1 min-w-[160px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input value={noteSearch} onChange={e => setNoteSearch(e.target.value)} placeholder="Search notes…" className="h-8 pl-8 text-xs bg-white dark:bg-gray-700" />
                    </div>
                    <Select value={noteUserFilter} onValueChange={setNoteUserFilter}>
                      <SelectTrigger className="h-8 w-36 text-xs bg-white dark:bg-gray-700">
                        <User2 className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <SelectValue placeholder="All users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        {uniqueUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={noteDateFilter} onValueChange={setNoteDateFilter}>
                      <SelectTrigger className="h-8 w-36 text-xs bg-white dark:bg-gray-700">
                        <CalendarDays className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        <SelectValue placeholder="Any time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-400 ml-auto">{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Notes list */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No notes match your filters.</p>
                    ) : filtered.map((note) => (
                      <div key={note._id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        <div className="flex items-center gap-3 mt-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[9px] font-bold text-amber-700 dark:text-amber-400">
                              {(note.createdByName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{note.createdByName || 'Unknown'}</span>
                          </div>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-xs text-gray-400">{format(note.createdAt, 'MMM d, yyyy')}</span>
                          <span className="text-xs text-gray-400">{format(note.createdAt, 'h:mm a')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
            {(!order.orderNotes || order.orderNotes.length === 0) && (
              <div className="text-center py-10 text-muted-foreground text-sm">No notes yet. Add one above.</div>
            )}
          </div>
        </TabsContent>

        {/* Cut Piece Tab */}
        <TabsContent value="cut-piece">
          <Card>
            <CardHeader>
              <CardTitle>Cut Pieces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button onClick={addCutPiece} className="gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Add Cut Piece
                  </Button>
                  {cutPieces.length > 0 && (
                    <Button onClick={saveCutPieces} size="sm" variant="outline" disabled={saving === 'cutPieces'}>
                      {saving === 'cutPieces' ? 'Saving...' : 'Save Cut Pieces'}
                    </Button>
                  )}
                </div>
                {cutPieces.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fabric</TableHead>
                        <TableHead>Width</TableHead>
                        <TableHead>Length</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cutPieces.map((piece, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {fabricOptions.length > 0 ? (
                              <Select
                                value={piece.fabric}
                                onValueChange={(value) => {
                                  const updated = [...cutPieces]
                                  updated[idx].fabric = value
                                  setCutPieces(updated)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select fabric" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fabricOptions.map((f) => (
                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={piece.fabric}
                                onChange={(e) => {
                                  const updated = [...cutPieces]
                                  updated[idx].fabric = e.target.value
                                  setCutPieces(updated)
                                }}
                                placeholder="Fabric name"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={piece.width || ''}
                              onChange={(e) => {
                                const updated = [...cutPieces]
                                updated[idx].width = parseFloat(e.target.value) || 0
                                setCutPieces(updated)
                              }}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={piece.length || ''}
                              onChange={(e) => {
                                const updated = [...cutPieces]
                                updated[idx].length = parseFloat(e.target.value) || 0
                                setCutPieces(updated)
                              }}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCutPiece(idx)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOM Tab */}
        <TabsContent value="bom">
          <Card>
            <CardHeader>
              <CardTitle>Bill of Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button onClick={addBOMItem} className="gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                  {bomItems.length > 0 && (
                    <Button onClick={saveBOM} size="sm" variant="outline" disabled={saving === 'bom'}>
                      {saving === 'bom' ? 'Saving...' : 'Save BOM'}
                    </Button>
                  )}
                </div>
                {bomItems.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supply</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bomItems.map((item, idx) => {
                        const selectedInventoryItem = inventoryItems.find(inv => inv._id === item.supplyId)
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Select
                                value={item.supplyId || ''}
                                onValueChange={(value) => handleBOMItemSelect(idx, value)}
                              >
                                <SelectTrigger className="w-[250px]">
                                  <SelectValue placeholder="Select from inventory">
                                    {item.supplyName || 'Select from inventory'}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {inventoryItems.map((inv) => (
                                    <SelectItem key={inv._id} value={inv._id}>
                                      {inv.name} ({inv.quantity} {inv.unit} available)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                className="mt-1 w-[250px]"
                                placeholder="Or type supply name"
                                value={item.supplyName || ''}
                                onChange={(e) => {
                                  const updated = [...bomItems]
                                  updated[idx] = { ...updated[idx], supplyId: '', supplyName: e.target.value }
                                  setBomItems(updated)
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {item.availableQuantity !== undefined ? (
                                <span className="text-sm text-muted-foreground">
                                  {item.availableQuantity} {item.unit}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const updated = [...bomItems]
                                  updated[idx].quantity = parseFloat(e.target.value) || 0
                                  setBomItems(updated)
                                }}
                                className="w-32"
                                min="0"
                                max={item.availableQuantity}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={item.unit}
                                onChange={(e) => {
                                  const updated = [...bomItems]
                                  updated[idx].unit = e.target.value
                                  setBomItems(updated)
                                }}
                                placeholder="Unit"
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBOMItem(idx)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping">
          <div className="space-y-4">
            {/* Delivery Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Delivery Method</h3>
              <div className="flex items-center gap-3 flex-wrap mb-3">
                {(['INSTALLATION', 'PICKUP', 'SHIPPING'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => { setDeliveryMethod(method); saveDeliveryMethod(method) }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      deliveryMethod === method
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {method === 'INSTALLATION' ? '🔧 Installation' : method === 'PICKUP' ? '🏪 Pickup' : '📦 Shipping'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {deliveryMethod === 'INSTALLATION' && 'Order will be installed by the team.'}
                {deliveryMethod === 'PICKUP' && 'Customer or dealer will pick up from the facility.'}
                {deliveryMethod === 'SHIPPING' && 'Order will be shipped. Add box dimensions below for Pirate Ship.'}
              </p>
            </div>

            {/* Installation Details — shown when method is INSTALLATION */}
            {deliveryMethod === 'INSTALLATION' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Installation Details</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Installation Date</label>
                      <Input
                        type="date"
                        value={installCompletedDate}
                        onChange={e => setInstallCompletedDate(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Installer Name</label>
                      <Input
                        value={installerName}
                        onChange={e => setInstallerName(e.target.value)}
                        placeholder="Technician name"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Notes</label>
                      <Input
                        value={installNotes}
                        onChange={e => setInstallNotes(e.target.value)}
                        placeholder="Any notes about the installation"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Customer Signature */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Customer Signature</label>
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/30 overflow-hidden">
                      {installSignature ? (
                        <div className="relative">
                          <img src={installSignature} alt="Customer signature" className="w-full h-32 object-contain bg-white" />
                          <button
                            onClick={() => setInstallSignature(null)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <SignatureCanvas
                            ref={installSignatureRef}
                            penColor="#1a1a1a"
                            canvasProps={{ className: 'w-full h-32 bg-white', style: { width: '100%', height: 128 } }}
                          />
                          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-400">Sign above</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => installSignatureRef.current?.clear()}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 bg-white"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => {
                                  if (installSignatureRef.current && !installSignatureRef.current.isEmpty()) {
                                    setInstallSignature(installSignatureRef.current.toDataURL())
                                  }
                                }}
                                className="text-xs text-white bg-amber-500 hover:bg-amber-600 px-2 py-1 rounded"
                              >
                                Save Signature
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo upload */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Installation Photos</label>
                    <div className="flex gap-3 flex-wrap">
                      <input type="file" id="install-photo-upload" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileUploadWithCategory(e, 'installation')} />
                      <input type="file" id="install-photo-camera" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleFileUploadWithCategory(e, 'installation')} />
                      <label htmlFor="install-photo-upload">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
                          <Upload className="h-4 w-4" /> Upload Photo
                        </div>
                      </label>
                      <label htmlFor="install-photo-camera">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700 cursor-pointer hover:bg-amber-100 transition-colors">
                          <Camera className="h-4 w-4" /> Take Photo
                        </div>
                      </label>
                    </div>
                    {normalizedImages.filter(i => i.category === 'installation').length > 0 && (
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-3">
                        {normalizedImages.filter(i => i.category === 'installation').map((img, idx) => (
                          <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border overflow-hidden hover:opacity-90 aspect-square">
                            <img src={img.url} alt={`Install ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {(installSignature || installCompletedDate || installerName) && (
                    <div className="flex justify-end">
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white gap-2 h-8 text-xs" disabled={savingSignature}>
                        {savingSignature ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Save Installation Record
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Signature */}
            {deliveryMethod === 'PICKUP' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
                  <PenLine className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Pickup Confirmation</h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Pickup Date</label>
                      <Input type="date" className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Picked Up By</label>
                      <Input placeholder="Name of person picking up" className="h-9 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Customer Signature</label>
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/30 overflow-hidden">
                      {shippingSignature ? (
                        <div className="relative">
                          <img src={shippingSignature} alt="Signature" className="w-full h-32 object-contain bg-white" />
                          <button onClick={() => setShippingSignature(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <SignatureCanvas
                            ref={shippingSignatureRef}
                            penColor="#1a1a1a"
                            canvasProps={{ className: 'w-full h-32 bg-white', style: { width: '100%', height: 128 } }}
                          />
                          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                            <p className="text-xs text-gray-400">Sign above</p>
                            <div className="flex gap-2">
                              <button onClick={() => shippingSignatureRef.current?.clear()} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 bg-white">Clear</button>
                              <button onClick={() => { if (shippingSignatureRef.current && !shippingSignatureRef.current.isEmpty()) setShippingSignature(shippingSignatureRef.current.toDataURL()) }} className="text-xs text-white bg-amber-500 hover:bg-amber-600 px-2 py-1 rounded">Save</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Pickup Photos</label>
                    <div className="flex gap-3 flex-wrap">
                      <input type="file" id="pickup-photo-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUploadWithCategory(e, 'packing')} />
                      <input type="file" id="pickup-photo-camera" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleFileUploadWithCategory(e, 'packing')} />
                      <label htmlFor="pickup-photo-upload"><div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 cursor-pointer hover:bg-gray-50"><Upload className="h-4 w-4" /> Upload</div></label>
                      <label htmlFor="pickup-photo-camera"><div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700 cursor-pointer hover:bg-amber-100"><Camera className="h-4 w-4" /> Take Photo</div></label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Boxes — shown when method is SHIPPING */}
            {deliveryMethod === 'SHIPPING' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Package Dimensions</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {shippingBoxes.length > 0 && (
                      <>
                        <Button onClick={downloadShippingCSV} size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                          <FileText className="h-3.5 w-3.5" /> Pirate Ship CSV
                        </Button>
                        <Button onClick={saveShipping} size="sm" variant="outline" disabled={saving === 'shipping'} className="h-8 text-xs">
                          {saving === 'shipping' ? 'Saving...' : 'Save'}
                        </Button>
                      </>
                    )}
                    <Button onClick={addShippingBox} size="sm" className="gap-1.5 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white">
                      <Plus className="h-3.5 w-3.5" /> Add Box
                    </Button>
                  </div>
                </div>
                {/* Tracking info */}
                <div className="px-5 pt-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tracking Number</label>
                      <div className="flex gap-2">
                        <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g. 1Z999AA10123456784" className="h-9 text-sm flex-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Airway Bill / AWB #</label>
                      <Input value={airwayBillNumber} onChange={e => setAirwayBillNumber(e.target.value)} placeholder="e.g. 123-45678901" className="h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ship Date</label>
                      <Input type="date" value={shippingDate} onChange={e => setShippingDate(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                  {(trackingNumber || airwayBillNumber) && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input value={trackingSearch} onChange={e => setTrackingSearch(e.target.value)} placeholder="Search tracking / AWB…" className="h-8 pl-8 text-xs" />
                      </div>
                      {trackingSearch && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          trackingNumber.includes(trackingSearch) || airwayBillNumber.includes(trackingSearch)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {trackingNumber.includes(trackingSearch) || airwayBillNumber.includes(trackingSearch) ? '✓ Found' : 'Not found'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {shippingBoxes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No boxes added yet. Click "Add Box" to start.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-700/50">
                          <TableHead className="text-xs">Box #</TableHead>
                          <TableHead className="text-xs">Length (in)</TableHead>
                          <TableHead className="text-xs">Width (in)</TableHead>
                          <TableHead className="text-xs">Height (in)</TableHead>
                          <TableHead className="text-xs">Weight (lbs)</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shippingBoxes.map((box, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm font-medium text-muted-foreground">Box {idx + 1}</TableCell>
                            <TableCell><Input type="number" value={box.length || ''} onChange={(e) => { const u = [...shippingBoxes]; u[idx].length = parseFloat(e.target.value) || 0; setShippingBoxes(u) }} onBlur={() => saveShippingQuiet()} className="w-24 h-8 text-sm" placeholder="0" /></TableCell>
                            <TableCell><Input type="number" value={box.width || ''} onChange={(e) => { const u = [...shippingBoxes]; u[idx].width = parseFloat(e.target.value) || 0; setShippingBoxes(u) }} onBlur={() => saveShippingQuiet()} className="w-24 h-8 text-sm" placeholder="0" /></TableCell>
                            <TableCell><Input type="number" value={box.height || ''} onChange={(e) => { const u = [...shippingBoxes]; u[idx].height = parseFloat(e.target.value) || 0; setShippingBoxes(u) }} onBlur={() => saveShippingQuiet()} className="w-24 h-8 text-sm" placeholder="0" /></TableCell>
                            <TableCell><Input type="number" value={box.weight || ''} onChange={(e) => { const u = [...shippingBoxes]; u[idx].weight = parseFloat(e.target.value) || 0; setShippingBoxes(u) }} onBlur={() => saveShippingQuiet()} className="w-24 h-8 text-sm" placeholder="0" /></TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => { const u = shippingBoxes.filter((_, i) => i !== idx); setShippingBoxes(u); saveShippingQuiet(u) }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Shipping signature */}
                <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <label className="text-xs font-medium text-gray-500 block">Customer Signature on Receipt</label>
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 overflow-hidden max-w-md">
                    {shippingSignature ? (
                      <div className="relative">
                        <img src={shippingSignature} alt="Signature" className="w-full h-28 object-contain bg-white" />
                        <button onClick={() => setShippingSignature(null)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <div>
                        <SignatureCanvas ref={shippingSignatureRef} penColor="#1a1a1a" canvasProps={{ className: 'w-full bg-white', style: { width: '100%', height: 112 } }} />
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                          <p className="text-xs text-gray-400">Sign above</p>
                          <div className="flex gap-2">
                            <button onClick={() => shippingSignatureRef.current?.clear()} className="text-xs text-gray-500 px-2 py-1 rounded border border-gray-200 bg-white">Clear</button>
                            <button onClick={() => { if (shippingSignatureRef.current && !shippingSignatureRef.current.isEmpty()) setShippingSignature(shippingSignatureRef.current.toDataURL()) }} className="text-xs text-white bg-amber-500 hover:bg-amber-600 px-2 py-1 rounded">Save</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Shipping Photos</label>
                    <div className="flex gap-3 flex-wrap">
                      <input type="file" id="ship-photo-upload" className="hidden" accept="image/*" onChange={(e) => handleFileUploadWithCategory(e, 'packing')} />
                      <input type="file" id="ship-photo-camera" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleFileUploadWithCategory(e, 'packing')} />
                      <label htmlFor="ship-photo-upload"><div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 cursor-pointer hover:bg-gray-50"><Upload className="h-4 w-4" /> Upload</div></label>
                      <label htmlFor="ship-photo-camera"><div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700 cursor-pointer hover:bg-amber-100"><Camera className="h-4 w-4" /> Take Photo</div></label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
             
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.activity && order.activity.length > 0 ? (
                  [...order.activity].reverse().map((log, idx) => (
                    <div key={log._id || `activity-${idx}`} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          <span className="text-amber-600 dark:text-amber-400">{log.userName || log.user}</span>
                          {' — '}{log.action}
                        </p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(log.timestamp, 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

