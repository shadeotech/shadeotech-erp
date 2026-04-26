'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, Loader2, Plus, Trash2, Upload } from 'lucide-react'

export interface ProductionSheetData {
  id: string
  name: string
  productType: string
  operation: 'MANUAL' | 'MOTORIZED'
  columns: string[]
  rows: Record<string, string>[]
}

export function ProductionSheetsSettings() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [sheets, setSheets] = useState<ProductionSheetData[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newSheetName, setNewSheetName] = useState('')
  const [newSheetProductType, setNewSheetProductType] = useState('')
  const [newSheetOperation, setNewSheetOperation] = useState<'MANUAL' | 'MOTORIZED'>('MANUAL')

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirtySheetRef = useRef<ProductionSheetData | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // CSV import state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [csvParsed, setCsvParsed] = useState<{ title: string; columns: string[]; rows: Record<string, string>[]; filename: string } | null>(null)
  const [csvProductType, setCsvProductType] = useState('')
  const [csvOperation, setCsvOperation] = useState<'MANUAL' | 'MOTORIZED'>('MANUAL')
  const [csvImporting, setCsvImporting] = useState(false)

  const fetchSheets = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/production-sheets', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSheets(data.productionSheets || [])
      if (data.productionSheets?.length > 0 && !selectedId) {
        setSelectedId(data.productionSheets[0].id)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load production sheets', variant: 'destructive' })
      setSheets([])
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    fetchSheets()
  }, [fetchSheets])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const saveSheetData = useCallback(async (sheet: ProductionSheetData) => {
    if (!token) return
    setAutoSaving(true)
    try {
      const res = await fetch(`/api/production-sheets/${sheet.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: sheet.name,
          productType: sheet.productType,
          operation: sheet.operation,
          columns: sheet.columns,
          rows: sheet.rows,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }
      dirtySheetRef.current = null
      setLastSaved(new Date())
    } catch (e) {
      toast({
        title: 'Auto-save failed',
        description: e instanceof Error ? e.message : 'Failed to save',
        variant: 'destructive',
      })
    } finally {
      setAutoSaving(false)
    }
  }, [token, toast])

  const triggerAutoSave = useCallback((sheet: ProductionSheetData) => {
    dirtySheetRef.current = sheet
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      if (dirtySheetRef.current) saveSheetData(dirtySheetRef.current)
    }, 800)
  }, [saveSheetData])

  const selectedSheet = sheets.find((s) => s.id === selectedId)

  const handleCellChange = (rowIndex: number, colKey: string, value: string) => {
    if (!selectedSheet) return
    const newRows = [...selectedSheet.rows]
    if (!newRows[rowIndex]) newRows[rowIndex] = {}
    newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: value }
    const updatedSheet = { ...selectedSheet, rows: newRows }
    setSheets((prev) => prev.map((s) => (s.id === selectedId ? updatedSheet : s)))
    triggerAutoSave(updatedSheet)
  }

  const handleAddRow = () => {
    if (!selectedSheet) return
    const emptyRow: Record<string, string> = {}
    selectedSheet.columns.forEach((c) => (emptyRow[c] = ''))
    emptyRow['Serial'] = String((selectedSheet.rows?.length || 0) + 1)
    const updatedSheet = { ...selectedSheet, rows: [...(selectedSheet.rows || []), emptyRow] }
    setSheets((prev) => prev.map((s) => (s.id === selectedId ? updatedSheet : s)))
    triggerAutoSave(updatedSheet)
  }

  const handleRemoveRow = (rowIndex: number) => {
    if (!selectedSheet) return
    const newRows = selectedSheet.rows.filter((_, i) => i !== rowIndex)
    const updatedSheet = { ...selectedSheet, rows: newRows }
    setSheets((prev) => prev.map((s) => (s.id === selectedId ? updatedSheet : s)))
    triggerAutoSave(updatedSheet)
  }

  const handleAddSheet = async () => {
    if (!token || !newSheetName.trim() || !newSheetProductType.trim()) {
      toast({ title: 'Error', description: 'Name and product type are required', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/production-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newSheetName.trim(),
          productType: newSheetProductType.trim(),
          operation: newSheetOperation,
          columns: ['Serial', 'QTY', 'Area', 'Width', 'Height', 'Cord', 'POS', 'SHADES', 'Fascia', 'Tube', 'Bottom Rail', 'Fabric W', 'Fabric H'],
          rows: [],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create')
      }
      const data = await res.json()
      setSheets((prev) => [...prev, data.productionSheet])
      setSelectedId(data.productionSheet.id)
      setAddDialogOpen(false)
      setNewSheetName('')
      setNewSheetProductType('')
      setNewSheetOperation('MANUAL')
      toast({ title: 'Created', description: 'Production sheet created' })
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to create',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteSheet = async () => {
    if (!token || !selectedSheet) return
    if (!confirm(`Delete "${selectedSheet.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/production-sheets/${selectedSheet.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      setSheets((prev) => prev.filter((s) => s.id !== selectedSheet.id))
      setSelectedId(sheets.find((s) => s.id !== selectedSheet.id)?.id || null)
      toast({ title: 'Deleted', description: 'Production sheet removed' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  // ── CSV import ────────────────────────────────────────────────────────────
  function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    const parse = (line: string): string[] => {
      const result: string[] = []
      let cur = '', inQ = false
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQ = !inQ; continue }
        if (line[i] === ',' && !inQ) { result.push(cur.trim()); cur = ''; continue }
        cur += line[i]
      }
      result.push(cur.trim())
      return result
    }
    const parsed = lines.map(parse)
    // First non-empty row may be a title (single-cell). Check if second row has more columns.
    let headerIdx = 0
    if (parsed.length > 1 && parsed[0].filter(Boolean).length <= 2 && parsed[1].filter(Boolean).length > 2) {
      headerIdx = 1
    }
    const headers = parsed[headerIdx].map(h => h.replace(/﻿/g, '').trim()).filter(Boolean)
    const rows = parsed.slice(headerIdx + 1).filter(r => r.some(c => c.trim()))
    return { headers, rows }
  }

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { headers, rows } = parseCSV(text)
      if (headers.length === 0) {
        toast({ title: 'Invalid CSV', description: 'Could not detect column headers', variant: 'destructive' })
        return
      }
      const dataRows: Record<string, string>[] = rows.map(r => {
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = r[i] ?? '' })
        return obj
      })
      // Auto-detect operation
      const fname = file.name.toLowerCase()
      const detectedOp: 'MANUAL' | 'MOTORIZED' = fname.includes('motor') || fname.includes('motorized') ? 'MOTORIZED' : 'MANUAL'
      // Derive sheet title from filename
      const titleGuess = file.name.replace(/\.csv$/i, '').replace(/_/g, ' ')
      setCsvParsed({ title: titleGuess, columns: headers, rows: dataRows, filename: file.name })
      setCsvProductType('')
      setCsvOperation(detectedOp)
      setCsvDialogOpen(true)
    }
    reader.readAsText(file)
  }

  async function handleCsvImport() {
    if (!token || !csvParsed || !csvProductType.trim()) {
      toast({ title: 'Error', description: 'Product type is required', variant: 'destructive' })
      return
    }
    setCsvImporting(true)
    try {
      const res = await fetch('/api/production-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: csvParsed.title,
          productType: csvProductType.trim(),
          operation: csvOperation,
          columns: csvParsed.columns,
          rows: csvParsed.rows,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Failed') }
      const data = await res.json()
      setSheets(prev => [...prev, data.productionSheet])
      setSelectedId(data.productionSheet.id)
      setCsvDialogOpen(false)
      setCsvParsed(null)
      toast({ title: 'Imported', description: `${csvParsed.rows.length} rows imported from ${csvParsed.filename}` })
    } catch (e) {
      toast({ title: 'Import failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' })
    } finally {
      setCsvImporting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading production sheets...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Production Sheets</CardTitle>
            <CardDescription>
              Manage production sheets for different shade types. Changes are saved automatically.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedSheet && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[72px]">
                {autoSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Saved</span>
                  </>
                ) : null}
              </div>
            )}
            <Select value={selectedId || ''} onValueChange={setSelectedId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select production sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheets.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Hidden CSV file input */}
            <input ref={csvInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvFile} />
            <Button variant="outline" onClick={() => csvInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Sheet
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Production Sheet</DialogTitle>
                  <DialogDescription>
                    Create a new production sheet. You can add rows and edit values after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Sheet Name</Label>
                    <Input
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                      placeholder="e.g., TRI SHADES (SHADEO Fascia & Clutch) MANUAL"
                    />
                  </div>
                  <div>
                    <Label>Product Type</Label>
                    <Input
                      value={newSheetProductType}
                      onChange={(e) => setNewSheetProductType(e.target.value)}
                      placeholder="e.g., TRI Shades"
                    />
                  </div>
                  <div>
                    <Label>Operation</Label>
                    <Select
                      value={newSheetOperation}
                      onValueChange={(v) => setNewSheetOperation(v as 'MANUAL' | 'MOTORIZED')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="MOTORIZED">Motorized</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSheet} disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {selectedSheet && (
              <Button variant="outline" size="icon" onClick={handleDeleteSheet} disabled={deleting} title="Delete sheet">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedSheet ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                <strong>Product:</strong> {selectedSheet.productType}
              </span>
              <span>
                <strong>Operation:</strong> {selectedSheet.operation}
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedSheet.columns.map((col) => (
                      <TableHead key={col} className="min-w-[80px] whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedSheet.rows || []).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {selectedSheet.columns.map((col) => (
                        <TableCell key={col}>
                          <Input
                            value={row[col] ?? ''}
                            onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                            className="h-8 min-w-0"
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(rowIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button variant="outline" onClick={handleAddRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No production sheets yet. Click &quot;Add Sheet&quot; to create one.
          </p>
        )}
      </CardContent>

      {/* CSV Import Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>
              {csvParsed
                ? `Detected ${csvParsed.columns.length} columns and ${csvParsed.rows.length} data rows from ${csvParsed.filename}.`
                : 'Configure the import settings.'}
            </DialogDescription>
          </DialogHeader>
          {csvParsed && (
            <div className="space-y-4">
              <div>
                <Label>Sheet Name</Label>
                <Input
                  value={csvParsed.title}
                  onChange={e => setCsvParsed(prev => prev ? { ...prev, title: e.target.value } : prev)}
                />
              </div>
              <div>
                <Label>Product Type</Label>
                <Input
                  value={csvProductType}
                  onChange={e => setCsvProductType(e.target.value)}
                  placeholder="e.g., Duo Shades"
                />
              </div>
              <div>
                <Label>Operation</Label>
                <Select value={csvOperation} onValueChange={v => setCsvOperation(v as 'MANUAL' | 'MOTORIZED')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="MOTORIZED">Motorized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium">Columns detected: </span>
                {csvParsed.columns.join(', ')}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCsvImport} disabled={csvImporting || !csvProductType.trim()}>
              {csvImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
