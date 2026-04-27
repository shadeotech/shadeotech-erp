'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Edit, Loader2, Zap, Mail, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'

interface Workflow {
  _id: string
  key: string
  name: string
  trigger: string
  emailEnabled: boolean
  emailTemplateKey: string
  smsEnabled: boolean
  smsBody: string
  enabled: boolean
  delayMinutes: number
}

const BUILT_IN_KEYS = ['portal_invite', 'forgot_password', 'quote_sent', 'invoice_sent', 'staff_reset']

export function WorkflowsTab() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<Workflow | null>(null)
  const [editEmailEnabled, setEditEmailEnabled] = useState(true)
  const [editSmsEnabled, setEditSmsEnabled] = useState(false)
  const [editSmsBody, setEditSmsBody] = useState('')
  const [editEnabled, setEditEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newTrigger, setNewTrigger] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch('/api/settings/workflows', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setWorkflows)
      .finally(() => setLoading(false))
  }, [token])

  function openEdit(w: Workflow) {
    setSelected(w)
    setEditEmailEnabled(w.emailEnabled)
    setEditSmsEnabled(w.smsEnabled)
    setEditSmsBody(w.smsBody)
    setEditEnabled(w.enabled)
    setEditOpen(true)
  }

  async function handleSave() {
    if (!selected || !token) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/workflows', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: selected.key,
          emailEnabled: editEmailEnabled,
          smsEnabled: editSmsEnabled,
          smsBody: editSmsBody,
          enabled: editEnabled,
          delayMinutes: selected.delayMinutes,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setWorkflows(prev => prev.map(w => (w.key === updated.key ? updated : w)))
      setEditOpen(false)
      toast({ title: 'Saved', description: 'Workflow updated.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save workflow.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleCreate() {
    if (!token || !newName.trim() || !newKey.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/settings/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          key: newKey.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
          name: newName.trim(),
          trigger: newTrigger.trim(),
          emailEnabled: false,
          smsEnabled: false,
          smsBody: '',
          enabled: true,
          delayMinutes: 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create workflow')
      }
      const created = await res.json()
      setWorkflows(prev => [...prev, created])
      setCreateOpen(false)
      setNewName(''); setNewKey(''); setNewTrigger('')
      toast({ title: 'Workflow created', description: `"${created.name}" added. Click Configure to set it up.` })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(w: Workflow) {
    if (!token) return
    if (!confirm(`Delete workflow "${w.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/settings/workflows?key=${w.key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete')
      }
      setWorkflows(prev => prev.filter(x => x.key !== w.key))
      toast({ title: 'Deleted', description: `Workflow "${w.name}" removed.` })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  async function toggleWorkflow(w: Workflow) {
    if (!token) return
    const updated = { ...w, enabled: !w.enabled }
    setWorkflows(prev => prev.map(x => (x.key === w.key ? updated : x)))
    await fetch('/api/settings/workflows', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        key: w.key,
        emailEnabled: w.emailEnabled,
        smsEnabled: w.smsEnabled,
        smsBody: w.smsBody,
        enabled: !w.enabled,
        delayMinutes: w.delayMinutes,
      }),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Workflows</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Control when emails and SMS messages are automatically sent. Edit each workflow to configure delivery.
          </p>
        </div>
        <Button size="sm" onClick={() => { setNewName(''); setNewKey(''); setNewTrigger(''); setCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          Add New
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Workflow</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Trigger</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">SMS</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {workflows.map(w => (
              <tr key={w.key} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-medium">{w.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                  {w.trigger}
                </td>
                <td className="px-4 py-3 text-center">
                  {w.emailEnabled ? (
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                      <Mail className="h-3 w-3 mr-1" />On
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400">
                      <Mail className="h-3 w-3 mr-1" />Off
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {w.smsEnabled ? (
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                      <MessageSquare className="h-3 w-3 mr-1" />On
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-400">
                      <MessageSquare className="h-3 w-3 mr-1" />Off
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={w.enabled}
                    onCheckedChange={() => toggleWorkflow(w)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(w)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    {!BUILT_IN_KEYS.includes(w.key) && (
                      <Button variant="ghost" size="sm" className="px-2 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(w)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Workflow</DialogTitle>
            <DialogDescription>Create a custom workflow. After creating, click Configure to set up email and SMS delivery.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Workflow Name <span className="text-red-500">*</span></Label>
              <Input
                value={newName}
                onChange={e => { setNewName(e.target.value); if (!newKey || newKey === newName.toLowerCase().replace(/\s+/g, '_')) setNewKey(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')) }}
                placeholder="e.g. Follow-up Reminder"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Key (unique ID) <span className="text-red-500">*</span></Label>
              <Input
                value={newKey}
                onChange={e => setNewKey(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. followup_reminder"
              />
              <p className="text-[11px] text-muted-foreground">Lowercase letters, numbers, underscores only.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Trigger Description</Label>
              <Input
                value={newTrigger}
                onChange={e => setNewTrigger(e.target.value)}
                placeholder="e.g. 3 days after quote is sent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={creating || !newName.trim() || !newKey.trim()} onClick={handleCreate}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure — {selected?.name}</DialogTitle>
            <DialogDescription>{selected?.trigger}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Workflow Active</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enable or disable this entire workflow</p>
              </div>
              <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Send Email</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Uses the linked email template</p>
                </div>
              </div>
              <Switch checked={editEmailEnabled} onCheckedChange={setEditEmailEnabled} />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Send SMS</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Requires Twilio or SMS provider setup</p>
                  </div>
                </div>
                <Switch checked={editSmsEnabled} onCheckedChange={setEditSmsEnabled} />
              </div>

              {editSmsEnabled && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs">SMS Message</Label>
                  <Textarea
                    value={editSmsBody}
                    onChange={e => setEditSmsBody(e.target.value)}
                    rows={3}
                    placeholder="Hi {{customerName}}, ..."
                    className="text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Max 160 chars per SMS segment. Current: {editSmsBody.length}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
