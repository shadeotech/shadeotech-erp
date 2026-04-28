'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Printer } from 'lucide-react'
import type { ProductionOrder, ProductionOrderItem } from '@/types/production'
import {
  SHEET_TEMPLATES,
  autoSelectTemplate,
  detectProductFamily,
  getTemplatesForFamily,
  getTemplateByKey,
  parseDim,
  fmtDim,
  computeCol,
  type SheetTemplate,
} from '@/lib/productionSheetTemplates'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SheetRow {
  // populated from order item
  ser: number
  qty: number
  seq: string
  ss: string
  area: string
  width: string
  height: string
  heightL: string
  heightR: string
  cord: string
  channel: string
  pos: string
  isOs: string
  wand: string
  component: string
  fabricLoc: string
}

interface SheetGroup {
  key: string
  productFamily: string
  fabric: string
  operation: string
  items: ProductionOrderItem[]
  templateKey: string
  rows: SheetRow[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeGroupKey(item: ProductionOrderItem, quoteProductName?: string): string {
  const family = detectProductFamily(quoteProductName || item.product)
  return `${family}|||${item.operation}|||${item.fabric || ''}`
}

function itemToRow(item: ProductionOrderItem, ser: number): SheetRow {
  return {
    ser,
    qty: item.qty || 1,
    seq: (item as any).sequence || '',
    ss: '',
    area: item.area || '',
    width: item.width || '',
    height: item.length || '',
    heightL: item.length || '',
    heightR: item.length || '',
    cord: '0',
    channel: item.channelNumber || '',
    pos: (item as any).controlSide || 'RIGHT',
    isOs: item.mount === 'OS' ? 'OS' : 'INSIDE',
    wand: '0',
    component: item.cassetteTypeColor || '',
    fabricLoc: '',
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  order: ProductionOrder
  quoteData: { adminNote?: string; addOns?: any[]; items?: any[] } | null
}

export default function ProductionSheetsTab({ order, quoteData }: Props) {
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, string>>({})
  const [rowEdits, setRowEdits] = useState<Record<string, Record<number, Partial<SheetRow>>>>({})

  // ── Build sheet groups ───────────────────────────────────────────────────
  const groups: SheetGroup[] = useMemo(() => {
    const groupMap: Record<string, SheetGroup> = {}

    for (const item of order.items) {
      const qi = quoteData?.items?.find((q: any) => q.lineNumber === item.lineNumber)
      const quoteProductName = qi?.productName ? qi.productName.split(' - ')[0].trim() : undefined
      const gKey = makeGroupKey(item, quoteProductName)

      if (!groupMap[gKey]) {
        const family = detectProductFamily(quoteProductName || item.product)
        const tKey = autoSelectTemplate(item, qi?.productName)
        groupMap[gKey] = {
          key: gKey,
          productFamily: family,
          fabric: item.fabric || '',
          operation: item.operation,
          items: [],
          templateKey: tKey,
          rows: [],
        }
      }
      groupMap[gKey].items.push(item)
    }

    // Build rows: expand qty > 1 into duplicate rows each with qty = 1
    for (const g of Object.values(groupMap)) {
      let ser = 1
      for (const item of g.items) {
        const qty = item.qty || 1
        for (let q = 0; q < qty; q++) {
          const row = itemToRow(item, ser++)
          row.qty = 1
          g.rows.push(row)
        }
      }
    }

    // Sort: by productFamily then operation then fabric
    return Object.values(groupMap).sort((a, b) => {
      const pCmp = a.productFamily.localeCompare(b.productFamily)
      if (pCmp !== 0) return pCmp
      const oCmp = a.operation.localeCompare(b.operation)
      if (oCmp !== 0) return oCmp
      return a.fabric.localeCompare(b.fabric)
    })
  }, [order.items, quoteData])

  // ── Resolve template for a group (user override or auto) ─────────────────
  function getTemplate(group: SheetGroup): SheetTemplate {
    const key = selectedTemplates[group.key] || group.templateKey
    return getTemplateByKey(key) || SHEET_TEMPLATES[0]
  }

  // ── Row edit helpers ─────────────────────────────────────────────────────
  function getRow(group: SheetGroup, rowIdx: number): SheetRow {
    const base = group.rows[rowIdx]
    const edits = rowEdits[group.key]?.[rowIdx] || {}
    return { ...base, ...edits }
  }

  function updateRow(groupKey: string, rowIdx: number, field: keyof SheetRow, value: string) {
    setRowEdits(prev => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || {}),
        [rowIdx]: {
          ...(prev[groupKey]?.[rowIdx] || {}),
          [field]: value,
        },
      },
    }))
  }

  // ── Print individual sheet ───────────────────────────────────────────────
  function printSheet(group: SheetGroup) {
    const tmpl = getTemplate(group)
    const addOns: any[] = quoteData?.addOns || []

    const headerRows = [
      ['Sidemark', order.sideMark || '—', 'Date', order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'],
      ['Customer', order.customerName, 'Order No', order.orderNumber],
      ['Fabric', group.fabric || '—', 'No. of Shades', String(group.items.reduce((s, i) => s + (i.qty || 1), 0))],
      ['Component', group.items[0]?.cassetteTypeColor || '—', 'Note', quoteData?.adminNote || '—'],
    ]

    const colHeaders = tmpl.columns.map(c => `<th style="background:#f97316;color:#fff;border:1px solid #fdba74;padding:4px 6px;font-size:10px;white-space:nowrap">${c.label}</th>`).join('')

    const dataRows = group.rows.map((baseRow, rIdx) => {
      const row = { ...baseRow, ...(rowEdits[group.key]?.[rIdx] || {}) }
      const w = parseDim(row.width)
      const h = parseDim(row.height)
      const hL = parseDim(row.heightL)
      const hR = parseDim(row.heightR)

      const cells = tmpl.columns.map(col => {
        let val = ''
        const ct = col.type
        if (ct === 'ser') val = String(row.ser)
        else if (ct === 'qty') val = String(row.qty)
        else if (ct === 'seq') val = row.seq
        else if (ct === 'ss') val = row.ss
        else if (ct === 'area') val = row.area
        else if (ct === 'width') val = row.width
        else if (ct === 'height') val = row.height
        else if (ct === 'heightL') val = row.heightL
        else if (ct === 'heightR') val = row.heightR
        else if (ct === 'cord') val = row.cord
        else if (ct === 'channel') val = row.channel
        else if (ct === 'pos') val = row.pos
        else if (ct === 'isOs') val = row.isOs
        else if (ct === 'wand') val = row.wand
        else if (ct === 'component') val = row.component
        else if (ct === 'fabricLoc') val = row.fabricLoc
        else {
          const computed = computeCol(ct, w, h, hL, hR)
          val = computed !== null ? fmtDim(computed) : ''
        }
        return `<td style="border:1px solid #e5e7eb;padding:3px 6px;font-size:10px;text-align:center;white-space:nowrap">${val}</td>`
      }).join('')

      const bg = rIdx % 2 === 0 ? '#fff' : '#f9fafb'
      return `<tr style="background:${bg}">${cells}</tr>`
    }).join('')

    const headerTable = headerRows.map(r => `
      <tr>
        <td style="border:1px solid #e5e7eb;padding:4px 8px;font-weight:600;background:#f3f4f6;font-size:11px;width:15%">${r[0]}</td>
        <td style="border:1px solid #e5e7eb;padding:4px 8px;font-size:11px;width:35%">${r[1]}</td>
        <td style="border:1px solid #e5e7eb;padding:4px 8px;font-weight:600;background:#f3f4f6;font-size:11px;width:15%">${r[2]}</td>
        <td style="border:1px solid #e5e7eb;padding:4px 8px;font-size:11px;width:35%">${r[3]}</td>
      </tr>`).join('')

    const win = window.open('', '_blank', 'width=1200,height=800')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${tmpl.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 10mm; }
        table { border-collapse: collapse; }
        @media print { @page { size: A3 landscape; margin: 10mm; } }
        .logo { height: 40px; margin-bottom: 8px; }
      </style>
    </head><body>
      <img src="/images/logo.png" class="logo" alt="Logo" onerror="this.style.display='none'" />
      <h2 style="font-size:13px;font-weight:700;margin:0 0 6px;text-transform:uppercase;letter-spacing:.03em">${tmpl.title}</h2>
      <table style="width:100%;margin-bottom:10px">${headerTable}</table>
      <div style="overflow-x:auto">
        <table style="min-width:100%">
          <thead><tr>${colHeaders}</tr></thead>
          <tbody>${dataRows}</tbody>
        </table>
      </div>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  if (!order.items || order.items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-sm text-muted-foreground">
        No items in this order.
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────
  let lastProductFamily = ''

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body > *:not(#ps-print-root) { display: none !important; }
          #ps-print-root { display: block !important; }
          .ps-card { page-break-after: always; }
          @page { size: A3 landscape; margin: 10mm; }
        }
      `}</style>

      {/* Print-all button */}
      <div className="flex items-center justify-between no-print">
        <p className="text-sm text-muted-foreground">
          {groups.length} sheet{groups.length !== 1 ? 's' : ''} across {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </p>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print All
        </Button>
      </div>

      <div id="ps-print-root" className="space-y-6">
        {groups.map((group, gIdx) => {
          const tmpl = getTemplate(group)
          const familyTemplates = getTemplatesForFamily(group.productFamily)
          const isNewFamily = group.productFamily !== lastProductFamily
          if (isNewFamily) lastProductFamily = group.productFamily

          const totalShades = group.items.reduce((s, i) => s + (i.qty || 1), 0)
          const addOns: any[] = quoteData?.addOns || []

          return (
            <div key={group.key}>
              {/* Product-family separator */}
              {isNewFamily && (
                <div className="flex items-center gap-3 mb-3 no-print">
                  <div className="h-px flex-1 bg-amber-200 dark:bg-amber-800/40" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    {group.productFamily}
                  </span>
                  <div className="h-px flex-1 bg-amber-200 dark:bg-amber-800/40" />
                </div>
              )}

              {/* Sheet card */}
              <div className="ps-card rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {group.fabric || group.productFamily}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.operation} · {totalShades} shade{totalShades !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 no-print">
                    {/* Template selector */}
                    <Select
                      value={selectedTemplates[group.key] || group.templateKey}
                      onValueChange={val => setSelectedTemplates(prev => ({ ...prev, [group.key]: val }))}
                    >
                      <SelectTrigger className="h-8 w-52 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {familyTemplates.map(t => (
                          <SelectItem key={t.key} value={t.key} className="text-xs">
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => printSheet(group)} className="gap-1.5">
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Sheet title */}
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {tmpl.title}
                  </p>

                  {/* Header block */}
                  <table className="w-full text-xs border border-gray-200 dark:border-gray-700">
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium w-1/4 bg-gray-50 dark:bg-gray-700/50">Sidemark</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 w-1/4">{order.sideMark || '—'}</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium w-1/4 bg-gray-50 dark:bg-gray-700/50">Date</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 w-1/4">{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '—'}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium bg-gray-50 dark:bg-gray-700/50">Customer</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1">{order.customerName}</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium bg-gray-50 dark:bg-gray-700/50">Order No</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1">{order.orderNumber}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium bg-gray-50 dark:bg-gray-700/50">Fabric</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1">{group.fabric || '—'}</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium bg-gray-50 dark:bg-gray-700/50">No. of Shades</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1">{totalShades}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium bg-gray-50 dark:bg-gray-700/50">Component</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1">{group.items[0]?.cassetteTypeColor || '—'}</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium bg-gray-50 dark:bg-gray-700/50">Note</td>
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-1">{quoteData?.adminNote || '—'}</td>
                      </tr>
                      {addOns.filter((a: any) => a.name).slice(0, 3).map((addon: any, i: number) => (
                        <tr key={i}>
                          <td className="border border-gray-200 dark:border-gray-700 px-2 py-1 font-medium bg-gray-50 dark:bg-gray-700/50">{addon.name}</td>
                          <td className="border border-gray-200 dark:border-gray-700 px-2 py-1" colSpan={3}>{addon.quantity ? `×${addon.quantity}` : '✓'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Cut dimensions table */}
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse" style={{ minWidth: '100%' }}>
                      <thead>
                        <tr className="bg-orange-400 text-white text-center">
                          {tmpl.columns.map(col => (
                            <th
                              key={col.key}
                              className="border border-orange-300 px-2 py-1.5 whitespace-nowrap font-semibold"
                              style={{ minWidth: col.w }}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((baseRow, rIdx) => {
                          const row = getRow(group, rIdx)
                          const w = parseDim(row.width)
                          const h = parseDim(row.height)
                          const hL = parseDim(row.heightL)
                          const hR = parseDim(row.heightR)

                          return (
                            <tr
                              key={rIdx}
                              className={rIdx % 2 === 0 ? 'bg-white dark:bg-background' : 'bg-gray-50 dark:bg-muted/30'}
                            >
                              {tmpl.columns.map(col => {
                                const ct = col.type
                                const isInput = typeof ct === 'string'

                                if (!isInput) {
                                  const val = computeCol(ct, w, h, hL, hR)
                                  return (
                                    <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-center font-mono font-medium text-gray-900 dark:text-white">
                                      {val !== null ? fmtDim(val) : ''}
                                    </td>
                                  )
                                }

                                // Input columns
                                if (ct === 'ser') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-center text-muted-foreground">{row.ser}</td>
                                )
                                if (ct === 'qty') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-2 py-1 text-center">
                                    <input
                                      type="number"
                                      value={row.qty}
                                      onChange={e => updateRow(group.key, rIdx, 'qty', e.target.value)}
                                      className="w-10 text-center bg-transparent outline-none text-xs"
                                      min={1}
                                    />
                                  </td>
                                )
                                if (ct === 'seq') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.seq} onChange={e => updateRow(group.key, rIdx, 'seq', e.target.value)} className="w-9 text-center bg-transparent outline-none text-xs" />
                                  </td>
                                )
                                if (ct === 'ss') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.ss} onChange={e => updateRow(group.key, rIdx, 'ss', e.target.value)} className="w-9 text-center bg-transparent outline-none text-xs" />
                                  </td>
                                )
                                if (ct === 'area') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.area} onChange={e => updateRow(group.key, rIdx, 'area', e.target.value)} className="w-20 bg-transparent outline-none text-xs" />
                                  </td>
                                )
                                if (ct === 'width') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.width} onChange={e => updateRow(group.key, rIdx, 'width', e.target.value)} className="w-16 text-center bg-transparent outline-none text-xs font-mono" />
                                  </td>
                                )
                                if (ct === 'height') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.height} onChange={e => updateRow(group.key, rIdx, 'height', e.target.value)} className="w-16 text-center bg-transparent outline-none text-xs font-mono" />
                                  </td>
                                )
                                if (ct === 'heightL') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.heightL} onChange={e => updateRow(group.key, rIdx, 'heightL', e.target.value)} className="w-16 text-center bg-transparent outline-none text-xs font-mono" />
                                  </td>
                                )
                                if (ct === 'heightR') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.heightR} onChange={e => updateRow(group.key, rIdx, 'heightR', e.target.value)} className="w-16 text-center bg-transparent outline-none text-xs font-mono" />
                                  </td>
                                )
                                if (ct === 'cord') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.cord} onChange={e => updateRow(group.key, rIdx, 'cord', e.target.value)} className="w-10 text-center bg-transparent outline-none text-xs" />
                                  </td>
                                )
                                if (ct === 'channel') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.channel} onChange={e => updateRow(group.key, rIdx, 'channel', e.target.value)} className="w-10 text-center bg-transparent outline-none text-xs" />
                                  </td>
                                )
                                if (ct === 'pos') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <select
                                      value={row.pos}
                                      onChange={e => updateRow(group.key, rIdx, 'pos', e.target.value)}
                                      className="bg-transparent outline-none text-xs"
                                    >
                                      <option>RIGHT</option>
                                      <option>LEFT</option>
                                    </select>
                                  </td>
                                )
                                if (ct === 'isOs') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <select
                                      value={row.isOs}
                                      onChange={e => updateRow(group.key, rIdx, 'isOs', e.target.value)}
                                      className="bg-transparent outline-none text-xs"
                                    >
                                      <option>OS</option>
                                      <option>INSIDE</option>
                                    </select>
                                  </td>
                                )
                                if (ct === 'wand') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.wand} onChange={e => updateRow(group.key, rIdx, 'wand', e.target.value)} className="w-10 text-center bg-transparent outline-none text-xs" />
                                  </td>
                                )
                                if (ct === 'component') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.component} onChange={e => updateRow(group.key, rIdx, 'component', e.target.value)} className="w-20 bg-transparent outline-none text-xs" />
                                  </td>
                                )
                                if (ct === 'fabricLoc') return (
                                  <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-1 py-1">
                                    <input value={row.fabricLoc} onChange={e => updateRow(group.key, rIdx, 'fabricLoc', e.target.value)} className="w-20 bg-transparent outline-none text-xs" />
                                  </td>
                                )
                                return <td key={col.key} className="border border-gray-200 dark:border-gray-700 px-2 py-1" />
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
