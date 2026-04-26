'use client'

import { useState } from 'react'
import { useQuoteOptionsStore, DEFAULT_PRODUCT_RULES, DEFAULT_TERMS, type ProductFieldRules } from '@/stores/quoteOptionsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, RotateCcw, ChevronDown, Pencil, Check, X } from 'lucide-react'

// ── Compact dropdown option manager ─────────────────────────────────────────
function OptionManager({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)

  const add = () => {
    const trimmed = draft.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setDraft('')
  }

  const preview = items.length === 0
    ? 'No options'
    : items.slice(0, 3).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '')

  return (
    <div className="flex items-center gap-3 py-1.5">
      <p className="text-xs font-medium text-muted-foreground w-44 shrink-0">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs justify-between flex-1 font-normal text-left"
          >
            <span className="truncate text-foreground/80">{preview}</span>
            <ChevronDown className="h-3.5 w-3.5 ml-2 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 space-y-2" align="start">
          <p className="text-xs font-semibold mb-1">{label}</p>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {items.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-background"
              >
                {item}
                <button
                  onClick={() => onChange(items.filter((i) => i !== item))}
                  className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No options yet</p>
            )}
          </div>
          <div className="flex gap-2 pt-1 border-t">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add option…"
              className="h-7 text-xs"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            />
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={add} disabled={!draft.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ── Bottom Rail Option merged dropdown value ─────────────────────────────────
type BROption = 'none' | 'show_seal' | 'hide_sealed' | 'show_seal_hide'
function getBROption(rules: ProductFieldRules): BROption {
  if (rules.showBottomRailSeal && rules.hideSealed) return 'show_seal_hide'
  if (rules.showBottomRailSeal) return 'show_seal'
  if (rules.hideSealed) return 'hide_sealed'
  return 'none'
}
function applyBROption(option: BROption): Pick<ProductFieldRules, 'showBottomRailSeal' | 'hideSealed'> {
  return {
    showBottomRailSeal: option === 'show_seal' || option === 'show_seal_hide',
    hideSealed: option === 'hide_sealed' || option === 'show_seal_hide',
  }
}
const BR_OPTION_LABELS: Record<BROption, string> = {
  none: 'Standard',
  show_seal: 'Show Seal Type',
  hide_sealed: 'Hide "Sealed"',
  show_seal_hide: 'Seal + Hide Sealed',
}

// ── Columns shown in the table (BR seal + hideSealed merged into one) ────────
const TABLE_COLS: Array<{ key: keyof ProductFieldRules | 'brOption'; label: string }> = [
  { key: 'showSideChannel', label: 'Side Channel' },
  { key: 'showCassette', label: 'Cassette' },
  { key: 'showWrap', label: 'Wrap' },
  { key: 'brOption', label: 'Bottom Rail' },
  { key: 'showRollerColumn', label: 'Roller Col.' },
  { key: 'showSpringAssist', label: 'Spring Assist' },
]

function ProductRulesTable() {
  const { productRules, updateProductRule, setProductRules } = useQuoteOptionsStore()
  const [newCategory, setNewCategory] = useState('')
  const [editingCat, setEditingCat] = useState<{ original: string; draft: string } | null>(null)

  const categories = Object.keys(productRules).filter((k) => k !== 'Default')

  const addCategory = () => {
    const trimmed = newCategory.trim()
    if (!trimmed || productRules[trimmed]) return
    setProductRules({ ...productRules, [trimmed]: { ...DEFAULT_PRODUCT_RULES.Default } })
    setNewCategory('')
  }

  const removeCategory = (cat: string) => {
    const next = { ...productRules }
    delete next[cat]
    setProductRules(next)
  }

  const saveRename = () => {
    if (!editingCat) return
    const { original, draft } = editingCat
    const trimmed = draft.trim()
    if (trimmed && trimmed !== original && !productRules[trimmed]) {
      const next: Record<string, ProductFieldRules> = {}
      for (const [k, v] of Object.entries(productRules)) {
        next[k === original ? trimmed : k] = v
      }
      setProductRules(next)
    }
    setEditingCat(null)
  }

  const setBR = (cat: string, option: BROption) => {
    const applied = applyBROption(option)
    const current = productRules[cat] ?? DEFAULT_PRODUCT_RULES.Default
    setProductRules({
      ...productRules,
      [cat]: { ...current, ...applied },
    })
  }

  const renderRow = (cat: string, rules: ProductFieldRules, isDefault = false) => (
    <tr key={cat} className={`border-b last:border-0 hover:bg-muted/20 ${isDefault ? 'bg-muted/10' : ''}`}>
      <td className="px-3 py-2 font-medium text-xs">
        {editingCat?.original === cat ? (
          <div className="flex items-center gap-1">
            <Input
              value={editingCat.draft}
              onChange={(e) => setEditingCat({ ...editingCat, draft: e.target.value })}
              className="h-6 text-xs w-28"
              onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingCat(null) }}
              autoFocus
            />
            <button onClick={saveRename} className="text-green-600 hover:text-green-700"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setEditingCat(null)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
          </div>
        ) : (
          <span className={isDefault ? 'text-muted-foreground' : ''}>{isDefault ? 'Default (all others)' : cat}</span>
        )}
      </td>
      {TABLE_COLS.map((col) => (
        <td key={col.key} className="px-2 py-2 text-center">
          {col.key === 'brOption' ? (
            <Select
              value={getBROption(rules)}
              onValueChange={(v) => setBR(cat, v as BROption)}
            >
              <SelectTrigger className="h-6 text-[10px] w-28 mx-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(BR_OPTION_LABELS) as [BROption, string][]).map(([v, l]) => (
                  <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <input
              type="checkbox"
              checked={!!rules[col.key as keyof ProductFieldRules]}
              onChange={(e) => updateProductRule(cat, col.key as keyof ProductFieldRules, e.target.checked)}
              className="rounded accent-amber-600 cursor-pointer h-3.5 w-3.5"
            />
          )}
        </td>
      ))}
      <td className="px-2 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          {!isDefault && (
            <button onClick={() => setEditingCat({ original: cat, draft: cat })} className="text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {!isDefault && (
            <button onClick={() => removeCategory(cat)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product Field Visibility</p>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => setProductRules({ ...DEFAULT_PRODUCT_RULES })}>
          <RotateCcw className="h-3 w-3" /> Reset to defaults
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Control which fields appear in the quote builder. Click the pencil to rename a category.</p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-36">Category</th>
              {TABLE_COLS.map((c) => (
                <th key={c.key} className="px-2 py-2 text-center font-semibold text-muted-foreground whitespace-nowrap">{c.label}</th>
              ))}
              <th className="px-2 py-2 w-12" />
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => renderRow(cat, productRules[cat] ?? DEFAULT_PRODUCT_RULES.Default))}
            {productRules.Default && renderRow('Default', productRules.Default, true)}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 max-w-xs">
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New product category…"
          className="h-7 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }}
        />
        <Button size="sm" variant="outline" className="h-7 px-2" onClick={addCategory} disabled={!newCategory.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────
export function QuoteOptionsSettings() {
  const store = useQuoteOptionsStore()

  const DROPDOWN_GROUPS: { label: string; items: string[]; setter: (v: string[]) => void }[] = [
    { label: 'Area / Room Types', items: store.roomTypes, setter: store.setRoomTypes },
    { label: 'Sequence Options', items: store.sequenceOptions, setter: store.setSequenceOptions },
    { label: 'Interior Motorized Ops', items: store.motorizedOperations, setter: store.setMotorizedOperations },
    { label: 'Interior Manual Ops', items: store.manualOperations, setter: store.setManualOperations },
    { label: 'Exterior Motorized Ops', items: store.exteriorMotorizedOperations, setter: store.setExteriorMotorizedOperations },
    { label: 'Exterior Manual Ops', items: store.exteriorManualOperations, setter: store.setExteriorManualOperations },
    { label: 'Chain Colors', items: store.beadedChainColors, setter: store.setBeadedChainColors },
    { label: 'Cord Colors', items: store.cordColors, setter: store.setCordColors },
    { label: 'Bottom Rail Types', items: store.bottomRailTypes, setter: store.setBottomRailTypes },
    { label: 'Bottom Rail Exposed Colors', items: store.bottomRailExposedColors, setter: store.setBottomRailExposedColors },
    { label: 'Exterior Component Colors', items: store.exteriorComponentColors, setter: store.setExteriorComponentColors },
    { label: 'Side Channel Colors', items: store.sideChannelColors, setter: store.setSideChannelColors },
  ]

  // Pair groups into rows of 2
  const rows = Array.from({ length: Math.ceil(DROPDOWN_GROUPS.length / 2) }, (_, i) =>
    DROPDOWN_GROUPS.slice(i * 2, i * 2 + 2)
  )

  return (
    <div className="space-y-8">
      {/* Dropdown Options */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Dropdown Options</h3>
        <div className="rounded-lg border divide-y divide-border">
          {rows.map((pair, i) => (
            <div key={i} className="grid grid-cols-2 divide-x">
              {pair.map((group) => (
                <div key={group.label} className="px-3">
                  <OptionManager label={group.label} items={group.items} onChange={group.setter} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t" />

      {/* Product Field Visibility */}
      <ProductRulesTable />

      {/* Divider */}
      <div className="border-t" />

      {/* Terms & Conditions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Terms &amp; Conditions</p>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={() => store.setTermsAndConditions(DEFAULT_TERMS)}>
            <RotateCcw className="h-3 w-3" /> Reset to defaults
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">These terms appear on every quote. Each line is a separate clause.</p>
        <Textarea
          value={store.termsAndConditions}
          onChange={(e) => store.setTermsAndConditions(e.target.value)}
          className="text-xs min-h-[140px] font-mono"
          placeholder="Enter terms and conditions…"
        />
      </div>
    </div>
  )
}
