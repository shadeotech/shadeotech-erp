'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

const CASSETTE_TYPES = [
  { id: 'SQUARE CASETTE', label: 'Square Cassette' },
  { id: 'ROUND CASETTE', label: 'Round Cassette' },
  { id: 'OPEN_ROLL', label: 'Open Roll', description: 'No cassette – fascia image will appear' },
]

const SQUARE_COLORS = ['White', 'Ivory', 'Bronze', 'Anodized', 'Black']
const ROUND_COLORS = ['White', 'Ivory', 'Grey', 'Bronze', 'Black']

export interface CassetteSelectionResult {
  cassetteType: string
  cassetteColor?: string
  fabricWrap: 'same' | 'other'
}

interface CassetteSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (result: CassetteSelectionResult) => void
  onFabricWrapOther?: () => void
  selectedCassetteType?: string
  selectedCassetteColor?: string
  selectedFabricWrap?: 'same' | 'other' | 'none'
  disableFabricWrap?: boolean
}

export function CassetteSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  onFabricWrapOther,
  selectedCassetteType,
  selectedCassetteColor,
  selectedFabricWrap,
  disableFabricWrap = false,
}: CassetteSelectionDialogProps) {
  const [step, setStep] = useState<'type' | 'color'>('type')
  const [selectedType, setSelectedType] = useState<string | undefined>(selectedCassetteType)

  useEffect(() => {
    if (open) {
      setStep('type')
      setSelectedType(selectedCassetteType)
    }
  }, [open, selectedCassetteType])

  const colors = selectedType === 'SQUARE CASETTE' ? SQUARE_COLORS : ROUND_COLORS

  const handleTypeSelect = (typeId: string) => {
    if (typeId === 'OPEN_ROLL') {
      onSelect({ cassetteType: 'OPEN_ROLL', fabricWrap: 'same' })
      onOpenChange(false)
      return
    }
    setSelectedType(typeId)
    setStep('color')
  }

  const handleColorSelect = (color: string) => {
    onSelect({ cassetteType: selectedType!, cassetteColor: color, fabricWrap: 'same' })
    onOpenChange(false)
  }

  const handleFabricWrapSame = () => {
    onSelect({ cassetteType: selectedType!, cassetteColor: undefined, fabricWrap: 'same' })
    onOpenChange(false)
  }

  const handleFabricWrapOther = () => {
    onSelect({ cassetteType: selectedType!, cassetteColor: undefined, fabricWrap: 'other' })
    onOpenChange(false)
    if (onFabricWrapOther) onFabricWrapOther()
  }

  const isSwatch = (color: string) => selectedCassetteColor === color && selectedCassetteType === selectedType

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' ? 'Select Cassette Type' : `${selectedType === 'SQUARE CASETTE' ? 'Square' : 'Round'} Cassette – Color / Finish`}
          </DialogTitle>
          <DialogDescription>
            {step === 'type'
              ? 'Choose a cassette type for this product.'
              : 'Select a color or choose a fabric wrap finish.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Type */}
        {step === 'type' && (
          <div className="grid gap-3 py-4">
            {CASSETTE_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTypeSelect(t.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary ${
                  selectedCassetteType === t.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className="font-medium">{t.label}</div>
                {t.description && (
                  <div className="text-sm text-muted-foreground mt-0.5">{t.description}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Color + Fabric Wrap (treated as color options) */}
        {step === 'color' && (
          <div className="space-y-5 py-4">
            {/* Color swatches */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-all hover:border-primary ${
                    isSwatch(color) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>

            {/* Fabric Wrap — same level as colors */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">Fabric Wrap</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={disableFabricWrap ? undefined : handleFabricWrapSame}
                  disabled={disableFabricWrap}
                  title={disableFabricWrap ? 'Fabric width is less than 3" — cannot wrap with this fabric' : undefined}
                  className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                    disableFabricWrap
                      ? 'border-border opacity-40 cursor-not-allowed'
                      : selectedFabricWrap === 'same' && !selectedCassetteColor && selectedCassetteType === selectedType
                      ? 'border-primary bg-primary/5 hover:border-primary'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  Same as selected fabric
                  {disableFabricWrap && (
                    <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-normal">Fabric width &lt; 3&quot;</span>
                  )}
                </button>
                <button
                  onClick={handleFabricWrapOther}
                  className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-all hover:border-primary ${
                    selectedFabricWrap === 'other' && selectedCassetteType === selectedType
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  Other fabric…
                </button>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setStep('type')} className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
