'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Send } from 'lucide-react'

interface Template {
  id: string
  label: string
  subject: string
  body: string
}

const TEMPLATES: Template[] = [
  {
    id: 'follow_up',
    label: 'Follow Up',
    subject: 'Following up on your inquiry — Shadeotech',
    body: `Hi [Name],

Thank you for your interest in Shadeotech window treatments. We wanted to follow up and see if you have any questions or if there's anything we can help you with.

We'd love to schedule a free in-home consultation to help you find the perfect solution for your space.

Feel free to reply to this email or give us a call — we're happy to help.

Warm regards,
The Shadeotech Team`,
  },
  {
    id: 'quote_reminder',
    label: 'Quote Reminder',
    subject: 'Your quote from Shadeotech is ready',
    body: `Hi [Name],

This is a friendly reminder that your quote from Shadeotech is still available for your review.

If you have any questions about the quote or would like to make any changes, please don't hesitate to reach out.

Warm regards,
The Shadeotech Team`,
  },
  {
    id: 'invoice_reminder',
    label: 'Invoice Reminder',
    subject: 'Invoice reminder from Shadeotech',
    body: `Hi [Name],

This is a friendly reminder that you have an outstanding invoice from Shadeotech.

If you have already made your payment, please disregard this notice. If you have any questions, please contact us.

Warm regards,
The Shadeotech Team`,
  },
  {
    id: 'general',
    label: 'General Message',
    subject: '',
    body: `Hi [Name],



Warm regards,
The Shadeotech Team`,
  },
]

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  to: string
  customerName?: string
}

export function SendEmailModal({ open, onOpenChange, to, customerName }: SendEmailModalProps) {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [templateId, setTemplateId] = useState('follow_up')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Apply template when selection changes or modal opens
  useEffect(() => {
    const tpl = TEMPLATES.find(t => t.id === templateId)
    if (!tpl) return
    const name = customerName || 'there'
    setSubject(tpl.subject)
    setMessage(tpl.body.replace('[Name]', name))
  }, [templateId, customerName])

  // Reset to default template when modal opens
  useEffect(() => {
    if (open) {
      setTemplateId('follow_up')
    }
  }, [open])

  const handleSend = async () => {
    if (!to || !subject.trim() || !message.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in subject and message.', variant: 'destructive' })
      return
    }
    if (!token) return

    try {
      setSending(true)
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to, subject: subject.trim(), message: message.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send email')
      }

      toast({ title: 'Email sent', description: `Email sent to ${to}` })
      onOpenChange(false)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send email',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input value={to} readOnly className="bg-muted text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Message</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={10}
              className="font-mono text-sm resize-none"
              placeholder="Write your message..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Send Email</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
