"use client"

import React, { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"
import { ChartComponent, EventInfo } from "@/types"
import { useParameterStore } from "@/stores/useParameterStore"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { parseParameterKey, createParameterKey } from "@/utils/parameterUtils"
import { 
  EnhancedParameter, 
  extractParametersFromCSV, 
  mergeParametersWithPriority,
  shouldUseDataSourcePriority 
} from "@/utils/dataSourceParameterUtils"

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
  const { settings } = useSettingsStore()

  // Get parameters based on settings
  const enhancedParameters = useMemo(() => {
    const masterParams = getUniqueParameters()
    
    // Check if we should use data source priority
    const useDataSourcePriority = shouldUseDataSourcePriority(settings.toolDefaults.parameterSource) && selectedDataSourceItems && selectedDataSourceItems.length > 0
    
    if (!useDataSourcePriority) {
      // Convert to enhanced parameters without data source info
      return masterParams.map(param => ({
        ...param,
        isFromDataSource: false,
        matchesDataSource: false
      } as EnhancedParameter))
    }
    
    // TODO: Get actual CSV data from selected data sources
    // For now, we'll simulate data source parameters
    const dataSourceParams: EnhancedParameter[] = [
      // Simulate some parameters that would come from a data source
      {
        id: 'ds_temp_avg',
        name: 'Temperature Average',
        unit: '°C',
        plant: selectedDataSourceItems[0]?.plant || '',
        machineNo: selectedDataSourceItems[0]?.machineNo || '',
        source: 'DataSource',
        isFromDataSource: true
      },
      {
        id: 'ds_pressure',
        name: 'Pressure',
        unit: 'kPa',
        plant: selectedDataSourceItems[0]?.plant || '',
        machineNo: selectedDataSourceItems[0]?.machineNo || '',
        source: 'DataSource',
        isFromDataSource: true
      },
      // This one matches a master parameter (Turbine Inlet Temperature 1)
      {
        id: 'ds_turbine_inlet_temp',
        name: 'Turbine Inlet Temperature 1',
        unit: '°C',
        plant: selectedDataSourceItems[0]?.plant || '',
        machineNo: selectedDataSourceItems[0]?.machineNo || '',
        source: 'DataSource',
        isFromDataSource: true
      }
    ]
    
    // Merge master and data source parameters with priority
    return mergeParametersWithPriority(masterParams, dataSourceParams)
  }, [getUniqueParameters, settings.toolDefaults.parameterSource, selectedDataSourceItems])

  // Filter by search query
  const searchFilteredParameters = useMemo(() => {
    if (!searchQuery) return enhancedParameters
    
    const query = searchQuery.toLowerCase()
    return enhancedParameters.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.unit.toLowerCase().includes(query)
    )
  }, [enhancedParameters, searchQuery])

  const handleParameterSelect = (paramKey: string) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    // Reset unit when parameter changes
    newParams[index] = { 
      ...newParams[index], 
      parameter: paramKey,
      unit: undefined,  // Reset to default unit
      unitConversionId: undefined  // Clear any conversion
    }
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
                const isDataSourceRelated = param.isFromDataSource || param.matchesDataSource
                
                return (
                  <CommandItem
                    key={`${paramKey}-${idx}`}
                    value={paramKey}
                    onSelect={handleParameterSelect}
                    className={cn(
                      "flex flex-col items-start relative",
                      isDataSourceRelated && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className={cn(
                        "font-medium",
                        isDataSourceRelated && "text-primary"
                      )}>
                        {param.name}
                      </span>
                      {param.isFromDataSource && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          DS
                        </span>
                      )}
                      {param.matchesDataSource && !param.isFromDataSource && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs",
                      isDataSourceRelated ? "text-primary/70" : "text-muted-foreground"
                    )}>
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