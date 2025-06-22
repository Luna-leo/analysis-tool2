"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings, RotateCcw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartComponent } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { parseParameterKey } from "@/utils/parameterUtils"

interface XAxisSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function XAxisSettings({ editingChart, setEditingChart }: XAxisSettingsProps) {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor="x-label" className="text-sm">X-axis Label</Label>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-update-x-label"
                    checked={editingChart.autoUpdateXLabel ?? false}
                    onCheckedChange={(checked) => {
                      setEditingChart({
                        ...editingChart,
                        autoUpdateXLabel: checked === true,
                      })
                    }}
                  />
                  <Label
                    htmlFor="auto-update-x-label"
                    className="text-xs font-normal cursor-pointer"
                  >
                    Auto-update
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>When enabled, the label will automatically update when you change the X parameter</p>
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
                  className="h-6 px-2"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset to auto-generated label</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          id="x-label"
          value={editingChart.xLabel || ""}
          onChange={(e) => {
            setEditingChart({
              ...editingChart,
              xLabel: e.target.value,
            })
          }}
          placeholder={editingChart.xLabel ? "X-axis label" : `Auto: ${getAutoLabel() || "Select parameter first"}`}
          className="h-8 text-sm flex-1"
        />
        <div className="min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 text-sm whitespace-nowrap">
                <Settings className="h-3 w-3 mr-1" />
                Range: {editingChart.xAxisRange?.auto !== false ? 
                  "Auto" : 
                  `${editingChart.xAxisRange?.min || "0"} - ${editingChart.xAxisRange?.max || "100"}`
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">X Range Settings</h4>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="x-range-auto"
                    checked={editingChart.xAxisRange?.auto ?? true}
                    onChange={(e) => {
                      setEditingChart({
                        ...editingChart,
                        xAxisRange: {
                          ...editingChart.xAxisRange,
                          auto: e.target.checked,
                          min: editingChart.xAxisRange?.min || "",
                          max: editingChart.xAxisRange?.max || ""
                        }
                      })
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="x-range-auto" className="text-sm">Auto Range</Label>
                </div>
                
                {(() => {
                  const axisType = editingChart.xAxisType || "datetime"
                  
                  if (axisType === "datetime") {
                    return (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="x-range-min" className="text-sm">Start Date/Time</Label>
                          <Input
                            id="x-range-min"
                            type="datetime-local"
                            value={editingChart.xAxisRange?.min || ""}
                            onChange={(e) => {
                              setEditingChart({
                                ...editingChart,
                                xAxisRange: {
                                  ...editingChart.xAxisRange,
                                  auto: false,
                                  min: e.target.value,
                                  max: editingChart.xAxisRange?.max || ""
                                }
                              })
                            }}
                            disabled={editingChart.xAxisRange?.auto ?? true}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="x-range-max" className="text-sm">End Date/Time</Label>
                          <Input
                            id="x-range-max"
                            type="datetime-local"
                            value={editingChart.xAxisRange?.max || ""}
                            onChange={(e) => {
                              setEditingChart({
                                ...editingChart,
                                xAxisRange: {
                                  ...editingChart.xAxisRange,
                                  auto: false,
                                  min: editingChart.xAxisRange?.min || "",
                                  max: e.target.value
                                }
                              })
                            }}
                            disabled={editingChart.xAxisRange?.auto ?? true}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )
                  } else if (axisType === "time") {
                    return (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Time Unit</Label>
                          <select
                            className="w-full h-8 px-2 py-1 border rounded-md text-sm"
                            value={editingChart.xAxisRange?.unit || "sec"}
                            onChange={(e) => {
                              setEditingChart({
                                ...editingChart,
                                xAxisRange: {
                                  ...editingChart.xAxisRange,
                                  unit: e.target.value as "sec" | "min" | "hr",
                                  min: editingChart.xAxisRange?.min ?? 0,
                                  max: editingChart.xAxisRange?.max ?? 100
                                }
                              })
                            }}
                          >
                            <option value="sec">Seconds</option>
                            <option value="min">Minutes</option>
                            <option value="hr">Hours</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="x-range-min" className="text-sm">Start Time</Label>
                          <Input
                            id="x-range-min"
                            type="number"
                            value={editingChart.xAxisRange?.min || ""}
                            onChange={(e) => {
                              setEditingChart({
                                ...editingChart,
                                xAxisRange: {
                                  ...editingChart.xAxisRange,
                                  auto: false,
                                  min: e.target.value,
                                  max: editingChart.xAxisRange?.max || ""
                                }
                              })
                            }}
                            placeholder="0"
                            disabled={editingChart.xAxisRange?.auto ?? true}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="x-range-max" className="text-sm">End Time</Label>
                          <Input
                            id="x-range-max"
                            type="number"
                            value={editingChart.xAxisRange?.max || ""}
                            onChange={(e) => {
                              setEditingChart({
                                ...editingChart,
                                xAxisRange: {
                                  ...editingChart.xAxisRange,
                                  auto: false,
                                  min: editingChart.xAxisRange?.min || "",
                                  max: e.target.value
                                }
                              })
                            }}
                            placeholder="100"
                            disabled={editingChart.xAxisRange?.auto ?? true}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )
                  } else {
                    // Parameter type
                    return (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="x-range-min" className="text-sm">Min Value</Label>
                          <Input
                            id="x-range-min"
                            type="number"
                            value={editingChart.xAxisRange?.min || ""}
                            onChange={(e) => {
                              setEditingChart({
                                ...editingChart,
                                xAxisRange: {
                                  ...editingChart.xAxisRange,
                                  auto: false,
                                  min: e.target.value,
                                  max: editingChart.xAxisRange?.max || ""
                                }
                              })
                            }}
                            placeholder="Enter min value"
                            disabled={editingChart.xAxisRange?.auto ?? true}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="x-range-max" className="text-sm">Max Value</Label>
                          <Input
                            id="x-range-max"
                            type="number"
                            value={editingChart.xAxisRange?.max || ""}
                            onChange={(e) => {
                              setEditingChart({
                                ...editingChart,
                                xAxisRange: {
                                  ...editingChart.xAxisRange,
                                  auto: false,
                                  min: editingChart.xAxisRange?.min || "",
                                  max: e.target.value
                                }
                              })
                            }}
                            placeholder="Enter max value"
                            disabled={editingChart.xAxisRange?.auto ?? true}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )
                  }
                })()}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}