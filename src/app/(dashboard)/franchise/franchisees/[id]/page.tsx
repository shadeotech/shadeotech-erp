'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ShieldCheck,
  Ban,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
  User,
} from 'lucide-react'
import { format } from 'date-fns'

type FranchiseeStatus = 'Active' | 'Inactive' | 'Pending'

interface ActivationEvent {
  id: string
  action: 'Activated' | 'Deactivated' | 'Pending'
  date: string
  by: string
  note: string
}

interface FranchiseeDetail {
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
  activationHistory: ActivationEvent[]
}

const MOCK_DATA: Record<string, FranchiseeDetail> = {
  '1': {
    id: '1', name: 'At Shades - Los Angeles', storeNumber: 'AS-001',
    owner: 'Emily Brown', email: 'emily@atshades-la.com', phone: '(555) 678-9012',
    location: 'Los Angeles, CA', state: 'CA', status: 'Active', quantity: 142,
    joinDate: '2021-03-15', territory: 'LA County West', notes: '',
    activationHistory: [
      { id: 'h1', action: 'Pending', date: '2021-02-10', by: 'System', note: 'Application submitted' },
      { id: 'h2', action: 'Activated', date: '2021-03-15', by: 'Admin', note: 'All documents verified, agreement signed' },
    ],
  },
  '2': {
    id: '2', name: 'At Shades - Orange County', storeNumber: 'AS-015',
    owner: 'Mike Williams', email: 'mike@atshades-oc.com', phone: '(555) 345-6789',
    location: 'Irvine, CA', state: 'CA', status: 'Active', quantity: 98,
    joinDate: '2022-07-01', territory: 'Orange County', notes: '',
    activationHistory: [
      { id: 'h1', action: 'Pending', date: '2022-05-20', by: 'System', note: 'Application submitted' },
      { id: 'h2', action: 'Activated', date: '2022-07-01', by: 'Admin', note: 'Onboarding complete' },
    ],
  },
  '3': {
    id: '3', name: 'At Shades - San Diego', storeNumber: 'AS-018',
    owner: 'Sarah Chen', email: 'sarah@atshades-sd.com', phone: '(555) 456-7890',
    location: 'San Diego, CA', state: 'CA', status: 'Pending', quantity: 0,
    joinDate: '2024-11-01', territory: 'San Diego County', notes: 'Awaiting final agreement signature',
    activationHistory: [
      { id: 'h1', action: 'Pending', date: '2024-11-01', by: 'System', note: 'Application submitted, awaiting signature' },
    ],
  },
  '4': {
    id: '4', name: 'At Shades - Phoenix', storeNumber: 'AS-021',
    owner: 'John Martinez', email: 'john@atshades-phx.com', phone: '(555) 567-8901',
    location: 'Phoenix, AZ', state: 'AZ', status: 'Active', quantity: 77,
    joinDate: '2022-01-20', territory: 'Maricopa County', notes: '',
    activationHistory: [
      { id: 'h1', action: 'Pending', date: '2021-12-01', by: 'System', note: 'Application submitted' },
      { id: 'h2', action: 'Activated', date: '2022-01-20', by: 'Admin', note: 'Initial activation' },
    ],
  },
  '5': {
    id: '5', name: 'At Shades - Dallas', storeNumber: 'AS-030',
    owner: 'Patricia Lee', email: 'patricia@atshades-dal.com', phone: '(555) 234-5678',
    location: 'Dallas, TX', state: 'TX', status: 'Inactive', quantity: 34,
    joinDate: '2020-06-10', territory: 'DFW Metroplex', notes: 'Suspended pending compliance review',
    activationHistory: [
      { id: 'h1', action: 'Pending', date: '2020-05-01', by: 'System', note: 'Application submitted' },
      { id: 'h2', action: 'Activated', date: '2020-06-10', by: 'Admin', note: 'Initial activation' },
      { id: 'h3', action: 'Deactivated', date: '2024-09-15', by: 'Admin', note: 'Suspended pending compliance review' },
    ],
  },
  '6': {
    id: '6', name: 'At Shades - Houston', storeNumber: 'AS-031',
    owner: 'Carlos Rivera', email: 'carlos@atshades-hou.com', phone: '(555) 123-4567',
    location: 'Houston, TX', state: 'TX', status: 'Pending', quantity: 0,
    joinDate: '2025-01-05', territory: 'Harris County', notes: 'Onboarding in progress',
    activationHistory: [
      { id: 'h1', action: 'Pending', date: '2025-01-05', by: 'System', note: 'Application submitted' },
    ],
  },
}

function statusStyle(status: FranchiseeStatus) {
  if (status === 'Active') return 'bg-green-500/10 text-green-600 border-0'
  if (status === 'Pending') return 'bg-amber-500/10 text-amber-600 border-0'
  return 'bg-slate-500/10 text-slate-500 border-0'
}

function historyIcon(action: ActivationEvent['action']) {
  if (action === 'Activated') return <CheckCircle2 className="h-4 w-4 text-green-600" />
  if (action === 'Deactivated') return <AlertCircle className="h-4 w-4 text-red-500" />
  return <Clock className="h-4 w-4 text-amber-500" />
}

export default function FranchiseeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [franchisee, setFranchisee] = useState<FranchiseeDetail | null>(null)
  const [editing, setEditing] = useState(searchParams.get('edit') === '1')
  const [editForm, setEditForm] = useState<Partial<FranchiseeDetail>>({})
  const [actionDialog, setActionDialog] = useState<'activate' | 'deactivate' | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [quantityInput, setQuantityInput] = useState('')

  useEffect(() => {
    const data = MOCK_DATA[id]
    if (data) {
      setFranchisee(data)
      setEditForm(data)
      setQuantityInput(data.quantity.toString())
    }
  }, [id])

  if (!franchisee) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Franchisee not found
      </div>
    )
  }

  const confirmAction = () => {
    if (!actionDialog) return
    const newStatus: FranchiseeStatus = actionDialog === 'activate' ? 'Active' : 'Inactive'
    const newEvent: ActivationEvent = {
      id: `h${Date.now()}`,
      action: actionDialog === 'activate' ? 'Activated' : 'Deactivated',
      date: new Date().toISOString().split('T')[0],
      by: 'Admin',
      note: actionNote.trim() || (actionDialog === 'activate' ? 'Manually activated' : 'Manually deactivated'),
    }
    setFranchisee(prev => prev ? {
      ...prev,
      status: newStatus,
      activationHistory: [...prev.activationHistory, newEvent],
    } : prev)
    setActionDialog(null)
    setActionNote('')
  }

  const saveEdit = () => {
    const qty = parseInt(quantityInput) || 0
    setFranchisee(prev => prev ? { ...prev, ...editForm, quantity: qty } : prev)
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/franchise/franchisees')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">{franchisee.name}</h2>
              <Badge variant="outline" className={statusStyle(franchisee.status)}>
                {franchisee.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {franchisee.storeNumber} · {franchisee.territory}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="mr-2 h-4 w-4" />Cancel
              </Button>
              <Button onClick={saveEdit}>
                <Save className="mr-2 h-4 w-4" />Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />Edit
              </Button>
              {franchisee.status !== 'Active' ? (
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setActionNote(''); setActionDialog('activate') }}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Activate
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => { setActionNote(''); setActionDialog('deactivate') }}>
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activation">Activation History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Key metrics */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />Units (Quantity)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-1.5">
                    <Input
                      type="number"
                      min={0}
                      value={quantityInput}
                      onChange={e => setQuantityInput(e.target.value)}
                      className="text-2xl font-semibold h-10"
                    />
                    <p className="text-xs text-muted-foreground">Total shade units managed</p>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-semibold">{franchisee.quantity.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total shade units managed</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />Member Since
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{format(new Date(franchisee.joinDate), 'MMM yyyy')}</div>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(franchisee.joinDate), 'MMMM d, yyyy')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />Territory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{franchisee.territory}</div>
                <p className="text-xs text-muted-foreground mt-1">{franchisee.location}</p>
              </CardContent>
            </Card>
          </div>

          {/* Details card */}
          <Card>
            <CardHeader>
              <CardTitle>Franchisee Details</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Store Name</Label>
                    <Input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Owner Name</Label>
                    <Input value={editForm.owner || ''} onChange={e => setEditForm(p => ({ ...p, owner: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location</Label>
                    <Input value={editForm.location || ''} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Territory</Label>
                    <Input value={editForm.territory || ''} onChange={e => setEditForm(p => ({ ...p, territory: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Internal Notes</Label>
                    <Textarea rows={3} value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Internal notes about this franchisee…" />
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {[
                    { icon: <Hash className="h-4 w-4" />, label: 'Store Number', value: franchisee.storeNumber },
                    { icon: <User className="h-4 w-4" />, label: 'Owner', value: franchisee.owner },
                    { icon: <Mail className="h-4 w-4" />, label: 'Email', value: <a href={`mailto:${franchisee.email}`} className="text-blue-600 hover:underline">{franchisee.email}</a> },
                    { icon: <Phone className="h-4 w-4" />, label: 'Phone', value: <a href={`tel:${franchisee.phone}`} className="text-blue-600 hover:underline">{franchisee.phone}</a> },
                    { icon: <MapPin className="h-4 w-4" />, label: 'Location', value: franchisee.location },
                    { icon: <MapPin className="h-4 w-4" />, label: 'Territory', value: franchisee.territory },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-4 py-3">
                      <div className="text-muted-foreground w-5 flex-shrink-0">{row.icon}</div>
                      <span className="text-sm text-muted-foreground w-28 flex-shrink-0">{row.label}</span>
                      <span className="text-sm font-medium">{row.value}</span>
                    </div>
                  ))}
                  {franchisee.notes && (
                    <div className="py-3">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{franchisee.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activation History Tab */}
        <TabsContent value="activation" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Activation History</CardTitle>
              <CardDescription>Full record of status changes for this franchise location</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Current status banner */}
              <div className={`rounded-lg border px-4 py-3 mb-6 flex items-center gap-3 ${
                franchisee.status === 'Active' ? 'bg-green-500/5 border-green-200' :
                franchisee.status === 'Pending' ? 'bg-amber-500/5 border-amber-200' :
                'bg-slate-500/5 border-slate-200'
              }`}>
                {franchisee.status === 'Active' && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                {franchisee.status === 'Pending' && <Clock className="h-5 w-5 text-amber-500 shrink-0" />}
                {franchisee.status === 'Inactive' && <AlertCircle className="h-5 w-5 text-slate-500 shrink-0" />}
                <div>
                  <p className="font-medium text-sm">
                    Current Status: <span className={
                      franchisee.status === 'Active' ? 'text-green-600' :
                      franchisee.status === 'Pending' ? 'text-amber-600' :
                      'text-slate-500'
                    }>{franchisee.status}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last updated: {format(new Date(franchisee.activationHistory[franchisee.activationHistory.length - 1].date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="ml-auto">
                  {franchisee.status !== 'Active' ? (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setActionNote(''); setActionDialog('activate') }}>
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Activate Now
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => { setActionNote(''); setActionDialog('deactivate') }}>
                      <Ban className="mr-1.5 h-3.5 w-3.5" />Deactivate
                    </Button>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {[...franchisee.activationHistory].reverse().map((event, i) => (
                    <div key={event.id} className="flex gap-4 relative">
                      <div className={`h-9 w-9 rounded-full border-2 flex items-center justify-center bg-background shrink-0 z-10 ${
                        event.action === 'Activated' ? 'border-green-500' :
                        event.action === 'Deactivated' ? 'border-red-500' :
                        'border-amber-400'
                      }`}>
                        {historyIcon(event.action)}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.action}</span>
                          <span className="text-xs text-muted-foreground">by {event.by}</span>
                          {i === 0 && (
                            <Badge variant="outline" className="text-xs border-0 bg-muted">Latest</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(event.date), 'MMMM d, yyyy')}
                        </p>
                        {event.note && (
                          <p className="text-sm mt-1 text-muted-foreground italic">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activate / Deactivate Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={open => { if (!open) setActionDialog(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={actionDialog === 'activate' ? 'text-green-600' : 'text-red-600'}>
              {actionDialog === 'activate' ? 'Activate Franchisee' : 'Deactivate Franchisee'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog === 'activate'
                ? 'This will mark the franchise as Active and restore full access.'
                : 'This will suspend the franchise. Access will be restricted until reactivated.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border px-4 py-3 text-sm bg-muted/40 space-y-0.5">
              <p className="font-medium">{franchisee.name}</p>
              <p className="text-muted-foreground">{franchisee.storeNumber} · {franchisee.owner}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Reason / Notes</Label>
              <Textarea
                rows={3}
                placeholder={actionDialog === 'activate' ? 'e.g. All requirements met, agreement signed…' : 'e.g. Compliance issue, payment dispute…'}
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              className={actionDialog === 'activate' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              variant={actionDialog === 'deactivate' ? 'destructive' : 'default'}
              onClick={confirmAction}
            >
              {actionDialog === 'activate' ? (
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
