"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { ChartComponent, EventInfo } from "@/types"

interface ReferenceLineConfig {
  id: string
  type: "vertical" | "horizontal"
  label: string
  xValue?: string
  yValue?: string
  axisNo?: number
  yRange?: {
    auto: boolean
    min: string
    max: string
  }
  xRange?: {
    auto: boolean
    min: string
    max: string
  }
}

interface ReferenceLinesSettingsProps {
  editingChart: ChartComponent
  referenceLines: ReferenceLineConfig[]
  onUpdateReferenceLines: (lines: ReferenceLineConfig[]) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  selectedDataSourceItems: EventInfo[]
}

export function ReferenceLinesSettings({ 
  editingChart, 
  referenceLines, 
  onUpdateReferenceLines, 
  isOpen = false,
  onOpenChange,
  selectedDataSourceItems 
}: ReferenceLinesSettingsProps) {
  
  const formatDateTimeForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  const getDefaultValues = () => {
    const now = new Date()
    let defaultXValue = ""
    let defaultYValue = "50"

    // Calculate default X value based on chart's X-axis settings
    if ((editingChart.xAxisType || "datetime") === "datetime") {
      if (editingChart.xAxisRange?.auto === false && editingChart.xAxisRange.min && editingChart.xAxisRange.max) {
        // Use midpoint of custom range
        const startTime = new Date(editingChart.xAxisRange.min)
        const endTime = new Date(editingChart.xAxisRange.max)
        
        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
          const midTime = new Date((startTime.getTime() + endTime.getTime()) / 2)
          defaultXValue = formatDateTimeForInput(midTime)
        } else {
          defaultXValue = formatDateTimeForInput(now)
        }
      } else if (selectedDataSourceItems.length > 0) {
        // Use midpoint of overall data source time range
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
        
        if (earliestStart && latestEnd) {
          try {
            const midTime = new Date(((earliestStart as Date).getTime() + (latestEnd as Date).getTime()) / 2)
            if (!isNaN(midTime.getTime())) {
              defaultXValue = formatDateTimeForInput(midTime)
            } else {
              defaultXValue = formatDateTimeForInput(now)
            }
          } catch {
            defaultXValue = formatDateTimeForInput(now)
          }
        } else {
          defaultXValue = formatDateTimeForInput(now)
        }
      } else {
        // Use current time as default
        defaultXValue = formatDateTimeForInput(now)
      }
    } else {
      // For numeric/time axis, use 50 as default midpoint
      defaultXValue = "50"
    }

    // Calculate default Y value based on first Y parameter range
    if (editingChart.yAxisParams && editingChart.yAxisParams.length > 0) {
      const firstParam = editingChart.yAxisParams[0]
      if (firstParam.range?.auto === false) {
        const midY = ((firstParam.range.min || 0) + (firstParam.range.max || 100)) / 2
        defaultYValue = midY.toString()
      }
    }

    return { defaultXValue, defaultYValue }
  }

  const handleAddReferenceLine = () => {
    onOpenChange?.(true)
    const { defaultXValue, defaultYValue } = getDefaultValues()
    
    const newReferenceLine: ReferenceLineConfig = {
      id: Date.now().toString(),
      type: "vertical",
      label: "",
      xValue: defaultXValue,
      yValue: defaultYValue,
      axisNo: 1,
      yRange: {
        auto: true,
        min: "0",
        max: "100"
      },
      xRange: {
        auto: true,
        min: "0",
        max: "100"
      }
    }
    onUpdateReferenceLines([...referenceLines, newReferenceLine])
  }

  const handleUpdateReferenceLine = (id: string, field: keyof ReferenceLineConfig, value: any) => {
    onUpdateReferenceLines(referenceLines.map(line => {
      if (line.id !== id) return line
      
      const updatedLine = { ...line, [field]: value }
      
      // If type is being changed, set appropriate default values
      if (field === 'type') {
        const { defaultXValue, defaultYValue } = getDefaultValues()
        
        if (value === 'vertical') {
          // Switching to vertical - set default X value, clear Y value
          updatedLine.xValue = defaultXValue
          updatedLine.yValue = ""
        } else if (value === 'horizontal') {
          // Switching to horizontal - set default Y value, clear X value
          updatedLine.yValue = defaultYValue
          updatedLine.xValue = ""
        }
      }
      
      return updatedLine
    }))
  }

  type RangeField = keyof NonNullable<ReferenceLineConfig['xRange']> | keyof NonNullable<ReferenceLineConfig['yRange']>
  
  const handleUpdateRange = (
    id: string,
    rangeType: 'xRange' | 'yRange',
    field: RangeField,
    value: any
  ) => {
    onUpdateReferenceLines(referenceLines.map(line => {
      if (line.id !== id) return line
      return {
        ...line,
        [rangeType]: {
          ...line[rangeType],
          [field]: value
        }
      }
    }))
  }

  const handleRemoveReferenceLine = (id: string) => {
    onUpdateReferenceLines(referenceLines.filter(line => line.id !== id))
  }

  return (
    <div className="border rounded-lg bg-muted/30">
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
        <div className="flex items-center gap-2 p-3 border-b bg-muted/20 relative z-20">
          <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/50 transition-colors p-1 rounded">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <h4 className="font-medium text-sm">Reference Lines Settings</h4>
          </CollapsibleTrigger>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs ml-auto"
            onClick={() => {
              handleAddReferenceLine()
            }}
          >
            Add Reference Line
          </Button>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3">
            <div className="pt-3 border-t">
              <div className="flex gap-2 mb-1 px-1 text-xs font-medium text-muted-foreground border-b pb-1 mt-1">
                <div className="w-20">Type</div>
                <div className="flex-1">Label</div>
                <div className="w-40">Value</div>
                <div className="w-16">Axis No</div>
                <div className="w-24">Range</div>
                <div className="w-7"></div>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
        {referenceLines.map((line) => (
          <div key={line.id} className="flex gap-2 p-1">
            <div className="w-24">
              <select
                value={line.type}
                onChange={(e) => handleUpdateReferenceLine(line.id, "type", e.target.value)}
                className="w-full h-7 px-2 py-1 border rounded-md text-xs"
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div className="flex-1">
              <Input
                value={line.label}
                onChange={(e) => handleUpdateReferenceLine(line.id, "label", e.target.value)}
                placeholder="Label"
                className="h-7 text-xs"
              />
            </div>
            <div className="w-40">
              {line.type === "vertical" ? (
                (editingChart.xAxisType || "datetime") === "datetime" ? (
                  <Input
                    type="datetime-local"
                    value={line.xValue || ""}
                    onChange={(e) => handleUpdateReferenceLine(line.id, "xValue", e.target.value)}
                    className="h-7 text-xs w-full [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                ) : (
                  <Input
                    type="number"
                    value={line.xValue || ""}
                    onChange={(e) => handleUpdateReferenceLine(line.id, "xValue", e.target.value)}
                    placeholder={(editingChart.xAxisType || "datetime") === "time" ? "Time(s)" : "X value"}
                    className="h-7 text-xs"
                  />
                )
              ) : (
                <Input
                  type="number"
                  value={line.yValue || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "yValue", e.target.value)}
                  placeholder="Y value"
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="w-16">
              {line.type === "horizontal" ? (
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={line.axisNo || 1}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "axisNo", parseInt(e.target.value) || 1)}
                  className="h-7 text-xs"
                />
              ) : (
                <div className="h-7" />
              )}
            </div>
            <div className="w-24">
              {line.type === "vertical" ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-7 w-full justify-start text-xs"
                      title={line.yRange?.auto ? "Auto range based on data" : `Min: ${line.yRange?.min || 0}, Max: ${line.yRange?.max || 100}`}
                    >
                      {line.yRange?.auto ? "Range: Auto" : "Range: Custom"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`y-auto-${line.id}`}
                          checked={line.yRange?.auto ?? true}
                          onCheckedChange={(checked) => handleUpdateRange(line.id, 'yRange', 'auto', !!checked)}
                        />
                        <Label htmlFor={`y-auto-${line.id}`} className="text-sm">Auto Range</Label>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`y-min-${line.id}`} className="text-xs">Min Value</Label>
                          <Input
                            id={`y-min-${line.id}`}
                            type="number"
                            value={line.yRange?.min || "0"}
                            onChange={(e) => handleUpdateRange(line.id, 'yRange', 'min', e.target.value)}
                            disabled={line.yRange?.auto ?? true}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`y-max-${line.id}`} className="text-xs">Max Value</Label>
                          <Input
                            id={`y-max-${line.id}`}
                            type="number"
                            value={line.yRange?.max || "100"}
                            onChange={(e) => handleUpdateRange(line.id, 'yRange', 'max', e.target.value)}
                            disabled={line.yRange?.auto ?? true}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-7 w-full justify-start text-xs"
                      title={line.xRange?.auto ? "Auto range based on data" : `Min: ${line.xRange?.min || "Not set"}, Max: ${line.xRange?.max || "Not set"}`}
                    >
                      {line.xRange?.auto ? "Range: Auto" : "Range: Custom"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`x-auto-${line.id}`}
                          checked={line.xRange?.auto ?? true}
                          onCheckedChange={(checked) => handleUpdateRange(line.id, 'xRange', 'auto', !!checked)}
                        />
                        <Label htmlFor={`x-auto-${line.id}`} className="text-sm">Auto Range</Label>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`x-min-${line.id}`} className="text-xs">Min Value</Label>
                          {(editingChart.xAxisType || "datetime") === "datetime" ? (
                            <Input
                              id={`x-min-${line.id}`}
                              type="datetime-local"
                              value={line.xRange?.min || ""}
                              onChange={(e) => handleUpdateRange(line.id, 'xRange', 'min', e.target.value)}
                              disabled={line.xRange?.auto ?? true}
                              className="h-8 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          ) : (
                            <Input
                              id={`x-min-${line.id}`}
                              type="number"
                              value={line.xRange?.min || "0"}
                              onChange={(e) => handleUpdateRange(line.id, 'xRange', 'min', e.target.value)}
                              disabled={line.xRange?.auto ?? true}
                              placeholder={(editingChart.xAxisType || "datetime") === "time" ? "Start(s)" : "Min"}
                              className="h-8"
                            />
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`x-max-${line.id}`} className="text-xs">Max Value</Label>
                          {(editingChart.xAxisType || "datetime") === "datetime" ? (
                            <Input
                              id={`x-max-${line.id}`}
                              type="datetime-local"
                              value={line.xRange?.max || ""}
                              onChange={(e) => handleUpdateRange(line.id, 'xRange', 'max', e.target.value)}
                              disabled={line.xRange?.auto ?? true}
                              className="h-8 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                          ) : (
                            <Input
                              id={`x-max-${line.id}`}
                              type="number"
                              value={line.xRange?.max || "100"}
                              onChange={(e) => handleUpdateRange(line.id, 'xRange', 'max', e.target.value)}
                              disabled={line.xRange?.auto ?? true}
                              placeholder={(editingChart.xAxisType || "datetime") === "time" ? "End(s)" : "Max"}
                              className="h-8"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="w-7">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveReferenceLine(line.id)}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

                  {referenceLines.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p className="text-sm">No reference lines added yet.</p>
                      <p className="text-sm">Click "Add Reference Line" to create one.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}