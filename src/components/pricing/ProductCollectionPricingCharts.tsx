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
import { usePricingChartStore, type CollectionId } from '@/stores/pricingChartStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { PricingChart } from './PricingChart'
import { Save, Loader2 } from 'lucide-react'

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

export function ProductCollectionPricingCharts() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const { charts, initializeDefaultCharts, getChart, fetchCharts, saveCharts, loading, saving } = usePricingChartStore()
  const [selectedCollection, setSelectedCollection] = useState<CollectionId>('duo_basic')
  const [selectedSubChart, setSelectedSubChart] = useState<string | null>(null)

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
