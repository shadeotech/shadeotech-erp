'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, X } from 'lucide-react'
import Image from 'next/image'
import type { Fabric } from '@/types/fabric'
import { initialFabricData, getImagePath } from '@/constants/fabrics'

interface FabricSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (fabric: Fabric) => void
  selectedFabricId?: string
}

export function FabricSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  selectedFabricId,
}: FabricSelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all')
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [selectedOpacity, setSelectedOpacity] = useState<string>('all')

  const categories = useMemo(() => {
    return Array.from(new Set(initialFabricData.map((f) => f.category)))
  }, [])

  const subcategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return Array.from(new Set(initialFabricData.map((f) => f.subcategory)))
    }
    return Array.from(
      new Set(
        initialFabricData
          .filter((f) => f.category === selectedCategory)
          .map((f) => f.subcategory)
      )
    )
  }, [selectedCategory])

  const collections = useMemo(() => {
    return Array.from(
      new Set(initialFabricData.map((f) => f.collection).filter(Boolean))
    )
  }, [])

  const opacities = useMemo(() => {
    return Array.from(
      new Set(initialFabricData.map((f) => f.opacity).filter((op): op is string => typeof op === 'string' && op.length > 0))
    )
  }, [])

  const filteredFabrics = useMemo(() => {
    return initialFabricData.filter((fabric) => {
      const matchesSearch =
        fabric.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fabric.collection.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fabric.mountType &&
          fabric.mountType.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory =
        selectedCategory === 'all' || fabric.category === selectedCategory
      const matchesSubcategory =
        selectedSubcategory === 'all' ||
        fabric.subcategory === selectedSubcategory
      const matchesCollection =
        selectedCollection === 'all' || fabric.collection === selectedCollection
      const matchesOpacity =
        selectedOpacity === 'all' || fabric.opacity === selectedOpacity

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory &&
        matchesCollection &&
        matchesOpacity
      )
    })
  }, [
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    selectedCollection,
    selectedOpacity,
  ])

  const handleSelect = (fabric: Fabric) => {
    onSelect(fabric)
    onOpenChange(false)
    // Reset filters
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedSubcategory('all')
    setSelectedCollection('all')
    setSelectedOpacity('all')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Fabric</DialogTitle>
          <DialogDescription>
            Choose a fabric from the gallery. Click on an image to select it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by color, collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select
                  value={selectedSubcategory}
                  onValueChange={setSelectedSubcategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Collection</Label>
                <Select
                  value={selectedCollection}
                  onValueChange={setSelectedCollection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Collections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collections</SelectItem>
                    {collections.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Opacity</Label>
                <Select
                  value={selectedOpacity}
                  onValueChange={setSelectedOpacity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Opacities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Opacities</SelectItem>
                    {opacities.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Fabric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFabrics.map((fabric) => (
              <button
                key={fabric.id}
                onClick={() => handleSelect(fabric)}
                className={`group relative aspect-square rounded-lg border-2 overflow-hidden transition-all hover:border-primary ${
                  selectedFabricId === fabric.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={getImagePath(fabric.imageFilename)}
                    alt={fabric.color}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs text-center">
                  <div className="font-medium">{fabric.color}</div>
                  {fabric.collection && (
                    <div className="text-xs opacity-80">{fabric.collection}</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {filteredFabrics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No fabrics found matching your filters.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
