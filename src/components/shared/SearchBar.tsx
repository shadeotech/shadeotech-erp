'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  className?: string
  debounceMs?: number
}

export function SearchBar({
  placeholder = 'Search...',
  value: externalValue,
  onChange,
  onSearch,
  className,
  debounceMs = 300,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('')
  const value = externalValue ?? internalValue

  const handleChange = useCallback((newValue: string) => {
    if (externalValue === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }, [externalValue, onChange])

  const handleClear = () => {
    handleChange('')
    onSearch?.('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch?.(value)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

