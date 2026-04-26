'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePricingChartStore, type CollectionId, type DimensionPricingTable } from '@/stores/pricingChartStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { PricingChart } from './PricingChart'
import { Save, Loader2, Upload, Download } from 'lucide-react'

const COLLECTIONS: { id: CollectionId; name: string }[] = [
  { id: 'duo_basic', name: 'Duo Basic' },
  { id: 'duo_light_filtering', name: 'Duo Light Filtering' },
  { id: 'duo_room_dimming', name: 'Duo Room Dimming' },
  { id: 'tri_light_filtering', name: 'Tri Light Filtering' },
  { id: 'tri_room_dimming', name: 'Tri Room Dimming' },
  { id: 'roller_room_darkening', name: 'Roller Room Darkening' },
  { id: 'roller_light_filtering', name: 'Roller Light Filtering' },
  { id: 'roller_room_darkening_y', name: 'Roller Room Darkening Y Collection' },
  { id: 'roller_light_filtering_y', name: 'Roller Light Filtering Y Collection' },
  { id: 'roller_sun_screen', name: 'Roller Sun Screen' },
  { id: 'room_darkening_sun_screen', name: 'Room Darkening Sun Screen' },
  { id: 'zip', name: 'ZIP' },
  { id: 'wire_guide', name: 'Wire Guide' },
  { id: 'uni_shades', name: 'Uni Shades' },
]

function downloadTemplate() {
  const widths = [24, 30, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144]
  const lengths = [36, 48, 60, 72, 84, 96, 108, 120, 132, 144]
  const header = ['Length \\ Width', ...widths.map(String)].join(',')
  const rows = lengths.map(len => [String(len), ...widths.map(() => '0')].join(','))
  const notes = [
    '# PRICING TEMPLATE',
    '# - First column: Length (inches)',
    '# - First row: Width (inches)',
    '# - Fill in each cell with the price in dollars (numbers only, no $ sign)',
    '# - Do not change the header row or add extra columns/rows',
    '# - Delete these comment lines before uploading',
    '',
  ]
  const csv = [...notes, header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pricing_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportChartToCsv(table: DimensionPricingTable, name: string) {
  const { widthValues, lengthValues, prices } = table
  const header = ['Length \\ Width', ...widthValues.map(String)].join(',')
  const rows = lengthValues.map(len =>
    [String(len), ...widthValues.map(w => String(prices[String(len)]?.[String(w)] ?? ''))].join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/\s+/g, '_').toLowerCase()}_pricing.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function parsePricingCsv(csv: string): { widthValues: number[]; lengthValues: number[]; prices: Record<string, Record<string, number>> } | string {
  const lines = csv.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  if (lines.length < 2) return 'CSV must have at least a header row and one data row.'

  const headerCells = lines[0].split(',').map(c => c.trim())
  const widthValues = headerCells.slice(1).map(Number).filter(n => !isNaN(n) && n > 0)
  if (widthValues.length === 0) return 'Header row must contain width values after the first column.'

  const lengthValues: number[] = []
  const prices: Record<string, Record<string, number>> = {}

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim())
    const len = Number(cells[0])
    if (isNaN(len) || len <= 0) return `Row ${i + 1}: invalid length value "${cells[0]}".`
    lengthValues.push(len)
    prices[String(len)] = {}
    widthValues.forEach((w, j) => {
      const val = Number(cells[j + 1])
      prices[String(len)][String(w)] = isNaN(val) ? 0 : val
    })
  }

  return { widthValues, lengthValues, prices }
}

export function ProductCollectionPricingCharts() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const { charts, initializeDefaultCharts, getChart, fetchCharts, saveCharts, bulkImportMainTable, loading, saving } = usePricingChartStore()
  const [selectedCollection, setSelectedCollection] = useState<CollectionId>('duo_basic')
  const [selectedSubChart, setSelectedSubChart] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    // Fetch charts from API on mount
    if (token) {
      fetchCharts(token)
    } else if (Object.keys(charts).length === 0) {
      // Fallback to defaults if no token
      initializeDefaultCharts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleExportCsv = () => {
    const chart = getChart(selectedCollection, selectedSubChart || undefined)
    if (!chart) return
    const name = COLLECTIONS.find(c => c.id === selectedCollection)?.name || selectedCollection
    const label = selectedSubChart ? `${name} - ${selectedSubChart}` : name
    exportChartToCsv(chart.mainTable, label)
  }

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const result = parsePricingCsv(text)
      if (typeof result === 'string') {
        toast({ title: 'CSV Error', description: result, variant: 'destructive' })
      } else {
        bulkImportMainTable(selectedCollection, result.widthValues, result.lengthValues, result.prices, selectedSubChart || undefined)
        toast({ title: 'Imported', description: `Price list updated — click Save Charts to persist.` })
      }
      setImporting(false)
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  const handleSave = async () => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      })
      return
    }

    const success = await saveCharts(token)
    if (success) {
      toast({
        title: 'Success',
        description: 'Pricing charts saved successfully',
        variant: 'success',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Failed to save pricing charts',
        variant: 'destructive',
      })
    }
  }

  const currentChart = getChart(selectedCollection)
  const hasSubCharts = currentChart && 'subCharts' in currentChart && currentChart.subCharts && currentChart.subCharts.length > 0

  useEffect(() => {
    // Reset sub-chart selection when collection changes
    if (hasSubCharts && currentChart && 'subCharts' in currentChart) {
      setSelectedSubChart(currentChart.subCharts?.[0]?.id || null)
    } else {
      setSelectedSubChart(null)
    }
  }, [selectedCollection, hasSubCharts, currentChart])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Loading pricing charts...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Product Collection Pricing Charts</CardTitle>
            <CardDescription>
              Manage pricing charts for different product collections. Click on any price cell to edit.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleImportCsv}
                disabled={importing}
              />
              <div className={`inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? 'Importing…' : 'Upload CSV'}
              </div>
            </label>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Charts
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Collection Selector */}
        <div className="space-y-2">
          <Label>Select Collection</Label>
          <Select
            value={selectedCollection}
            onValueChange={(value) => setSelectedCollection(value as CollectionId)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {COLLECTIONS.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sub-Chart Selector for ZIP */}
        {hasSubCharts && currentChart && 'subCharts' in currentChart && (
          <div className="space-y-2">
            <Label>Select Chart</Label>
            <Select
              value={selectedSubChart || undefined}
              onValueChange={(value) => setSelectedSubChart(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a chart" />
              </SelectTrigger>
              <SelectContent>
                {currentChart.subCharts?.map((subChart) => (
                  <SelectItem key={subChart.id} value={subChart.id}>
                    {subChart.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pricing Chart Component */}
        {selectedCollection && (
          <PricingChart
            collectionId={selectedCollection}
            subChartId={selectedSubChart || undefined}
          />
        )}
      </CardContent>
    </Card>
  )
}
