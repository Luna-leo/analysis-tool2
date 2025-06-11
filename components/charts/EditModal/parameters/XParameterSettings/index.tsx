"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartComponent, EventInfo } from "@/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { DateTimeRangeSettings } from "./DateTimeRangeSettings"
import { TimeRangeSettings } from "./TimeRangeSettings"
import { ParameterRangeSettings } from "./ParameterRangeSettings"
import { ParameterCombobox } from "@/components/search"

interface XParameterSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems?: EventInfo[]
}

export function XParameterSettings({ editingChart, setEditingChart, selectedDataSourceItems }: XParameterSettingsProps) {
  const [isOpen, setIsOpen] = useState(true)

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
          <div className="px-3 pb-3">
            <div className="flex gap-2 items-end">
              <div className="w-32">
                <Label htmlFor="x-axis-type" className="text-sm mb-1 block">Parameter Type</Label>
                <select
                  id="x-axis-type"
                  className="w-full h-8 px-2 py-1 border rounded-md text-sm"
                  value={editingChart.xAxisType || "datetime"}
                  onChange={(e) => {
                    const newAxisType = e.target.value as "datetime" | "time" | "parameter"
                    setEditingChart({
                      ...editingChart,
                      xAxisType: newAxisType,
                      // Clear xParameter when switching to datetime
                      ...(newAxisType === "datetime" && { xParameter: "" }),
                    })
                  }}
                >
                  <option value="datetime">Datetime</option>
                  <option value="time">Time (elapsed)</option>
                  <option value="parameter">Parameter</option>
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
                      setEditingChart({
                        ...editingChart,
                        xParameter: value,
                      })
                    }}
                    selectedDataSourceItems={selectedDataSourceItems}
                    className="h-8"
                  />
                )}
              </div>

              <div className="flex-1">
                <Label htmlFor="x-axis-label" className="text-sm mb-1 block">X-axis Label</Label>
                <Input
                  id="x-axis-label"
                  value={editingChart.xLabel || ""}
                  onChange={(e) => {
                    setEditingChart({
                      ...editingChart,
                      xLabel: e.target.value,
                    })
                  }}
                  placeholder="Enter X-axis label"
                  className="h-8 text-sm"
                />
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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export { DateTimeRangeSettings } from "./DateTimeRangeSettings"
export { TimeRangeSettings } from "./TimeRangeSettings"
export { ParameterRangeSettings } from "./ParameterRangeSettings"