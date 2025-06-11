"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"
import { ChartComponent, EventInfo } from "@/types"
import { useParameterStore } from "@/stores/useParameterStore"
import { parseParameterKey, createParameterKey } from "@/utils/parameterUtils"

interface RegularParameterRowProps {
  index: number
  parameter: string
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems?: EventInfo[]
}

export function RegularParameterRow({
  index,
  parameter,
  editingChart,
  setEditingChart,
  selectedDataSourceItems,
}: RegularParameterRowProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { parameters, getUniqueParameters } = useParameterStore()

  // Get unique parameters (by name + unit)
  const uniqueParameters = useMemo(() => getUniqueParameters(), [getUniqueParameters])

  // Filter by search query
  const searchFilteredParameters = useMemo(() => {
    if (!searchQuery) return uniqueParameters
    
    const query = searchQuery.toLowerCase()
    return uniqueParameters.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.unit.toLowerCase().includes(query)
    )
  }, [uniqueParameters, searchQuery])

  const handleParameterSelect = (paramKey: string) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    newParams[index] = { ...newParams[index], parameter: paramKey }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
    setOpen(false)
  }

  // Get current parameter info from stored key
  const { name: currentName, unit: currentUnit } = useMemo(() => {
    if (!parameter) return { name: '', unit: '' }
    
    const parsed = parseParameterKey(parameter)
    if (parsed) return parsed
    
    // Legacy format - try to find matching parameter
    const foundParam = parameters.find(p => 
      p.id === parameter || p.name === parameter
    )
    
    return foundParam 
      ? { name: foundParam.name, unit: foundParam.unit }
      : { name: '', unit: '' }
  }, [parameter, parameters])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-full justify-between text-sm font-normal"
        >
          <div className="flex items-center text-left flex-1 min-w-0">
            {currentName ? (
              <span className="truncate">{currentName} ({currentUnit})</span>
            ) : (
              <span className="text-muted-foreground">Select Parameter</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start" sideOffset={4}>
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
                    className="flex flex-col items-start"
                  >
                    <span className="font-medium">{param.name}</span>
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