'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MoreHorizontal, UserPlus, Trash2, ChevronDown, ChevronUp, Loader2, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useQuickQuoteStore, type QuickQuote } from '@/stores/quickQuoteStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface QuickQuoteListProps {
  onConvert?: (customerId: string) => void
}

function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function QuickQuoteItem({
  q,
  onConvert,
  onRemove,
  isConverting,
}: {
  q: QuickQuote
  onConvert: () => void
  onRemove: () => void
  isConverting: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <li className="rounded-xl border bg-card overflow-hidden transition-colors hover:bg-muted/10">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {q.clientName.charAt(0).toUpperCase()}
        </div>

        {/* Client info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{q.clientName}</span>
            <Badge variant="secondary" className="shrink-0 h-5 px-1.5 text-[10px] rounded-full font-mono">
              {q.items.length} item{q.items.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">{q.clientPhone}</span>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo(q.createdAt)}</span>
          </div>
        </div>

        {/* Total + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold tabular-nums">{formatCurrency(q.totalAmount)}</span>

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs hidden sm:flex"
            onClick={onConvert}
            disabled={isConverting}
          >
            {isConverting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-1" />
                Convert
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onConvert} disabled={isConverting} className="sm:hidden">
                <UserPlus className="mr-2 h-4 w-4" />
                Convert to Customer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onRemove}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t bg-muted/20 px-4 py-3 space-y-2">
          {q.items.map((item, i) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground shrink-0">#{i + 1}</span>
                <span className="truncate text-muted-foreground">{item.product}</span>
                <span className="text-xs text-muted-foreground/60 shrink-0">
                  {item.width}&quot; × {item.length}&quot;
                </span>
                {item.operation === 'Motorized' && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px] shrink-0">Motor</Badge>
                )}
                {item.quantity > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0">×{item.quantity}</span>
                )}
              </div>
              <span className="text-sm font-medium shrink-0 ml-2">{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
          <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>Install + tax included</span>
            <div className="flex gap-3">
              <span>Install: {formatCurrency(q.installationFee)}</span>
              <span>Tax: {formatCurrency(q.taxAmount)}</span>
            </div>
          </div>
          {/* Mobile convert button */}
          <Button
            size="sm"
            className="w-full sm:hidden mt-1"
            onClick={onConvert}
            disabled={isConverting}
          >
            {isConverting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : (
              <UserPlus className="h-3.5 w-3.5 mr-2" />
            )}
            Convert to Customer & Create Estimate
          </Button>
        </div>
      )}
    </li>
  )
}

export function QuickQuoteList({ onConvert }: QuickQuoteListProps) {
  const router = useRouter()
  const { quickQuotes, removeQuickQuote } = useQuickQuoteStore()
  const { token } = useAuthStore()
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [convertError, setConvertError] = useState<string | null>(null)

  const handleConvertToCustomer = async (q: QuickQuote) => {
    if (!token) return
    setConvertingId(q.id)
    setConvertError(null)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: q.clientName,
          phone: q.clientPhone,
          type: 'RESIDENTIAL',
          source: 'Quick Quote',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create customer')
      }
      const data = await res.json()
      const customerId = data.customer?.id || data.customer?._id
      if (customerId) {
        if (onConvert) {
          removeQuickQuote(q.id)
          onConvert(customerId)
        } else {
          router.push(`/quotes/new?customerId=${customerId}&fromQuickQuote=${q.id}`)
        }
      }
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : 'Failed to create customer')
    } finally {
      setConvertingId(null)
    }
  }

  if (quickQuotes.length === 0) return null

  return (
    <>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-muted/20">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Quick Estimates</span>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-full">
                {quickQuotes.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Convert when the client is ready to proceed.
            </p>
          </div>
        </div>

        {/* List */}
        <ul className="divide-y">
          {quickQuotes.map((q) => (
            <QuickQuoteItem
              key={q.id}
              q={q}
              onConvert={() => handleConvertToCustomer(q)}
              onRemove={() => removeQuickQuote(q.id)}
              isConverting={convertingId === q.id}
            />
          ))}
        </ul>
      </div>

      {/* Convert error dialog */}
      <Dialog open={!!convertError} onOpenChange={() => setConvertError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversion Failed</DialogTitle>
            <DialogDescription>{convertError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConvertError(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
