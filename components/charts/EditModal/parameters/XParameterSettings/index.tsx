"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartComponent, EventInfo } from "@/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react"
import { DateTimeRangeSettings } from "./DateTimeRangeSettings"
import { TimeRangeSettings } from "./TimeRangeSettings"
import { ParameterRangeSettings } from "./ParameterRangeSettings"
import { ParameterCombobox } from "@/components/search"
import { parseParameterKey } from "@/utils/parameterUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface XParameterSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems?: EventInfo[]
}

export function XParameterSettings({ editingChart, setEditingChart, selectedDataSourceItems }: XParameterSettingsProps) {
  const [isOpen, setIsOpen] = useState(true)

  // Initialize label for datetime axis if missing
  useEffect(() => {
    if ((editingChart.xAxisType === "datetime" || !editingChart.xAxisType) && !editingChart.xLabel) {
      setEditingChart({
        ...editingChart,
        xLabel: "Datetime"
      })
    }
  }, [editingChart.xAxisType, editingChart.xLabel]) // Run when axis type or label changes

  // Generate auto label based on current parameter
  const getAutoLabel = () => {
    if (editingChart.xAxisType === "datetime") {
      return "Datetime"
    }
    if (!editingChart.xParameter) return ""
    
    const parsed = parseParameterKey(editingChart.xParameter)
    if (parsed) {
      return parsed.unit ? `${parsed.name} [${parsed.unit}]` : parsed.name
    }
    return editingChart.xParameter
  }

  const handleResetLabel = () => {
    setEditingChart({
      ...editingChart,
      xLabel: getAutoLabel(),
    })
  }

  const getRangeSettings = () => {
    const isAutoRange = editingChart.xAxisRange?.auto !== false
    const xAxisType = editingChart.xAxisType || "datetime"

    switch (xAxisType) {
      case "datetime":
        return (
          <DateTimeRangeSettings
            editingChart={editingChart}
            setEditingChart={setEditingChart}
            selectedDataSourceItems={selectedDataSourceItems}
            disabled={isAutoRange}
          />
        )
      case "time":
        return (
          <TimeRangeSettings
            editingChart={editingChart}
            setEditingChart={setEditingChart}
            disabled={isAutoRange}
          />
        )
      case "parameter":
        return (
          <ParameterRangeSettings
            editingChart={editingChart}
            setEditingChart={setEditingChart}
            disabled={isAutoRange}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="border rounded-lg bg-muted/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-3">
          <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/50 transition-colors p-1 rounded">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <h4 className="font-medium text-sm">X Parameter Settings</h4>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* First row: Parameter settings */}
            <div className="flex gap-2 items-end">
              <div className="w-32">
                <Label htmlFor="x-axis-type" className="text-sm mb-1 block">Parameter Type</Label>
                <select
                  id="x-axis-type"
                  className="w-full h-8 px-2 py-1 border rounded-md text-sm"
                  value={editingChart.xAxisType || "datetime"}
                  onChange={(e) => {
                    const newAxisType = e.target.value as "datetime" | "time" | "parameter"
                    let newXParameter = editingChart.xParameter || ""
                    
                    if (newAxisType === "datetime") {
                      // Always use timestamp for datetime
                      newXParameter = "timestamp"
                    } else if ((editingChart.xAxisType || "datetime") === "datetime" && (newAxisType === "time" || newAxisType === "parameter")) {
                      // Switching from datetime to parameter/time - clear timestamp parameter
                      newXParameter = ""
                    }
                    // Otherwise keep existing parameter
                    
                    const newChart = {
                      ...editingChart,
                      xAxisType: newAxisType,
                      xParameter: newXParameter,
                    }
                    
                    // Set xLabel for datetime if auto-update is enabled or label is empty
                    if (newAxisType === "datetime" && (!editingChart.xLabel || (editingChart.autoUpdateXLabel ?? true))) {
                      newChart.xLabel = "Datetime"
                    } else if ((editingChart.xAxisType || "datetime") === "datetime" && newAxisType !== "datetime" && editingChart.xLabel === "Datetime") {
                      // Clear the default "Datetime" label when switching away from datetime
                      newChart.xLabel = ""
                    }
                    
                    setEditingChart(newChart)
                  }}
                >
                  <option value="datetime">Datetime</option>
                  <option value="time" disabled={!selectedDataSourceItems || selectedDataSourceItems.length === 0}>Time (elapsed)</option>
                  <option value="parameter" disabled={!selectedDataSourceItems || selectedDataSourceItems.length === 0}>Parameter</option>
                </select>
              </div>

              <div className="flex-1">
                <Label htmlFor="x-parameter" className="text-sm mb-1 block">
                  {(editingChart.xAxisType || "datetime") === "datetime" ? "Datetime Field" : 
                   editingChart.xAxisType === "time" ? "Time Field" : "Parameter"}
                </Label>
                {(editingChart.xAxisType || "datetime") === "datetime" ? (
                  <Input
                    id="x-parameter"
                    value="Datetime"
                    readOnly
                    className="h-8 text-sm bg-muted"
                  />
                ) : (
                  <ParameterCombobox
                    value={editingChart.xParameter || ""}
                    onChange={(value) => {
                      // Parse the parameter key to get name and unit
                      const parsedParam = parseParameterKey(value)
                      
                      // Set X-axis label if it's empty
                      const newChart = {
                        ...editingChart,
                        xParameter: value,
                      }
                      
                      // Set X-axis label if it's empty OR if auto-update is enabled (default: true)
                      if (parsedParam && (!editingChart.xLabel || (editingChart.autoUpdateXLabel ?? true))) {
                        newChart.xLabel = parsedParam.unit 
                          ? `${parsedParam.name} [${parsedParam.unit}]`
                          : parsedParam.name
                      }
                      
                      setEditingChart(newChart)
                    }}
                    selectedDataSourceItems={selectedDataSourceItems}
                    className="h-8"
                    placeholder={!selectedDataSourceItems || selectedDataSourceItems.length === 0 ? "Select data source first" : "Select Parameter"}
                  />
                )}
              </div>


              <div className="w-36">
                <Label className="text-sm mb-1 block">Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs w-full justify-start"
                      title={editingChart.xAxisRange?.auto !== false ? "Auto range based on data" : `Min: ${editingChart.xAxisRange.min || "Not set"}, Max: ${editingChart.xAxisRange.max || "Not set"}`}
                    >
                      {editingChart.xAxisRange?.auto !== false ? "Auto" : "Custom"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="x-auto-range"
                          checked={editingChart.xAxisRange?.auto !== false}
                          onCheckedChange={(checked) => {
                            setEditingChart({
                              ...editingChart,
                              xAxisRange: {
                                ...editingChart.xAxisRange,
                                auto: checked === true,
                                min: editingChart.xAxisRange?.min || 0,
                                max: editingChart.xAxisRange?.max || 100,
                              }
                            })
                          }}
                        />
                        <Label htmlFor="x-auto-range" className="text-sm">Auto Range</Label>
                      </div>
                      
                      {getRangeSettings()}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Second row: X-axis label */}
            <div className="flex gap-2 items-center">
              <Label htmlFor="x-axis-label" className="text-sm w-32">X-axis Label</Label>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  id="x-axis-label"
                  value={editingChart.xLabel || ""}
                  onChange={(e) => {
                    setEditingChart({
                      ...editingChart,
                      xLabel: e.target.value,
                    })
                  }}
                  placeholder={editingChart.xLabel ? "X-axis label" : `Auto: ${getAutoLabel() || "Select parameter first"}`}
                  disabled={editingChart.autoUpdateXLabel ?? true}
                  className="h-8 text-sm flex-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Checkbox
                          id="auto-update-x-label"
                          checked={editingChart.autoUpdateXLabel ?? true}
                          onCheckedChange={(checked) => {
                            setEditingChart({
                              ...editingChart,
                              autoUpdateXLabel: checked === true,
                            })
                          }}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor="auto-update-x-label"
                          className="text-xs font-normal cursor-pointer ml-1.5"
                        >
                          Auto-update
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Auto-update label when parameter changes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetLabel}
                        className="h-8 w-8 p-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset to auto-generated label</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export { DateTimeRangeSettings } from "./DateTimeRangeSettings"
export { TimeRangeSettings } from "./TimeRangeSettings"
export { ParameterRangeSettings } from "./ParameterRangeSettings"