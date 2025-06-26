"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import { createParameterKey } from '@/utils/parameterUtils'
import { cn } from '@/lib/utils'
import { useParameterSelection } from '@/hooks/useParameterSelection'
import { useParameterInfo } from '@/hooks/useParameterInfo'
import { EventInfo } from '@/types'

interface ParameterComboboxProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  selectedDataSourceItems?: EventInfo[]
  disabled?: boolean
}

export function ParameterCombobox({ 
  value, 
  onChange, 
  className, 
  placeholder = "Select Parameter",
  selectedDataSourceItems,
  disabled = false
}: ParameterComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const { searchFilteredParameters } = useParameterSelection({
    selectedDataSourceItems,
    searchQuery
  })
  
  const { name: currentName, unit: currentUnit } = useParameterInfo(value)

  const handleParameterSelect = (paramKey: string) => {
    onChange(paramKey)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-8 w-full justify-between text-sm font-normal", className)}
        >
          <div className="flex items-center text-left flex-1 min-w-0">
            {currentName ? (
              <span className="truncate">{currentName} {currentUnit && `(${currentUnit})`}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false} className="overflow-hidden">
          <CommandInput
            placeholder="Search parameters..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No parameter found.</CommandEmpty>
          <CommandGroup>
            <div 
              className="max-h-[300px] overflow-y-auto overflow-x-hidden" 
              onWheel={(e) => e.stopPropagation()}
            >
              {searchFilteredParameters.map((param, idx) => {
                const paramKey = createParameterKey(param.name, param.unit)
                
                return (
                  <CommandItem
                    key={`${paramKey}-${idx}`}
                    value={paramKey}
                    onSelect={handleParameterSelect}
                    className="flex flex-col items-start relative"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium">
                        {param.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {param.unit}
                    </span>
                  </CommandItem>
                )
              })}
            </div>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}