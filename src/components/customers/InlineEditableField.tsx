'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditableFieldProps {
  value: string
  placeholder?: string
  onSave: (value: string) => Promise<void>
  className?: string
  multiline?: boolean
  disabled?: boolean
  /** Max length for single-line input (e.g. 12 for phone) */
  maxLength?: number
  /** Sanitize input on change (e.g. for phone: strip invalid chars) */
  sanitize?: (v: string) => string
}

export function InlineEditableField({
  value,
  placeholder = 'Click to edit',
  onSave,
  className,
  multiline = false,
  disabled = false,
  maxLength,
  sanitize,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select?.()
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmed = editValue.trim()
    if (trimmed === value.trim()) {
      setIsEditing(false)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      setIsEditing(false)
    } catch {
      // Caller handles toast
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    }
  }

  if (disabled) {
    return (
      <span className={cn('text-sm', className)}>
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    )
  }

  if (isEditing) {
    return multiline ? (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={cn('min-h-[60px] text-sm', className)}
        placeholder={placeholder}
      />
    ) : (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={editValue}
        onChange={(e) => {
          let v = e.target.value
          if (sanitize) v = sanitize(v)
          if (maxLength && v.length > maxLength) v = v.slice(0, maxLength)
          setEditValue(v)
        }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        maxLength={maxLength}
        className={cn('h-8 text-sm', className)}
        placeholder={placeholder}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        'group flex items-center gap-1.5 w-full text-left rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-muted/60 transition-colors min-h-[24px]',
        className
      )}
    >
      <span className={cn('break-words flex-1', !value && 'text-muted-foreground')}>
        {value || placeholder}
      </span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 flex-shrink-0" />
    </button>
  )
}
