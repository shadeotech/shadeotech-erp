'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Upload, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Package,
  Truck,
  CheckCircle2,
  Clock,
  X,
  Hand,
  Camera,
  MoreHorizontal,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

// Mock data for orders ready for installation
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'James Smith',
    sideMark: 'SH-R-MT12345',
    orderDate: new Date('2024-01-20'),
    installationDate: new Date('2024-02-15'),
    items: [
      { id: '1', product: 'Roller Shade', quantity: 3, addOns: 'Motorized, Smart Hub' },
      { id: '2', product: 'Roman Shade', quantity: 2, addOns: 'Solar/Wind Sensor' },
    ],
    status: 'ready_for_installation' as const,
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Molly Thomson',
    sideMark: 'SH-C-GL67890',
    orderDate: new Date('2024-01-22'),
    installationDate: new Date('2024-02-18'),
    items: [
      { id: '1', product: 'Cellular Shade', quantity: 5, addOns: 'None' },
    ],
    status: 'ready_for_installation' as const,
  },
]

// Mock data for shipments
const mockShipments = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'James Smith',
    sideMark: 'SH-R-MT12345',
    courier: 'FedEx',
    trackingNumber: 'FX1234567890',
    shippedDate: new Date('2024-02-10'),
    estimatedDelivery: new Date('2024-02-15'),
    status: 'in_transit' as const,
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Molly Thomson',
    sideMark: 'SH-C-GL67890',
    courier: 'UPS',
    trackingNumber: 'UPS9876543210',
    shippedDate: new Date('2024-02-12'),
    estimatedDelivery: new Date('2024-02-18'),
    status: 'delivered' as const,
  },
]

// Mock data for pick up orders
const mockPickUpOrders = [
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'Robert Wilson',
    sideMark: 'SH-R-WS11111',
    orderDate: new Date('2024-01-25'),
    pickUpDate: new Date('2024-02-20'),
    items: [
      { id: '1', product: 'Zebra Blinds', quantity: 4, addOns: 'Cordless' },
    ],
    status: 'ready_for_pickup' as const,
  },
  {
    id: '4',
    orderNumber: 'ORD-004',
    customerName: 'Emily Brown',
    sideMark: 'SH-C-EB22222',
    orderDate: new Date('2024-01-28'),
    pickUpDate: new Date('2024-02-22'),
    items: [
      { id: '1', product: 'Roller Shade', quantity: 2, addOns: 'Motorized' },
      { id: '2', product: 'Roman Shade', quantity: 3, addOns: 'None' },
    ],
    status: 'ready_for_pickup' as const,
  },
]

interface ServiceNote {
  id: string
  date: Date
  technician: string
  orderNumber: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'
}

export default function DeliveryInstallationPage() {
  const [activeTab, setActiveTab] = useState<'delivery' | 'shipment' | 'pickup' | 'service'>('delivery')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [installationNotePreviewOpen, setInstallationNotePreviewOpen] = useState(false)
  const [installationNoteOpen, setInstallationNoteOpen] = useState(false)
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null)
  const [pickUpNoteOpen, setPickUpNoteOpen] = useState(false)
  const [selectedPickUpOrder, setSelectedPickUpOrder] = useState<string | null>(null)
  // Service notes
  const [serviceNotes, setServiceNotes] = useState<ServiceNote[]>([])
  const [serviceNoteOpen, setServiceNoteOpen] = useState(false)
  const [snTechnician, setSnTechnician] = useState('')
  const [snOrderNumber, setSnOrderNumber] = useState('')
  const [snDescription, setSnDescription] = useState('')
  const [snStatus, setSnStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'COMPLETED'>('OPEN')

  // Mock installation note data
  const [installationNotes, setInstallationNotes] = useState<Record<string, {
    signature: string
    signedAt: Date | null
    images: string[]
    notes: string
  }>>({})

  // Mock shipment data
  const [shipments, setShipments] = useState<Record<string, {
    courierLabel: string | null
    courierName: string
    trackingNumber: string
    images: string[]
  }>>({})

  // Mock pick up note data
  const [pickUpNotes, setPickUpNotes] = useState<Record<string, {
    signature: string
    signedAt: Date | null
    images: string[]
    notes: string
  }>>({})

  const selectedOrderData = mockOrders.find(o => o.id === selectedOrder)
  const selectedShipmentData = mockShipments.find(s => s.id === selectedShipment)
  const selectedPickUpOrderData = mockPickUpOrders.find(o => o.id === selectedPickUpOrder)

  const handleOpenInstallationNotePreview = (orderId: string) => {
    setSelectedOrder(orderId)
    setInstallationNotePreviewOpen(true)
  }

  const handleContinueToInstallationNote = () => {
    setInstallationNotePreviewOpen(false)
    setInstallationNoteOpen(true)
  }

  const handleSaveInstallationNote = () => {
    if (!selectedOrder) return
    
    setInstallationNotes(prev => ({
      ...prev,
      [selectedOrder]: {
        signature: prev[selectedOrder]?.signature || '',
        signedAt: prev[selectedOrder]?.signedAt || null,
        images: prev[selectedOrder]?.images || [],
        notes: prev[selectedOrder]?.notes || '',
      }
    }))
    setInstallationNoteOpen(false)
  }

  const handleCustomerSign = () => {
    if (!selectedOrder) return
    
    setInstallationNotes(prev => ({
      ...prev,
      [selectedOrder]: {
        ...prev[selectedOrder],
        signature: 'Customer Signature',
        signedAt: new Date(),
      }
    }))
  }

  const handleOpenShipment = (shipmentId: string) => {
    setSelectedShipment(shipmentId)
    setShipmentDialogOpen(true)
  }

  const handleGeneratePickUpNote = (orderId: string) => {
    setSelectedPickUpOrder(orderId)
    setPickUpNoteOpen(true)
  }

  const buildDeliveryNoteHtml = (order: typeof mockOrders[0], type: 'installation' | 'pickup') => {
    const title = type === 'installation' ? 'Installation Note' : 'Pick Up Note'
    const confirmText = type === 'installation'
      ? 'I hereby confirm that the installation has been completed satisfactorily. All items have been installed as per the order specifications and I am satisfied with the workmanship.'
      : 'I hereby confirm that I have received the above items in good condition. All items have been checked and verified. I acknowledge receipt of the complete order.'
    const rows = order.items.map((item, i) =>
      `<tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:8px">${i + 1}</td>
        <td style="padding:8px">${item.product}</td>
        <td style="padding:8px;text-align:center">${item.quantity}</td>
        <td style="padding:8px">${item.addOns}</td>
      </tr>`
    ).join('')
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;color:#111;margin:0;padding:32px;font-size:13px}
    h1{font-size:20px;font-weight:bold;margin:0}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #92400e}
    .logo-area{font-size:11px;color:#555;line-height:1.6}
    .amber{color:#92400e;font-weight:bold}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{background:#fef3c7;padding:8px;text-align:left;font-weight:600;border-bottom:2px solid #92400e}
    td{padding:8px;vertical-align:top}
    .sig-box{border:2px dashed #d1d5db;border-radius:8px;height:80px;margin-top:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px}
    @media print{body{padding:16px}}</style></head><body>
    <div class="header">
      <div>
        <h1 class="amber">${title}</h1>
        <div class="logo-area" style="margin-top:8px">
          <p>Shadeotech | 3333 Earhart Dr, Unit 240, Carrollton TX 75006</p>
          <p>Tel: 469-499-3322 | info@shadeotech.com</p>
        </div>
      </div>
      <div style="text-align:right;font-size:12px;color:#555;line-height:1.8">
        <p><b>Order:</b> ${order.orderNumber}</p>
        <p><b>Customer:</b> ${order.customerName}</p>
        <p><b>Side Mark:</b> ${order.sideMark}</p>
        <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
    <table><thead><tr><th style="width:40px">#</th><th>Product</th><th style="width:60px;text-align:center">Qty</th><th>Add-ons</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div style="margin-top:24px;padding:12px;background:#fef9f0;border-left:4px solid #d97706;border-radius:4px;font-size:12px;color:#555">
      <b style="color:#111">Confirmation:</b> ${confirmText}
    </div>
    <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
      <div>
        <p style="font-weight:600;margin-bottom:4px">Customer Signature</p>
        <div class="sig-box">Sign here</div>
        <p style="font-size:11px;color:#9ca3af;margin-top:4px">Date: _______________</p>
      </div>
      <div>
        <p style="font-weight:600;margin-bottom:4px">Staff Signature</p>
        <div class="sig-box">Sign here</div>
        <p style="font-size:11px;color:#9ca3af;margin-top:4px">Date: _______________</p>
      </div>
    </div>
    <script>window.onload=()=>window.print()</script></body></html>`
  }

  const handlePrintDeliveryNote = (orderId: string, type: 'installation' | 'pickup') => {
    const order = type === 'installation'
      ? mockOrders.find(o => o.id === orderId)
      : mockPickUpOrders.find(o => o.id === orderId)
    if (!order) return
    const html = buildDeliveryNoteHtml(order as any, type)
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  const handleSaveServiceNote = () => {
    if (!snTechnician || !snDescription) return
    const newNote: ServiceNote = {
      id: Date.now().toString(),
      date: new Date(),
      technician: snTechnician,
      orderNumber: snOrderNumber,
      description: snDescription,
      status: snStatus,
    }
    setServiceNotes(prev => [newNote, ...prev])
    setSnTechnician('')
    setSnOrderNumber('')
    setSnDescription('')
    setSnStatus('OPEN')
    setServiceNoteOpen(false)
  }

  const handleSavePickUpNote = () => {
    if (!selectedPickUpOrder) return
    
    setPickUpNotes(prev => ({
      ...prev,
      [selectedPickUpOrder]: {
        signature: prev[selectedPickUpOrder]?.signature || '',
        signedAt: prev[selectedPickUpOrder]?.signedAt || null,
        images: prev[selectedPickUpOrder]?.images || [],
        notes: prev[selectedPickUpOrder]?.notes || '',
      }
    }))
    setPickUpNoteOpen(false)
  }

  const handleCustomerSignPickUp = () => {
    if (!selectedPickUpOrder) return
    
    setPickUpNotes(prev => ({
      ...prev,
      [selectedPickUpOrder]: {
        ...prev[selectedPickUpOrder],
        signature: 'Customer Signature',
        signedAt: new Date(),
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Delivery & Installation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage delivery notes, installations, and shipments
          </p>
        </div>
      </div>

      {/* Stat blocks */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ready for Installation', value: mockOrders.length,        border: '#3B82F6' },
          { label: 'In Transit',             value: mockShipments.filter(s => s.status === 'in_transit').length, border: '#F97316' },
          { label: 'Delivered',              value: mockShipments.filter(s => s.status === 'delivered').length,  border: '#10B981' },
          { label: 'Awaiting Pick Up',       value: mockPickUpOrders.length,   border: '#8B5CF6' },
        ].map(({ label, value, border }) => (
          <div
            key={label}
            className="rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
            style={{ borderLeftWidth: 4, borderLeftColor: border }}
          >
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b dark:border-gray-700">
        {([
          { key: 'delivery', label: 'Delivery Note' },
          { key: 'shipment', label: 'Shipment' },
          { key: 'pickup', label: 'Pick Up' },
          { key: 'service', label: 'Service Note' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Delivery Note Tab */}
      {activeTab === 'delivery' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders Ready for Installation</CardTitle>
              <CardDescription>
                Generate installation notes for orders that are ready for installation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Side Mark</TableHead>
                    <TableHead>Installation Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrders.map((order) => {
                    const hasNote = installationNotes[order.id]
                    const isSigned = hasNote?.signedAt
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.sideMark}</TableCell>
                        <TableCell>{format(order.installationDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell>
                          {isSigned ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Signed
                            </Badge>
                          ) : hasNote ? (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Signature
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Generated</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open actions menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenInstallationNotePreview(order.id)}>
                                <FileText className="w-4 h-4 mr-2" />
                                {hasNote ? 'View/Edit Note' : 'Generate Note'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintDeliveryNote(order.id, 'installation')}>
                                <Download className="w-4 h-4 mr-2" />
                                Print Note
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/production/orders/${order.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Order
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Installation Note Preview Dialog */}
          <Dialog open={installationNotePreviewOpen} onOpenChange={setInstallationNotePreviewOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Preview – Installation Note</DialogTitle>
                <DialogDescription>
                  Review order details before generating the installation note
                </DialogDescription>
              </DialogHeader>

              {selectedOrderData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Order</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedOrderData.orderNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Customer</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedOrderData.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Side Mark</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedOrderData.sideMark}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Installation Date</span>
                      <p className="font-medium text-gray-900 dark:text-white">{format(selectedOrderData.installationDate, 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Ordered Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Add-ons</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrderData.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.addOns}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Confirmation text (preview)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 rounded-md bg-gray-50 dark:bg-gray-800/50 p-3">
                      I hereby confirm that the installation has been completed satisfactorily. All items have been installed as per the order specifications and I am satisfied with the workmanship.
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setInstallationNotePreviewOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleContinueToInstallationNote}>
                  Generate Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Installation Note Dialog */}
          <Dialog open={installationNoteOpen} onOpenChange={setInstallationNoteOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Installation Note - {selectedOrderData?.orderNumber}</DialogTitle>
                <DialogDescription>
                  Installation note for {selectedOrderData?.customerName}
                </DialogDescription>
              </DialogHeader>

              {selectedOrderData && (
                <div className="space-y-6">
                  {/* Order Items List */}
                  <div>
                    <h3 className="font-semibold mb-3">Ordered Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Add-ons</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrderData.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.addOns}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Installation Confirmation Text */}
                  <div>
                    <Label>Installation Confirmation Text</Label>
                    <Textarea
                      className="mt-2"
                      rows={4}
                      defaultValue="I hereby confirm that the installation has been completed satisfactorily. All items have been installed as per the order specifications and I am satisfied with the workmanship."
                      readOnly
                    />
                  </div>

                  {/* Customer Signature Section */}
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">Customer Signature</Label>
                    <div className="mt-3 space-y-4">
                      {installationNotes[selectedOrderData.id]?.signedAt ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Installation Confirmed</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Signed by: {installationNotes[selectedOrderData.id]?.signature}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Signed at: {format(installationNotes[selectedOrderData.id]?.signedAt!, 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Customer signature will appear here once signed
                          </p>
                          <Button onClick={handleCustomerSign} variant="outline">
                            Simulate Customer Signature
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Installation Images Upload */}
                  <div>
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">Installation Images</Label>
                    <div className="mt-3 space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center dark:border-gray-700">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                          <Camera className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          Upload installation images or take a picture
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          These images will be visible in customer details
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Images
                          </Button>
                          <Button variant="outline" size="sm">
                            <Camera className="mr-2 h-4 w-4" />
                            Take Picture
                          </Button>
                        </div>
                      </div>

                      {/* Mock uploaded images */}
                      {installationNotes[selectedOrderData.id]?.images && installationNotes[selectedOrderData.id].images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {installationNotes[selectedOrderData.id].images.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                              </div>
                              <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setInstallationNoteOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => selectedOrder && handlePrintDeliveryNote(selectedOrder, 'installation')}>
                  <Download className="mr-2 h-4 w-4" />
                  Print / Save PDF
                </Button>
                <Button onClick={handleSaveInstallationNote}>
                  Save Note
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Shipment Tab */}
      {activeTab === 'shipment' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipments</CardTitle>
              <CardDescription>
                Manage courier information, tracking, and packing lists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Side Mark</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Shipped Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.orderNumber}</TableCell>
                      <TableCell>{shipment.customerName}</TableCell>
                      <TableCell>{shipment.sideMark}</TableCell>
                      <TableCell>{shipment.courier}</TableCell>
                      <TableCell>{shipment.trackingNumber}</TableCell>
                      <TableCell>{format(shipment.shippedDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            shipment.status === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }
                        >
                          {shipment.status === 'delivered' ? 'Delivered' : 'In Transit'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenShipment(shipment.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Shipment Details Dialog */}
          <Dialog open={shipmentDialogOpen} onOpenChange={setShipmentDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Shipment Details - {selectedShipmentData?.orderNumber}</DialogTitle>
                <DialogDescription>
                  Manage courier information and packing list for {selectedShipmentData?.customerName}
                </DialogDescription>
              </DialogHeader>

              {selectedShipmentData && (
                <div className="space-y-6">
                  {/* Courier Information */}
                  <div>
                    <h3 className="font-semibold mb-3">Courier Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Courier Name</Label>
                        <Select defaultValue={selectedShipmentData.courier}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FedEx">FedEx</SelectItem>
                            <SelectItem value="UPS">UPS</SelectItem>
                            <SelectItem value="DHL">DHL</SelectItem>
                            <SelectItem value="USPS">USPS</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tracking Number</Label>
                        <Input
                          className="mt-2"
                          defaultValue={selectedShipmentData.trackingNumber}
                          placeholder="Enter tracking number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Courier Label Upload */}
                  <div>
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">Courier Label</Label>
                    <div className="mt-3">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center dark:border-gray-700">
                        <Upload className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          Upload courier label image
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          This will be visible in customer details
                        </p>
                        <Button className="mt-4" variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Label
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Images Upload */}
                  <div>
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">Shipment Images</Label>
                    <div className="mt-3">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center dark:border-gray-700">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                          <Camera className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          Upload shipment images or take a picture
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          These images will be visible in customer details
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Images
                          </Button>
                          <Button variant="outline" size="sm">
                            <Camera className="mr-2 h-4 w-4" />
                            Take Picture
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Packing List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Packing List</h3>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">Order: {selectedShipmentData.orderNumber}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedShipmentData.customerName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">Shipped Date</p>
                              <p className="font-medium text-gray-900 dark:text-white">{format(selectedShipmentData.shippedDate, 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                          
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Add-ons</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mockOrders.find(o => o.orderNumber === selectedShipmentData.orderNumber)?.items.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{item.product}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.addOns}</TableCell>
                                  <TableCell>
                                    <Badge className="bg-green-100 text-green-700">Packed</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShipmentDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => setShipmentDialogOpen(false)}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Pick Up Tab */}
      {activeTab === 'pickup' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders Ready for Pick Up</CardTitle>
              <CardDescription>
                Generate pick up notes for orders that are ready for customer pick up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Side Mark</TableHead>
                    <TableHead>Pick Up Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPickUpOrders.map((order) => {
                    const hasNote = pickUpNotes[order.id]
                    const isSigned = hasNote?.signedAt
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.sideMark}</TableCell>
                        <TableCell>{format(order.pickUpDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell>
                          {isSigned ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Picked Up
                            </Badge>
                          ) : hasNote ? (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Pick Up
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Generated</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleGeneratePickUpNote(order.id)}
                          >
                            {hasNote ? 'View/Edit Note' : 'Generate Note'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pick Up Note Dialog */}
          <Dialog open={pickUpNoteOpen} onOpenChange={setPickUpNoteOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Pick Up Note - {selectedPickUpOrderData?.orderNumber}</DialogTitle>
                <DialogDescription>
                  Pick up note for {selectedPickUpOrderData?.customerName}
                </DialogDescription>
              </DialogHeader>

              {selectedPickUpOrderData && (
                <div className="space-y-6">
                  {/* Order Items List */}
                  <div>
                    <h3 className="font-semibold mb-3">Ordered Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Add-ons</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPickUpOrderData.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.addOns}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pick Up Confirmation Text */}
                  <div>
                    <Label>Pick Up Confirmation Text</Label>
                    <Textarea
                      className="mt-2"
                      rows={4}
                      defaultValue="I hereby confirm that I have received the above items in good condition. All items have been checked and verified as per the order specifications. I acknowledge receipt of the complete order and am satisfied with the condition of the products."
                      readOnly
                    />
                  </div>

                  {/* Customer Signature Section */}
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">Customer Signature</Label>
                    <div className="mt-3 space-y-4">
                      {pickUpNotes[selectedPickUpOrderData.id]?.signedAt ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Pick Up Confirmed</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Signed by: {pickUpNotes[selectedPickUpOrderData.id]?.signature}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Signed at: {format(pickUpNotes[selectedPickUpOrderData.id]?.signedAt!, 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Customer signature will appear here once signed
                          </p>
                          <Button onClick={handleCustomerSignPickUp} variant="outline">
                            Simulate Customer Signature
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pick Up Images Upload */}
                  <div>
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">Pick Up Images</Label>
                    <div className="mt-3 space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center dark:border-gray-700">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                          <Camera className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          Upload pick up images or take a picture
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          These images will be visible in customer details
                        </p>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Images
                          </Button>
                          <Button variant="outline" size="sm">
                            <Camera className="mr-2 h-4 w-4" />
                            Take Picture
                          </Button>
                        </div>
                      </div>

                      {/* Mock uploaded images */}
                      {pickUpNotes[selectedPickUpOrderData.id]?.images && pickUpNotes[selectedPickUpOrderData.id].images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {pickUpNotes[selectedPickUpOrderData.id].images.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                              </div>
                              <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setPickUpNoteOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleSavePickUpNote}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {/* Service Note Tab */}
      {activeTab === 'service' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Service Notes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Log service visits, repairs, and follow-up notes</p>
            </div>
            <Button onClick={() => setServiceNoteOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              New Service Note
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceNotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No service notes yet. Click "New Service Note" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  serviceNotes.map(note => (
                    <TableRow key={note.id}>
                      <TableCell className="text-muted-foreground">{format(note.date, 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">{note.orderNumber || '-'}</TableCell>
                      <TableCell>{note.technician}</TableCell>
                      <TableCell className="max-w-xs truncate">{note.description}</TableCell>
                      <TableCell>
                        <Badge className={
                          note.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                          note.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {note.status === 'IN_PROGRESS' ? 'In Progress' : note.status === 'COMPLETED' ? 'Completed' : 'Open'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* New Service Note Dialog */}
          <Dialog open={serviceNoteOpen} onOpenChange={setServiceNoteOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Service Note</DialogTitle>
                <DialogDescription>Log a service visit or follow-up action</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Technician Name *</Label>
                  <Input value={snTechnician} onChange={e => setSnTechnician(e.target.value)} placeholder="Enter technician name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Order Number</Label>
                  <Input value={snOrderNumber} onChange={e => setSnOrderNumber(e.target.value)} placeholder="e.g. ORD-001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={snStatus} onValueChange={(v: any) => setSnStatus(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Description *</Label>
                  <Textarea value={snDescription} onChange={e => setSnDescription(e.target.value)} rows={4} placeholder="Describe the service performed or issue addressed..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setServiceNoteOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveServiceNote} disabled={!snTechnician || !snDescription}>Save Note</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}

