'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight, Plus, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInvoiceTemplateStore } from '@/stores/invoiceTemplateStore'
import type { InvoiceTemplate, InvoiceFieldLabels } from '@/lib/invoice-template-types'

// ── Mini toggle switch ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

// ── Collapsible section ────────────────────────────────────────────────────────
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

const TEMPLATES: { id: InvoiceTemplate; name: string; desc: string; thumb: React.ReactNode }[] = [
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Dark header band, bold layout',
    thumb: (
      <div className="h-20 w-full bg-white border rounded overflow-hidden">
        {/* dark header */}
        <div className="h-5 bg-slate-900 flex items-center px-2 justify-between">
          <div className="h-2 w-8 bg-white/80 rounded-sm" />
          <div className="h-2 w-6 bg-white/30 rounded-sm" />
        </div>
        <div className="p-1.5 space-y-0.5">
          <div className="flex gap-1 mb-1">
            <div className="flex-1 space-y-0.5">
              <div className="h-1 w-8 bg-slate-300 rounded-sm" />
              <div className="h-1 w-12 bg-slate-200 rounded-sm" />
            </div>
            <div className="space-y-0.5 text-right">
              <div className="h-1 w-6 bg-slate-200 rounded-sm ml-auto" />
              <div className="h-1 w-8 bg-slate-100 rounded-sm ml-auto" />
            </div>
          </div>
          <div className="h-px bg-slate-200" />
          {[70, 50, 60].map((w, i) => (
            <div key={i} className="flex gap-1">
              <div className="h-1 rounded-sm bg-slate-200" style={{ width: `${w}%` }} />
              <div className="h-1 w-6 rounded-sm bg-slate-100 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'classic',
    name: 'Classic',
    desc: 'Bordered, structured layout',
    thumb: (
      <div className="h-20 w-full bg-white border-2 border-slate-400 rounded overflow-hidden">
        {/* colored top bar */}
        <div className="h-5 bg-slate-700 flex items-center px-2 justify-between">
          <div className="h-2 w-8 bg-white/80 rounded-sm" />
          <div className="h-2.5 w-7 bg-slate-400 rounded-sm" />
        </div>
        <div className="p-1.5 space-y-0.5">
          <div className="flex gap-3 mb-1">
            <div className="space-y-0.5 flex-1">
              <div className="h-1 w-6 bg-slate-400 rounded-sm" />
              <div className="h-1 w-10 bg-slate-200 rounded-sm" />
              <div className="h-1 w-8 bg-slate-200 rounded-sm" />
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-8 bg-slate-300 rounded-sm" />
              <div className="h-1 w-6 bg-slate-200 rounded-sm" />
            </div>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-sm flex items-center px-1 gap-1">
            {[30, 40, 15, 15].map((w, i) => (
              <div key={i} className="h-0.5 rounded-sm bg-white/50" style={{ width: `${w}%` }} />
            ))}
          </div>
          {[55, 45].map((w, i) => (
            <div key={i} className="flex gap-1">
              <div className="h-1 rounded-sm bg-slate-100" style={{ width: `${w}%` }} />
              <div className="h-1 w-5 rounded-sm bg-slate-100 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Clean, no-frills style',
    thumb: (
      <div className="h-20 w-full bg-white border border-slate-200 rounded p-1.5">
        <div className="flex justify-between items-start mb-1.5">
          <div className="space-y-0.5">
            <div className="h-2 w-10 bg-slate-800 rounded-sm" />
            <div className="h-1 w-14 bg-slate-200 rounded-sm" />
          </div>
          <div className="space-y-0.5 text-right">
            <div className="h-2 w-8 bg-slate-700 rounded-sm" />
            <div className="h-1 w-10 bg-slate-200 rounded-sm" />
          </div>
        </div>
        <div className="h-px bg-slate-200 mb-1" />
        <div className="space-y-0.5">
          {[65, 55, 70].map((w, i) => (
            <div key={i} className="flex gap-1">
              <div className="h-1 rounded-sm bg-slate-100" style={{ width: `${w}%` }} />
              <div className="h-1 w-5 rounded-sm bg-slate-100 ml-auto" />
            </div>
          ))}
        </div>
        <div className="mt-1 border-t border-slate-200 pt-0.5 flex justify-end">
          <div className="h-1 w-10 bg-slate-300 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: 'estimate-style',
    name: 'Estimate',
    desc: 'Amber accent, signature style',
    thumb: (
      <div className="h-20 w-full bg-white border rounded overflow-hidden">
        <div className="flex justify-between items-start p-1.5 mb-0.5">
          <div className="space-y-0.5">
            <div className="h-2 w-10 bg-gray-800 rounded-sm" />
            <div className="h-1 w-14 bg-gray-200 rounded-sm" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3.5 w-3.5 bg-amber-400 rounded-sm" />
            <div className="space-y-0.5">
              <div className="h-1 w-8 bg-gray-200 rounded-sm" />
              <div className="h-1 w-6 bg-gray-100 rounded-sm" />
            </div>
          </div>
        </div>
        <div className="h-2 bg-gray-800 flex items-center px-1.5 gap-1">
          {[20, 45, 15, 20].map((w, i) => (
            <div key={i} className="h-0.5 rounded-sm bg-white/40" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="p-1 space-y-0.5">
          {[60, 50].map((w, i) => (
            <div key={i} className="flex gap-1">
              <div className="h-1 rounded-sm bg-gray-100" style={{ width: `${w}%` }} />
              <div className="h-1 w-5 rounded-sm bg-amber-100 ml-auto" />
            </div>
          ))}
        </div>
        <div className="h-2 bg-amber-400 mt-auto" />
      </div>
    ),
  },
]

// ── Color picker row ───────────────────────────────────────────────────────────
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400 font-mono">{value}</span>
        <label className="cursor-pointer">
          <div
            className="h-7 w-7 rounded-md border-2 border-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  )
}

// ── Label row ──────────────────────────────────────────────────────────────────
function LabelRow({
  label,
  fieldKey,
  value,
  onChange,
}: {
  label: string
  fieldKey: keyof InvoiceFieldLabels
  value: string
  onChange: (key: keyof InvoiceFieldLabels, value: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 items-center">
      <span className="text-[11px] text-slate-500 truncate">{label}</span>
      <Input
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className="h-7 text-xs"
      />
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export function InvoiceCustomizerPanel() {
  const { config, setConfig, setLabel, addCustomRow, updateCustomRow, removeCustomRow, resetConfig } =
    useInvoiceTemplateStore()

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Customize Invoice</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-slate-400 hover:text-slate-600"
          onClick={resetConfig}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Template Selection ── */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Choose Style</p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setConfig({ template: t.id })}
                className={cn(
                  'rounded-xl p-2 border-2 transition-all text-left',
                  config.template === t.id
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                {t.thumb}
                <div className="mt-2">
                  <p className={cn('text-[11px] font-bold', config.template === t.id ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400')}>
                    {t.name}
                    {config.template === t.id && <span className="ml-1.5 text-[9px] font-semibold uppercase tracking-wide bg-amber-500 text-white px-1.5 py-0.5 rounded-full">Active</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Branding ── */}
        <Section title="Branding">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Logo</span>
            <Toggle
              checked={config.showLogo}
              onChange={(v) => setConfig({ showLogo: v })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-500">Company Name</Label>
            <Input
              value={config.companyName}
              onChange={(e) => setConfig({ companyName: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-500">Tagline</Label>
            <Input
              value={config.companyTagline}
              onChange={(e) => setConfig({ companyTagline: e.target.value })}
              className="h-8 text-sm"
              placeholder="e.g. Management System"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-500">Company Address</Label>
            <Input
              value={config.companyAddress ?? ''}
              onChange={(e) => setConfig({ companyAddress: e.target.value })}
              className="h-8 text-sm"
              placeholder="3235 Skylane Dr. Unit 111, Carrollton, TX 75006"
            />
          </div>
        </Section>

        {/* ── Colors ── */}
        <Section title="Colors">
          <ColorRow
            label="Accent Color"
            value={config.accentColor}
            onChange={(v) => setConfig({ accentColor: v })}
          />
          <ColorRow
            label="Header Background"
            value={config.headerBgColor}
            onChange={(v) => setConfig({ headerBgColor: v })}
          />
        </Section>

        {/* ── Content ── */}
        <Section title="Content">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-500">Footer Text</Label>
            <Input
              value={config.footerText}
              onChange={(e) => setConfig({ footerText: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Terms & Conditions</span>
            <Toggle
              checked={config.showTerms}
              onChange={(v) => setConfig({ showTerms: v })}
            />
          </div>
          {config.showTerms && (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-500">Terms Text</Label>
              <textarea
                value={config.termsText}
                onChange={(e) => setConfig({ termsText: e.target.value })}
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          )}
        </Section>

        {/* ── Sections Visibility ── */}
        <Section title="Sections">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Dimensions Column</span>
            <Toggle
              checked={config.showDimensions}
              onChange={(v) => setConfig({ showDimensions: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show Quote Reference</span>
            <Toggle
              checked={config.showQuoteRef}
              onChange={(v) => setConfig({ showQuoteRef: v })}
            />
          </div>
        </Section>

        {/* ── Custom Rows ── */}
        <Section title="Extra Line Items">
          <p className="text-[11px] text-slate-400">
            Add extra rows like shipping, discounts, or service fees.
          </p>
          {config.customRows.map((row) => (
            <div key={row.id} className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="flex gap-2">
                <Input
                  value={row.label}
                  onChange={(e) => updateCustomRow(row.id, { label: e.target.value })}
                  className="h-7 text-xs flex-1"
                  placeholder="Label"
                />
                <button
                  type="button"
                  onClick={() => removeCustomRow(row.id)}
                  className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateCustomRow(row.id, { amount: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs w-24"
                  placeholder="0.00"
                />
                <select
                  value={row.type}
                  onChange={(e) =>
                    updateCustomRow(row.id, { type: e.target.value as 'add' | 'subtract' })
                  }
                  className="h-7 flex-1 rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="add">+ Fee</option>
                  <option value="subtract">− Discount</option>
                </select>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={addCustomRow}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Row
          </Button>
        </Section>

        {/* ── Field Labels ── */}
        <Section title="Field Labels" defaultOpen={false}>
          <p className="text-[11px] text-slate-400 mb-2">Rename any field label on the invoice.</p>
          <div className="space-y-2">
            {(
              [
                ['Invoice Title', 'invoiceTitle'],
                ['Bill To', 'billTo'],
                ['Ship To', 'shipTo'],
                ['Invoice Date', 'invoiceDate'],
                ['Due Date', 'dueDate'],
                ['Status', 'status'],
                ['Quote Reference', 'quoteRef'],
                ['Subtotal', 'subtotal'],
                ['Tax', 'tax'],
                ['Total', 'total'],
                ['Amount Paid', 'amountPaid'],
                ['Balance Due', 'balanceDue'],
                ['Notes', 'notes'],
                ['Terms', 'terms'],
                ['Col: #', 'colNo'],
                ['Col: Description', 'colDescription'],
                ['Col: Dimensions', 'colDimensions'],
                ['Col: Qty', 'colQty'],
                ['Col: Unit Price', 'colUnitPrice'],
                ['Col: Total', 'colTotal'],
              ] as [string, keyof InvoiceFieldLabels][]
            ).map(([label, key]) => (
              <LabelRow
                key={key}
                label={label}
                fieldKey={key}
                value={config.labels[key]}
                onChange={setLabel}
              />
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
