"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartComponent, TimeUnit, EventInfo } from "@/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"

interface XParameterSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems?: EventInfo[]
}

export function XParameterSettings({ editingChart, setEditingChart, selectedDataSourceItems }: XParameterSettingsProps) {
  const [isOpen, setIsOpen] = useState(true)

  const formatDateTimeForInput = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      
      // Format as YYYY-MM-DDTHH:mm:ss for datetime-local input
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    } catch {
      return dateString
    }
  }

  const formatDateTimeForDisplay = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      
      return date.toLocaleString()
    } catch {
      return dateString
    }
  }

  const calculateOverallTimeRange = () => {
    if (!selectedDataSourceItems || selectedDataSourceItems.length === 0) {
      return null
    }

    let earliestStart: Date | null = null
    let latestEnd: Date | null = null

    selectedDataSourceItems.forEach(dataSource => {
      const startTime = new Date(dataSource.start)
      const endTime = new Date(dataSource.end)

      if (!isNaN(startTime.getTime())) {
        if (!earliestStart || startTime < earliestStart) {
          earliestStart = startTime
        }
      }

      if (!isNaN(endTime.getTime())) {
        if (!latestEnd || endTime > latestEnd) {
          latestEnd = endTime
        }
      }
    })

    if (!earliestStart || !latestEnd) {
      return null
    }

    return { earliestStart, latestEnd }
  }

  const setRangeFromDataSource = () => {
    const timeRange = calculateOverallTimeRange()
    if (!timeRange) {
      console.warn('Invalid date ranges in data source items')
      return
    }

    const startTime = formatDateTimeForInput(timeRange.earliestStart)
    const endTime = formatDateTimeForInput(timeRange.latestEnd)

    setEditingChart({
      ...editingChart,
      xAxisRange: {
        auto: false,
        min: startTime,
        max: endTime,
        unit: editingChart.xAxisRange?.unit || "sec"
      }
    })
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
                    setEditingChart({
                      ...editingChart,
                      xAxisType: e.target.value as "datetime" | "time" | "parameter",
                      ...(e.target.value !== "parameter" && { xParameter: "" }),
                    })
                  }}
                >
                  <option value="datetime">Datetime</option>
                  <option value="time">Time (elapsed)</option>
                  <option value="parameter">Parameter</option>
                </select>
              </div>

              <div className="flex-1">
                <Label htmlFor="x-parameter" className="text-sm mb-1 block">Parameter</Label>
                <Input
                  id="x-parameter"
                  value={editingChart.xParameter || ""}
                  onChange={(e) => {
                    setEditingChart({
                      ...editingChart,
                      xParameter: e.target.value,
                    })
                  }}
                  placeholder="Enter parameter"
                  disabled={editingChart.xAxisType !== "parameter"}
                  className="h-8 text-sm"
                />
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
                      
                      {/* Auto from DataSource Button */}
                      {selectedDataSourceItems && selectedDataSourceItems.length > 0 && (editingChart.xAxisType || "datetime") === "datetime" && (
                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={setRangeFromDataSource}
                            className="w-full h-8 text-xs"
                          >
                            Auto from DataSource{selectedDataSourceItems.length > 1 ? 's' : ''}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            {(() => {
                              const timeRange = calculateOverallTimeRange()
                              if (timeRange && timeRange.earliestStart && timeRange.latestEnd) {
                                try {
                                  return `Set range from: ${formatDateTimeForDisplay((timeRange.earliestStart as Date).toISOString())} ~ ${formatDateTimeForDisplay((timeRange.latestEnd as Date).toISOString())}`
                                } catch {
                                  return "Set range from DataSource period"
                                }
                              }
                              return "Set range from DataSource period"
                            })()}
                            {selectedDataSourceItems.length > 1 && (
                              <span className="block text-[10px] text-muted-foreground/60 mt-0.5">
                                ({selectedDataSourceItems.length} data sources)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      {(editingChart.xAxisType || "datetime") === "time" && (
                        <div>
                          <Label className="text-xs">Time Unit</Label>
                          <select
                            value={editingChart.xAxisRange?.unit || "sec"}
                            onChange={(e) => {
                              setEditingChart({
                                ...editingChart,
                                xAxisRange: {
                                  ...editingChart.xAxisRange,
                                  unit: e.target.value as TimeUnit,
                                  auto: editingChart.xAxisRange?.auto !== false,
                                  min: editingChart.xAxisRange?.min || 0,
                                  max: editingChart.xAxisRange?.max || 100,
                                }
                              })
                            }}
                            className="w-full h-8 px-2 py-1 border rounded-md text-sm mt-1"
                          >
                            <option value="sec">Seconds</option>
                            <option value="min">Minutes</option>
                            <option value="hr">Hours</option>
                          </select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="x-min" className="text-xs">Min Value</Label>
                          {(editingChart.xAxisType || "datetime") === "datetime" ? (
                            <Input
                              id="x-min"
                              type="datetime-local"
                              value={editingChart.xAxisRange?.min || ""}
                              onChange={(e) => {
                                setEditingChart({
                                  ...editingChart,
                                  xAxisRange: {
                                    ...editingChart.xAxisRange,
                                    min: e.target.value,
                                    max: editingChart.xAxisRange?.max || "",
                                    auto: editingChart.xAxisRange?.auto !== false,
                                  }
                                })
                              }}
                              disabled={editingChart.xAxisRange?.auto !== false}
                              className="h-8 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          ) : (
                            <Input
                              id="x-min"
                              type="number"
                              value={editingChart.xAxisRange?.min || ""}
                              onChange={(e) => {
                                setEditingChart({
                                  ...editingChart,
                                  xAxisRange: {
                                    ...editingChart.xAxisRange,
                                    min: parseFloat(e.target.value) || 0,
                                    max: editingChart.xAxisRange?.max || 100,
                                    auto: editingChart.xAxisRange?.auto !== false,
                                  }
                                })
                              }}
                              disabled={editingChart.xAxisRange?.auto !== false}
                              placeholder={(editingChart.xAxisType || "datetime") === "time" ? `Start (${editingChart.xAxisRange?.unit || "sec"})` : "Min"}
                              className="h-8"
                            />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="x-max" className="text-xs">Max Value</Label>
                          {(editingChart.xAxisType || "datetime") === "datetime" ? (
                            <Input
                              id="x-max"
                              type="datetime-local"
                              value={editingChart.xAxisRange?.max || ""}
                              onChange={(e) => {
                                setEditingChart({
                                  ...editingChart,
                                  xAxisRange: {
                                    ...editingChart.xAxisRange,
                                    min: editingChart.xAxisRange?.min || "",
                                    max: e.target.value,
                                    auto: editingChart.xAxisRange?.auto !== false,
                                  }
                                })
                              }}
                              disabled={editingChart.xAxisRange?.auto !== false}
                              className="h-8 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          ) : (
                            <Input
                              id="x-max"
                              type="number"
                              value={editingChart.xAxisRange?.max || ""}
                              onChange={(e) => {
                                setEditingChart({
                                  ...editingChart,
                                  xAxisRange: {
                                    ...editingChart.xAxisRange,
                                    min: editingChart.xAxisRange?.min || 0,
                                    max: parseFloat(e.target.value) || 100,
                                    auto: editingChart.xAxisRange?.auto !== false,
                                  }
                                })
                              }}
                              disabled={editingChart.xAxisRange?.auto !== false}
                              placeholder={(editingChart.xAxisType || "datetime") === "time" ? `End (${editingChart.xAxisRange?.unit || "sec"})` : "Max"}
                              className="h-8"
                            />
                          )}
                        </div>
                      </div>
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