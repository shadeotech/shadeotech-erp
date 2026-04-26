'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Edit, Loader2, Mail, Eye } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface EmailTemplate {
  _id: string
  key: string
  name: string
  subject: string
  body: string
  variables: string[]
  enabled: boolean
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://erpshadeotech.vercel.app'

function wrapInBrandedShell(body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:0;">
  <div style="background:linear-gradient(135deg,#111,#1a1a1a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
    <img src="${APP_URL}/images/logo.png" alt="Shadeotech" style="height:48px;object-fit:contain;margin-bottom:8px;" />
  </div>
  <div style="background:#f9fafb;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
    <p style="color:#6b7280;font-size:12px;margin:0;">Shadeotech &bull; office@shadeotech.com</p>
  </div>
</body>
</html>`
}

export function EmailTemplatesTab() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editEnabled, setEditEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch('/api/settings/email-templates', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setTemplates)
      .finally(() => setLoading(false))
  }, [token])

  function openEdit(t: EmailTemplate) {
    setSelected(t)
    setEditSubject(t.subject)
    setEditBody(t.body)
    setEditEnabled(t.enabled)
    setEditOpen(true)
  }

  function openPreview(t: EmailTemplate) {
    setSelected(t)
    setPreviewOpen(true)
  }

  async function handleSave() {
    if (!selected || !token) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/email-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: selected.key,
          subject: editSubject,
          body: editBody,
          enabled: editEnabled,
        }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setTemplates(prev => prev.map(t => (t.key === updated.key ? updated : t)))
      setEditOpen(false)
      toast({ title: 'Saved', description: 'Email template updated.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to save template.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function toggleEnabled(t: EmailTemplate) {
    if (!token) return
    const updated = { ...t, enabled: !t.enabled }
    setTemplates(prev => prev.map(x => (x.key === t.key ? updated : x)))
    await fetch('/api/settings/email-templates', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key: t.key, subject: t.subject, body: t.body, enabled: !t.enabled }),
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
        <h3 className="text-base font-semibold">Email Templates</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the content and subject of every outgoing email. All emails include your logo automatically.
        </p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Template</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Subject</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Variables</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {templates.map(t => (
              <tr key={t.key} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{t.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell truncate max-w-[200px]">
                  {t.subject}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.variables.slice(0, 3).map(v => (
                      <code key={v} className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">
                        {v}
                      </code>
                    ))}
                    {t.variables.length > 3 && (
                      <span className="text-[11px] text-muted-foreground">+{t.variables.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={t.enabled}
                    onCheckedChange={() => toggleEnabled(t)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openPreview(t)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template — {selected?.name}</DialogTitle>
            <DialogDescription>
              Use variables like {selected?.variables?.[0]} in subject and body. They are replaced with real values when sent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
              <Label>Send this email</Label>
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input value={editSubject} onChange={e => setEditSubject(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Body (HTML)</Label>
                <div className="flex flex-wrap gap-1">
                  {selected?.variables.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEditBody(b => b + v)}
                      className="text-[11px] bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-mono hover:bg-amber-100 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                rows={14}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview — {selected?.name}</DialogTitle>
            <DialogDescription>Variables show as placeholders in the preview.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="border rounded-lg overflow-hidden">
              <iframe
                srcDoc={wrapInBrandedShell(selected.body)}
                className="w-full"
                style={{ height: '520px', border: 'none' }}
                title="Email preview"
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setPreviewOpen(false); openEdit(selected!) }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
