'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Edit,
  Save,
  X,
  TrendingUp,
} from 'lucide-react'
import {
  usePricingChartStore,
  type CollectionId,
  type PricingChart as PricingChartType,
  type PricingSubChart,
} from '@/stores/pricingChartStore'

interface PricingChartProps {
  collectionId: CollectionId
  subChartId?: string
}

export function PricingChart({ collectionId, subChartId }: PricingChartProps) {
  const {
    getChart,
    updateMainTablePrice,
    updateCassettePrice,
    addMainTableRow,
    addMainTableColumn,
    removeMainTableRow,
    removeMainTableColumn,
    addCassetteType,
    removeCassetteType,
    updateNotes,
    bulkIncreasePrices,
  } = usePricingChartStore()

  const chartData = getChart(collectionId, subChartId) as PricingChartType | PricingSubChart | null

  const [editingCell, setEditingCell] = useState<{ type: 'main' | 'cassette'; row: string; col: string } | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [addRowDialogOpen, setAddRowDialogOpen] = useState(false)
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false)
  const [addCassetteDialogOpen, setAddCassetteDialogOpen] = useState(false)
  const [bulkIncreaseDialogOpen, setBulkIncreaseDialogOpen] = useState(false)
  const [newRowValue, setNewRowValue] = useState('')
  const [newColumnValue, setNewColumnValue] = useState('')
  const [newCassetteType, setNewCassetteType] = useState('')
  const [bulkPercent, setBulkPercent] = useState('')
  const [bulkFlat, setBulkFlat] = useState('')
  const [editingMainNote, setEditingMainNote] = useState(false)
  const [editingCassetteNote, setEditingCassetteNote] = useState(false)
  const [mainNote, setMainNote] = useState('')
  const [cassetteNote, setCassetteNote] = useState('')

  useEffect(() => {
    if (chartData) {
      setMainNote(chartData.notes.mainTableNote)
      setCassetteNote(chartData.notes.cassetteTableNote || '')
    }
  }, [chartData])

  if (!chartData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No chart data available. Please initialize charts.
        </CardContent>
      </Card>
    )
  }

  const isSubChart = 'id' in chartData
  const mainTable = chartData.mainTable
  const cassetteTable = chartData.cassetteTable

  const handleCellClick = (type: 'main' | 'cassette', row: string, col: string) => {
    const currentValue = type === 'main'
      ? mainTable.prices[row]?.[col] || 0
      : cassetteTable?.prices[row]?.[col] || 0
    setEditingCell({ type, row, col })
    setEditingValue(String(currentValue))
  }

  const handleCellSave = () => {
    if (!editingCell) return

    const price = parseFloat(editingValue) || 0

    if (editingCell.type === 'main') {
      updateMainTablePrice(collectionId, parseInt(editingCell.row), parseInt(editingCell.col), price, subChartId)
    } else {
      updateCassettePrice(collectionId, editingCell.row, parseInt(editingCell.col), price, subChartId)
    }

    setEditingCell(null)
    setEditingValue('')
  }

  const handleAddRow = () => {
    const length = parseInt(newRowValue)
    if (length && !mainTable.lengthValues.includes(length)) {
      addMainTableRow(collectionId, length, subChartId)
      setNewRowValue('')
      setAddRowDialogOpen(false)
    }
  }

  const handleAddColumn = () => {
    const width = parseInt(newColumnValue)
    if (width && !mainTable.widthValues.includes(width)) {
      addMainTableColumn(collectionId, width, subChartId)
      setNewColumnValue('')
      setAddColumnDialogOpen(false)
    }
  }

  const handleAddCassetteType = () => {
    if (newCassetteType && cassetteTable && !cassetteTable.cassetteTypes.includes(newCassetteType)) {
      addCassetteType(collectionId, newCassetteType, subChartId)
      setNewCassetteType('')
      setAddCassetteDialogOpen(false)
    }
  }

  const handleBulkIncrease = () => {
    const percent = parseFloat(bulkPercent) || 0
    const flat = parseFloat(bulkFlat) || 0
    bulkIncreasePrices(collectionId, percent, flat, subChartId)
    setBulkPercent('')
    setBulkFlat('')
    setBulkIncreaseDialogOpen(false)
  }

  const handleSaveNotes = () => {
    updateNotes(collectionId, mainNote, cassetteNote || undefined, subChartId)
    setEditingMainNote(false)
    setEditingCassetteNote(false)
  }

  const fabrics = chartData.fabrics || []
  const fabricLabel = isSubChart 
    ? `${(chartData as PricingSubChart).name} Fabrics:`
    : `${(chartData as PricingChartType).collectionName} Fabrics:`

  // For ZIP and Wire Guide collections, show "HEIGHT:" instead of "LENGTH TO:"
  const lengthLabel = (collectionId === 'zip' || collectionId === 'wire_guide') ? 'HEIGHT:' : 'LENGTH TO:'

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isSubChart ? (chartData as PricingSubChart).name : (chartData as PricingChartType).collectionName}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkIncreaseDialogOpen(true)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Bulk Increase
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddRowDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddColumnDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </div>

      {/* Fabrics Section */}
      {fabrics.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {fabricLabel}
          </h3>
          <div className="flex flex-wrap gap-2">
            {fabrics.map((fabric, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
              >
                {fabric}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Dimension-Based Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    colSpan={2}
                    className="font-semibold text-gray-900 dark:text-white text-center min-w-[120px] border border-gray-300 dark:border-gray-700"
                    style={{ backgroundColor: '#D9D9D9' }}
                  >
                    WIDTH TO:
                  </TableHead>
                  {mainTable.widthValues.map((width) => (
                    <TableHead
                      key={width}
                      className="font-semibold text-gray-900 dark:text-white text-center min-w-[60px] border border-gray-300 dark:border-gray-700"
                      style={{ backgroundColor: '#D9D9D9' }}
                    >
                      <div className="flex items-center justify-center gap-1 group">
                        <span>{width}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMainTableColumn(collectionId, width, subChartId)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Data rows with length values */}
                {mainTable.lengthValues.map((length, index) => (
                  <TableRow key={length}>
                    {index === 0 && (
                      <TableCell 
                        rowSpan={mainTable.lengthValues.length}
                        className="font-semibold text-gray-900 dark:text-white sticky left-0 z-10 min-w-[100px] align-middle"
                        style={{ 
                          border: 'none',
                          borderRight: '1px solid rgb(209 213 219)',
                          borderTop: '1px solid rgb(209 213 219)',
                          borderBottom: '1px solid rgb(209 213 219)',
                        }}
                      >
                        <div className="flex items-center justify-center h-full" style={{ minHeight: `${mainTable.lengthValues.length * 40}px` }}>
                          <span 
                            className="text-center whitespace-nowrap"
                            style={{
                              writingMode: 'vertical-rl',
                              textOrientation: 'mixed',
                              transform: 'rotate(180deg)',
                            }}
                          >
                            {lengthLabel}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell 
                      className="font-semibold text-gray-900 dark:text-white text-center border border-gray-300 dark:border-gray-700"
                      style={{ backgroundColor: '#D9D9D9' }}
                    >
                      <div className="flex items-center justify-center gap-1 group">
                        <span>{length}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMainTableRow(collectionId, length, subChartId)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    {mainTable.widthValues.map((width) => {
                      const isEditing = editingCell?.type === 'main' &&
                        editingCell.row === String(length) &&
                        editingCell.col === String(width)
                      const price = mainTable.prices[String(length)]?.[String(width)] || 0

                      return (
                        <TableCell
                          key={width}
                          className={`text-center cursor-pointer border border-gray-300 dark:border-gray-700 ${
                            isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => handleCellClick('main', String(length), String(width))}
                        >
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={handleCellSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellSave()
                                if (e.key === 'Escape') {
                                  setEditingCell(null)
                                  setEditingValue('')
                                }
                              }}
                              className="w-20 h-8 text-center border border-gray-300"
                              autoFocus
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-white">{price || '-'}</span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Notes Section */}
        <div className="px-4 py-2">
          {editingMainNote ? (
            <div className="space-y-2">
              <Textarea
                value={mainNote}
                onChange={(e) => setMainNote(e.target.value)}
                className="text-xs"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingMainNote(false)
                    setMainNote(chartData.notes.mainTableNote)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 group">
              <p className="text-xs text-muted-foreground italic flex-1">{mainNote}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingMainNote(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cassette/Fascia Options Table */}
      {cassetteTable && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cassette/Fascia Options</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddCassetteDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Cassette Type
            </Button>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-white dark:bg-gray-900 font-semibold text-gray-900 dark:text-white sticky left-0 z-10 min-w-[180px] border border-gray-300 dark:border-gray-700">
                        {/* Empty top-left cell */}
                      </TableHead>
                      {cassetteTable.widthValues.map((width) => (
                        <TableHead
                          key={width}
                          className="bg-white dark:bg-gray-900 font-semibold text-gray-900 dark:text-white text-center min-w-[60px] border border-gray-300 dark:border-gray-700"
                        >
                          {width}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cassetteTable.cassetteTypes.map((type) => (
                      <TableRow key={type}>
                        <TableCell className="bg-white dark:bg-gray-900 font-semibold text-gray-900 dark:text-white sticky left-0 z-10 border border-gray-300 dark:border-gray-700">
                          <div className="flex items-center gap-1 group">
                            <span>{type.replace('_', ' ')}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCassetteType(collectionId, type, subChartId)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        {cassetteTable.widthValues.map((width) => {
                          const isEditing = editingCell?.type === 'cassette' &&
                            editingCell.row === type &&
                            editingCell.col === String(width)
                          const price = cassetteTable.prices[type]?.[String(width)] || 0

                          return (
                            <TableCell
                              key={width}
                              className={`text-center cursor-pointer border border-gray-300 dark:border-gray-700 ${
                                isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                              onClick={() => handleCellClick('cassette', type, String(width))}
                            >
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={handleCellSave}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave()
                                    if (e.key === 'Escape') {
                                      setEditingCell(null)
                                      setEditingValue('')
                                    }
                                  }}
                                  className="w-20 h-8 text-center border border-gray-300"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-gray-900 dark:text-white">{price || '-'}</span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Notes Section */}
            {chartData.notes.cassetteTableNote && (
              <div className="px-4 py-2">
                {editingCassetteNote ? (
                  <div className="space-y-2">
                    <Textarea
                      value={cassetteNote}
                      onChange={(e) => setCassetteNote(e.target.value)}
                      className="text-xs"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveNotes}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCassetteNote(false)
                          setCassetteNote(chartData.notes.cassetteTableNote || '')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 group">
                    <p className="text-xs text-muted-foreground italic flex-1">{chartData.notes.cassetteTableNote}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCassetteNote(true)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Row Dialog */}
      <Dialog open={addRowDialogOpen} onOpenChange={setAddRowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Row (Length)</DialogTitle>
            <DialogDescription>
              Add a new length value to the pricing table
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Length Value</Label>
              <Input
                type="number"
                value={newRowValue}
                onChange={(e) => setNewRowValue(e.target.value)}
                placeholder="e.g., 150"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRowDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRow}>Add Row</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Column (Width)</DialogTitle>
            <DialogDescription>
              Add a new width value to the pricing table
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Width Value</Label>
              <Input
                type="number"
                value={newColumnValue}
                onChange={(e) => setNewColumnValue(e.target.value)}
                placeholder="e.g., 150"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddColumn}>Add Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cassette Type Dialog */}
      <Dialog open={addCassetteDialogOpen} onOpenChange={setAddCassetteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cassette Type</DialogTitle>
            <DialogDescription>
              Add a new cassette type to the pricing table
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cassette Type</Label>
              <Input
                value={newCassetteType}
                onChange={(e) => setNewCassetteType(e.target.value)}
                placeholder="e.g., CUSTOM CASETTE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCassetteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCassetteType}>Add Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Increase Dialog */}
      <Dialog open={bulkIncreaseDialogOpen} onOpenChange={setBulkIncreaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Increase</DialogTitle>
            <DialogDescription>
              Apply a percentage or flat increase to all prices in this chart
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Percentage Increase (%)</Label>
              <Input
                type="number"
                value={bulkPercent}
                onChange={(e) => setBulkPercent(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Flat Increase ($)</Label>
              <Input
                type="number"
                value={bulkFlat}
                onChange={(e) => setBulkFlat(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkIncreaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkIncrease}>Apply Increase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
