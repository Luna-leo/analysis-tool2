"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartComponent } from "@/types"

interface YAxisSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function YAxisSettings({ editingChart, setEditingChart }: YAxisSettingsProps) {
  return (
    <div>
      <Label className="text-sm">Y-axis Labels</Label>
      <div className="mt-1 max-h-24 overflow-y-auto border rounded-md p-2">
        <div className="space-y-2">
          {(() => {
            // Check if Y parameters exist
            if (!editingChart.yAxisParams || editingChart.yAxisParams.length === 0) {
              return null
            }
            
            // Get unique axis numbers from Y parameters
            const axisNumbers = [...new Set(
              editingChart.yAxisParams.map(param => param.axisNo || 1)
            )].sort((a, b) => a - b)
            
            return axisNumbers.map(axisNo => {
              // Find the first parameter with this axis number to get its range
              const axisParam = editingChart.yAxisParams?.find(param => param.axisNo === axisNo)
              
              return (
                <div key={axisNo} className="flex items-center gap-2">
                  <Label className="text-xs w-16 text-muted-foreground">Axis {axisNo}:</Label>
                  <Input
                    value={editingChart.yAxisLabels?.[axisNo] || ""}
                    onChange={(e) => {
                      setEditingChart({
                        ...editingChart,
                        yAxisLabels: {
                          ...editingChart.yAxisLabels,
                          [axisNo]: e.target.value,
                        },
                      })
                    }}
                    placeholder={`Y-axis ${axisNo} label`}
                    className="h-8 text-sm flex-1"
                  />
                  <div className="min-w-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 px-2 text-sm whitespace-nowrap">
                          <Settings className="h-3 w-3 mr-1" />
                          Range: {axisParam?.range?.auto !== false ? 
                            "Auto" : 
                            `${axisParam?.range?.min || 0} - ${axisParam?.range?.max || 100}`
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm">Y Range Settings (Axis {axisNo})</h4>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`y-range-auto-${axisNo}`}
                              checked={axisParam?.range?.auto ?? true}
                              onChange={(e) => {
                                const newParams = [...(editingChart.yAxisParams || [])]
                                // Update all parameters on the same axis
                                newParams.forEach((param, index) => {
                                  if (param.axisNo === axisNo) {
                                    newParams[index] = {
                                      ...param,
                                      range: {
                                        auto: e.target.checked,
                                        min: param.range?.min || 0,
                                        max: param.range?.max || 100
                                      }
                                    }
                                  }
                                })
                                setEditingChart({ ...editingChart, yAxisParams: newParams })
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`y-range-auto-${axisNo}`} className="text-sm">Auto Range</Label>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`y-range-min-${axisNo}`} className="text-sm">Min Value</Label>
                              <Input
                                id={`y-range-min-${axisNo}`}
                                type="number"
                                value={axisParam?.range?.min || 0}
                                onChange={(e) => {
                                  const newParams = [...(editingChart.yAxisParams || [])]
                                  // Update all parameters on the same axis
                                  newParams.forEach((param, index) => {
                                    if (param.axisNo === axisNo) {
                                      newParams[index] = {
                                        ...param,
                                        range: {
                                          auto: false,
                                          min: parseFloat(e.target.value) || 0,
                                          max: param.range?.max || 100
                                        }
                                      }
                                    }
                                  })
                                  setEditingChart({ ...editingChart, yAxisParams: newParams })
                                }}
                                placeholder="Enter min value"
                                disabled={axisParam?.range?.auto ?? true}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`y-range-max-${axisNo}`} className="text-sm">Max Value</Label>
                              <Input
                                id={`y-range-max-${axisNo}`}
                                type="number"
                                value={axisParam?.range?.max || 100}
                                onChange={(e) => {
                                  const newParams = [...(editingChart.yAxisParams || [])]
                                  // Update all parameters on the same axis
                                  newParams.forEach((param, index) => {
                                    if (param.axisNo === axisNo) {
                                      newParams[index] = {
                                        ...param,
                                        range: {
                                          auto: false,
                                          min: param.range?.min || 0,
                                          max: parseFloat(e.target.value) || 100
                                        }
                                      }
                                    }
                                  })
                                  setEditingChart({ ...editingChart, yAxisParams: newParams })
                                }}
                                placeholder="Enter max value"
                                disabled={axisParam?.range?.auto ?? true}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )
            })
          })()} 
          {(!editingChart.yAxisParams || editingChart.yAxisParams.length === 0) && (
            <p className="text-xs text-muted-foreground">Add Y parameters to configure axis labels</p>
          )}
        </div>
      </div>
    </div>
  )
}