"use client"

import React, { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"
import { ChartComponent, EventInfo } from "@/types"
import { useParameterStore } from "@/stores/useParameterStore"
import { parseParameterKey, createParameterKey } from "@/utils/parameterUtils"
import { EnhancedParameter } from "@/utils/dataSourceParameterUtils"
import { getDefaultColor } from "@/utils/chartColors"
import { useCSVDataStore } from "@/stores/useCSVDataStore"
import { getParametersFromDataSources } from "@/utils/dataSourceCSVUtils"

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
  const { datasets } = useCSVDataStore()

  // Get parameters from CSV data sources only
  const enhancedParameters = useMemo(() => {
    if (!selectedDataSourceItems || selectedDataSourceItems.length === 0) {
      return []
    }
    
    // Extract parameters from actual CSV data
    return getParametersFromDataSources(selectedDataSourceItems, datasets)
  }, [selectedDataSourceItems, datasets])

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
    
    // Parse the parameter key to get the name and unit
    const parsedParam = parseParameterKey(paramKey)
    
    // Set parameter with its default unit
    newParams[index] = { 
      ...newParams[index], 
      parameter: paramKey,
      unit: parsedParam?.unit || undefined,  // Set default unit from parameter
      unitConversionId: undefined  // Clear any conversion
    }
    
    if (parsedParam && newParams[index]) {
      const axisNo = newParams[index].axisNo || 1
      
      // Only update label if this is the first parameter on this axis
      const isFirstParamOnAxis = newParams
        .filter((p, idx) => idx < index && (p.axisNo || 1) === axisNo && p.parameter)
        .length === 0
      
      // Update plot style legend if in parameter mode
      let updatedPlotStyles = editingChart.plotStyles
      if (editingChart.plotStyles?.mode === 'parameter' && editingChart.plotStyles.byParameter) {
        updatedPlotStyles = {
          ...editingChart.plotStyles,
          byParameter: {
            ...editingChart.plotStyles.byParameter,
            [index]: {
              ...editingChart.plotStyles.byParameter[index],
              legendText: parsedParam.name
            }
          }
        }
      } else if (editingChart.plotStyles?.mode === 'both' && editingChart.plotStyles.byBoth && selectedDataSourceItems) {
        // Update legend for all data source combinations in 'both' mode
        const updatedByBoth = { ...editingChart.plotStyles.byBoth }
        selectedDataSourceItems.forEach((dataSource, dataSourceIndex) => {
          const key = `${dataSource.id}-${index}`
          // Create new entry if it doesn't exist
          if (!updatedByBoth[key]) {
            const defaultColor = getDefaultColor(dataSourceIndex)
            updatedByBoth[key] = {
              marker: {
                type: 'circle',
                size: 6,
                borderColor: defaultColor,
                fillColor: defaultColor
              },
              line: {
                style: 'solid',
                width: 2,
                color: defaultColor
              },
              visible: true,
              legendText: `${dataSource.label}-${parsedParam.name}`
            }
          } else {
            updatedByBoth[key] = {
              ...updatedByBoth[key],
              legendText: `${dataSource.label}-${parsedParam.name}`
            }
          }
        })
        updatedPlotStyles = {
          ...editingChart.plotStyles,
          byBoth: updatedByBoth
        }
      }
      
      // Set Y-axis label to parameter name if label is empty OR if auto-update is enabled (default: true)
      const currentLabel = editingChart.yAxisLabels?.[axisNo]
      if (isFirstParamOnAxis && (!currentLabel || (editingChart.autoUpdateYLabels ?? true))) {
        // Include unit if available (matching X-axis behavior)
        const label = parsedParam.unit 
          ? `${parsedParam.name} [${parsedParam.unit}]`
          : parsedParam.name
          
        setEditingChart({ 
          ...editingChart, 
          yAxisParams: newParams,
          yAxisLabels: {
            ...editingChart.yAxisLabels,
            [axisNo]: label
          },
          plotStyles: updatedPlotStyles
        })
        setOpen(false)
        return
      }
    }
    
    // Update plot style legend if in parameter mode (for cases where Y-axis label was not updated)
    let updatedPlotStyles = editingChart.plotStyles
    if (parsedParam && editingChart.plotStyles?.mode === 'parameter' && editingChart.plotStyles.byParameter) {
      updatedPlotStyles = {
        ...editingChart.plotStyles,
        byParameter: {
          ...editingChart.plotStyles.byParameter,
          [index]: {
            ...editingChart.plotStyles.byParameter[index],
            legendText: parsedParam.name
          }
        }
      }
    } else if (parsedParam && editingChart.plotStyles?.mode === 'both' && editingChart.plotStyles.byBoth && selectedDataSourceItems) {
      // Update legend for all data source combinations in 'both' mode
      const updatedByBoth = { ...editingChart.plotStyles.byBoth }
      selectedDataSourceItems.forEach((dataSource, dataSourceIndex) => {
        const key = `${dataSource.id}-${index}`
        // Create new entry if it doesn't exist
        if (!updatedByBoth[key]) {
          const defaultColor = getDefaultColor(dataSourceIndex)
          updatedByBoth[key] = {
            marker: {
              type: 'circle',
              size: 6,
              borderColor: defaultColor,
              fillColor: defaultColor
            },
            line: {
              style: 'solid',
              width: 2,
              color: defaultColor
            },
            visible: true,
            legendText: `${dataSource.label}-${parsedParam.name}`
          }
        } else {
          updatedByBoth[key] = {
            ...updatedByBoth[key],
            legendText: `${dataSource.label}-${parsedParam.name}`
          }
        }
      })
      updatedPlotStyles = {
        ...editingChart.plotStyles,
        byBoth: updatedByBoth
      }
    }
    
    setEditingChart({ ...editingChart, yAxisParams: newParams, plotStyles: updatedPlotStyles })
    setOpen(false)
  }

  // Get current parameter info from stored key
  const { name: currentName, unit: currentUnit } = useMemo(() => {
    if (!parameter) return { name: '', unit: '' }
    
    const parsed = parseParameterKey(parameter)
    if (parsed) return parsed
    
    return { name: '', unit: '' }
  }, [parameter])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-full justify-between text-sm font-normal"
          disabled={!selectedDataSourceItems || selectedDataSourceItems.length === 0}
        >
          <div className="flex items-center text-left flex-1 min-w-0">
            {currentName ? (
              <span className="truncate">{currentName} ({currentUnit})</span>
            ) : (
              <span className="text-muted-foreground">
                {selectedDataSourceItems && selectedDataSourceItems.length > 0 
                  ? "Select Parameter" 
                  : "Select data source first"}
              </span>
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