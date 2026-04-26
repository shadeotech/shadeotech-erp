'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FilterOption {
  label: string
  value: string
  checked: boolean
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  onChange: (value: string, checked: boolean) => void
  onClear?: () => void
}

export function FilterDropdown({
  label,
  options,
  onChange,
  onClear,
}: FilterDropdownProps) {
  const activeCount = options.filter(o => o.checked).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          {label}
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={option.checked}
            onCheckedChange={(checked) => onChange(option.value, checked)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {onClear && activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={onClear}
            >
              Clear filters
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

