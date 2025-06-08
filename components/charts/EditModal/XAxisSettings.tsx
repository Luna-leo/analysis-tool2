"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartComponent } from "@/types"

interface XAxisSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function XAxisSettings({ editingChart, setEditingChart }: XAxisSettingsProps) {
  return (
    <div>
      <Label htmlFor="x-label" className="text-sm">X-axis Label</Label>
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
          placeholder="X-axis label"
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