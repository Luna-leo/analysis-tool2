"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartComponent, MarkerType, LineStyle } from "@/types"

interface AppearanceTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems: { id: string; plant: string; machineNo: string; label: string; labelDescription?: string }[]
}

export function AppearanceTab({ editingChart, setEditingChart, selectedDataSourceItems }: AppearanceTabProps) {
  const [appearanceMode, setAppearanceMode] = useState<"datasource" | "parameter" | "both">("both")
  return (
    <div className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="chart-title" className="text-sm">Title</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="chart-title"
                              value={editingChart.title}
                              onChange={(e) => {
                                setEditingChart({
                                  ...editingChart,
                                  title: e.target.value,
                                })
                              }}
                              className="h-8 text-sm flex-1"
                            />
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="show-title"
                                  checked={editingChart.showTitle ?? true}
                                  onChange={(e) => {
                                    setEditingChart({
                                      ...editingChart,
                                      showTitle: e.target.checked,
                                    })
                                  }}
                                  className="rounded"
                                />
                                <Label htmlFor="show-title" className="text-sm whitespace-nowrap">Show Title</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="show-legend"
                                  checked={editingChart.legend ?? true}
                                  onChange={(e) => {
                                    setEditingChart({
                                      ...editingChart,
                                      legend: e.target.checked,
                                    })
                                  }}
                                  className="rounded"
                                />
                                <Label htmlFor="show-legend" className="text-sm whitespace-nowrap">Show Legend</Label>
                              </div>
                            </div>
                          </div>
                        </div>
      
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
                                                    const paramIndex = newParams.findIndex(param => param.axisNo === axisNo)
                                                    if (paramIndex >= 0) {
                                                      newParams[paramIndex] = {
                                                        ...newParams[paramIndex],
                                                        range: {
                                                          ...newParams[paramIndex].range,
                                                          auto: e.target.checked,
                                                          min: newParams[paramIndex].range?.min || 0,
                                                          max: newParams[paramIndex].range?.max || 100
                                                        }
                                                      }
                                                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                    }
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
                                                      const paramIndex = newParams.findIndex(param => param.axisNo === axisNo)
                                                      if (paramIndex >= 0) {
                                                        newParams[paramIndex] = {
                                                          ...newParams[paramIndex],
                                                          range: {
                                                            ...newParams[paramIndex].range,
                                                            auto: false,
                                                            min: parseFloat(e.target.value) || 0,
                                                            max: newParams[paramIndex].range?.max || 100
                                                          }
                                                        }
                                                        setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                      }
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
                                                      const paramIndex = newParams.findIndex(param => param.axisNo === axisNo)
                                                      if (paramIndex >= 0) {
                                                        newParams[paramIndex] = {
                                                          ...newParams[paramIndex],
                                                          range: {
                                                            ...newParams[paramIndex].range,
                                                            auto: false,
                                                            min: newParams[paramIndex].range?.min || 0,
                                                            max: parseFloat(e.target.value) || 100
                                                          }
                                                        }
                                                        setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                      }
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
      
                        {/* Appearance Settings Table */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm">Appearance Settings</Label>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Mode</Label>
                              <select
                                className="h-7 text-xs border rounded-md px-2"
                                value={appearanceMode}
                                onChange={(e) =>
                                  setAppearanceMode(
                                    e.target.value as "datasource" | "parameter" | "both"
                                  )
                                }
                              >
                                <option value="datasource">Data Sourceごとに設定する</option>
                                <option value="parameter">Parameterごとに設定する</option>
                                <option value="both">Data Source x Parameterごとに設定する</option>
                              </select>
                            </div>
                          </div>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {appearanceMode !== "parameter" && (
                                    <TableHead className="text-xs">Data Source</TableHead>
                                  )}
                                  {appearanceMode !== "datasource" && (
                                    <TableHead className="text-xs">Parameter</TableHead>
                                  )}
                                  <TableHead className="text-xs">Marker</TableHead>
                                  <TableHead className="text-xs">Line</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedDataSourceItems.length > 0 && editingChart.yAxisParams && editingChart.yAxisParams.length > 0 ? (
                                  selectedDataSourceItems.flatMap((dataSource) =>
                                    editingChart.yAxisParams?.map((param, paramIndex) => {
                                      const key = `${dataSource.id}-${paramIndex}`
                                      return (
                                        <TableRow key={key}>
                                          {appearanceMode !== "parameter" && (
                                            <TableCell className="text-xs">
                                              <div>
                                                <div className="font-medium">{dataSource.plant} - {dataSource.machineNo}</div>
                                                <div className="text-muted-foreground">
                                                  {dataSource.labelDescription ? `${dataSource.label} (${dataSource.labelDescription})` : dataSource.label}
                                                </div>
                                              </div>
                                            </TableCell>
                                          )}
                                          {appearanceMode !== "datasource" && (
                                            <TableCell className="text-xs">
                                              <div>
                                                <div className="font-medium flex items-center gap-1">
                                                  {param.parameter || "Unnamed"}
                                                  {param.parameterType === "Formula" && (
                                                    <Badge variant="secondary" className="text-[10px] px-1 h-4">Formula</Badge>
                                                  )}
                                                </div>
                                                <div className="text-muted-foreground">Axis {param.axisNo || 1}</div>
                                              </div>
                                            </TableCell>
                                          )}
                                          <TableCell className="text-xs">
                                            <div className="flex items-center gap-1">
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button variant="outline" size="sm" className="h-7 text-xs">
                                                    <div className="flex items-center gap-1">
                                                      <div 
                                                        className="w-3 h-3 border rounded-full" 
                                                        style={{
                                                          backgroundColor: param.marker?.fillColor || "#0066cc",
                                                          borderColor: param.marker?.borderColor || "#0066cc"
                                                        }}
                                                      />
                                                      <span>{param.marker?.type || "circle"}</span>
                                                    </div>
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                  <div className="space-y-3">
                                                    <h4 className="text-sm font-medium">Marker Settings</h4>
                                                    
                                                    <div>
                                                      <Label className="text-xs">Type</Label>
                                                      <select
                                                        value={param.marker?.type || "circle"}
                                                        onChange={(e) => {
                                                          const newParams = [...(editingChart.yAxisParams || [])]
                                                          newParams[paramIndex] = {
                                                            ...newParams[paramIndex],
                                                            marker: {
                                                              ...newParams[paramIndex].marker,
                                                              type: e.target.value as MarkerType,
                                                              size: newParams[paramIndex].marker?.size || 6,
                                                              borderColor: newParams[paramIndex].marker?.borderColor || "#0066cc",
                                                              fillColor: newParams[paramIndex].marker?.fillColor || "#0066cc"
                                                            }
                                                          }
                                                          setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                        }}
                                                        className="w-full h-7 px-2 py-1 border rounded-md text-xs"
                                                      >
                                                        <option value="circle">Circle</option>
                                                        <option value="square">Square</option>
                                                        <option value="triangle">Triangle</option>
                                                        <option value="diamond">Diamond</option>
                                                        <option value="star">Star</option>
                                                        <option value="cross">Cross</option>
                                                      </select>
                                                    </div>
                                                    
                                                    <div>
                                                      <Label className="text-xs">Size</Label>
                                                      <Input
                                                        type="number"
                                                        min="1"
                                                        max="20"
                                                        value={param.marker?.size || 6}
                                                        onChange={(e) => {
                                                          const newParams = [...(editingChart.yAxisParams || [])]
                                                          newParams[paramIndex] = {
                                                            ...newParams[paramIndex],
                                                            marker: {
                                                              ...newParams[paramIndex].marker,
                                                              type: newParams[paramIndex].marker?.type || "circle",
                                                              size: parseInt(e.target.value) || 6,
                                                              borderColor: newParams[paramIndex].marker?.borderColor || "#0066cc",
                                                              fillColor: newParams[paramIndex].marker?.fillColor || "#0066cc"
                                                            }
                                                          }
                                                          setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                        }}
                                                        className="h-7 text-xs"
                                                      />
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-2">
                                                      <div>
                                                        <Label className="text-xs">Border Color</Label>
                                                        <Input
                                                          type="color"
                                                          value={param.marker?.borderColor || "#0066cc"}
                                                          onChange={(e) => {
                                                            const newParams = [...(editingChart.yAxisParams || [])]
                                                            newParams[paramIndex] = {
                                                              ...newParams[paramIndex],
                                                              marker: {
                                                                ...newParams[paramIndex].marker,
                                                                type: newParams[paramIndex].marker?.type || "circle",
                                                                size: newParams[paramIndex].marker?.size || 6,
                                                                borderColor: e.target.value,
                                                                fillColor: newParams[paramIndex].marker?.fillColor || "#0066cc"
                                                              }
                                                            }
                                                            setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                          }}
                                                          className="h-7 w-full"
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs">Fill Color</Label>
                                                        <Input
                                                          type="color"
                                                          value={param.marker?.fillColor || "#0066cc"}
                                                          onChange={(e) => {
                                                            const newParams = [...(editingChart.yAxisParams || [])]
                                                            newParams[paramIndex] = {
                                                              ...newParams[paramIndex],
                                                              marker: {
                                                                ...newParams[paramIndex].marker,
                                                                type: newParams[paramIndex].marker?.type || "circle",
                                                                size: newParams[paramIndex].marker?.size || 6,
                                                                borderColor: newParams[paramIndex].marker?.borderColor || "#0066cc",
                                                                fillColor: e.target.value
                                                              }
                                                            }
                                                            setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                          }}
                                                          className="h-7 w-full"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-xs">
                                            <div className="flex items-center gap-1">
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button variant="outline" size="sm" className="h-7 text-xs">
                                                    <div className="flex items-center gap-1">
                                                      <div 
                                                        className="w-4 h-0 border-b-2"
                                                        style={{
                                                          borderColor: param.line?.color || "#0066cc",
                                                          borderStyle: param.line?.style || "solid"
                                                        }}
                                                      />
                                                      <span>{param.line?.style || "solid"}</span>
                                                    </div>
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                  <div className="space-y-3">
                                                    <h4 className="text-sm font-medium">Line Settings</h4>
                                                    
                                                    <div>
                                                      <Label className="text-xs">Style</Label>
                                                      <select
                                                        value={param.line?.style || "solid"}
                                                        onChange={(e) => {
                                                          const newParams = [...(editingChart.yAxisParams || [])]
                                                          newParams[paramIndex] = {
                                                            ...newParams[paramIndex],
                                                            line: {
                                                              ...newParams[paramIndex].line,
                                                              style: e.target.value as LineStyle,
                                                              width: newParams[paramIndex].line?.width || 2,
                                                              color: newParams[paramIndex].line?.color || "#0066cc"
                                                            }
                                                          }
                                                          setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                        }}
                                                        className="w-full h-7 px-2 py-1 border rounded-md text-xs"
                                                      >
                                                        <option value="solid">Solid</option>
                                                        <option value="dashed">Dashed</option>
                                                        <option value="dotted">Dotted</option>
                                                      </select>
                                                    </div>
                                                    
                                                    <div>
                                                      <Label className="text-xs">Width</Label>
                                                      <Input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={param.line?.width || 2}
                                                        onChange={(e) => {
                                                          const newParams = [...(editingChart.yAxisParams || [])]
                                                          newParams[paramIndex] = {
                                                            ...newParams[paramIndex],
                                                            line: {
                                                              ...newParams[paramIndex].line,
                                                              style: newParams[paramIndex].line?.style || "solid",
                                                              width: parseInt(e.target.value) || 2,
                                                              color: newParams[paramIndex].line?.color || "#0066cc"
                                                            }
                                                          }
                                                          setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                        }}
                                                        className="h-7 text-xs"
                                                      />
                                                    </div>
                                                    
                                                    <div>
                                                      <Label className="text-xs">Color</Label>
                                                      <Input
                                                        type="color"
                                                        value={param.line?.color || "#0066cc"}
                                                        onChange={(e) => {
                                                          const newParams = [...(editingChart.yAxisParams || [])]
                                                          newParams[paramIndex] = {
                                                            ...newParams[paramIndex],
                                                            line: {
                                                              ...newParams[paramIndex].line,
                                                              style: newParams[paramIndex].line?.style || "solid",
                                                              width: newParams[paramIndex].line?.width || 2,
                                                              color: e.target.value
                                                            }
                                                          }
                                                          setEditingChart({ ...editingChart, yAxisParams: newParams })
                                                        }}
                                                        className="h-7 w-full"
                                                      />
                                                    </div>
                                                  </div>
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    }) || []
                                  )
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={appearanceMode === "both" ? 4 : 3} className="text-center text-xs text-muted-foreground py-4">
                                      {selectedDataSourceItems.length === 0 
                                        ? "No data sources selected. Please select data sources in the DataSource tab."
                                        : "No Y parameters configured. Please add parameters in the Parameters tab."}
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}
    </div>
  )
}

