'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface InlineEditableSelectProps {
  value: string
  options: Option[]
  onSave: (value: string) => Promise<void>
  className?: string
  displayClassName?: string
  disabled?: boolean
  inline?: boolean
}

export function InlineEditableSelect({
  value,
  options,
  onSave,
  className,
  displayClassName,
  disabled = false,
  inline = false,
}: InlineEditableSelectProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleSave = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(newValue)
      setIsEditing(false)
    } catch {
      // Caller handles toast
    } finally {
      setSaving(false)
    }
  }

  const displayLabel = options.find((o) => o.value === value)?.label || value

  if (disabled) {
    return (
      <span className={cn('text-sm', displayClassName)}>{displayLabel}</span>
    )
  }

  if (isEditing) {
    return (
      <Select
        value={editValue}
        onValueChange={(v) => handleSave(v)}
        disabled={saving}
      >
        <SelectTrigger className={cn('h-8 text-sm w-full', className)}>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        'group flex items-center gap-1.5 text-left rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-muted/60 transition-colors min-h-[24px]',
        inline ? 'w-auto inline-flex' : 'w-full',
        displayClassName
      )}
    >
      <span className="flex-1">{displayLabel}</span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 flex-shrink-0" />
    </button>
  )
}
