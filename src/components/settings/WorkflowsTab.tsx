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
import { Edit, Loader2, Zap, Mail, MessageSquare } from 'lucide-react'
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
      <div>
        <h3 className="text-base font-semibold">Workflows</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Control when emails and SMS messages are automatically sent. Edit each workflow to configure delivery.
        </p>
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
                  <Button variant="outline" size="sm" onClick={() => openEdit(w)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
