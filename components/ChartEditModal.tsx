"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAnalysisStore } from "@/stores/useAnalysisStore"
import { X, Settings } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ChartEditModal() {
  const { editingChart, editModalOpen, setEditingChart, setEditModalOpen } = useAnalysisStore()
  const [activeTab, setActiveTab] = useState<"appearance" | "parameters">("appearance")
  const [lastAddedParamIndex, setLastAddedParamIndex] = useState<number | null>(null)
  const parameterInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (lastAddedParamIndex !== null && parameterInputRefs.current[lastAddedParamIndex]) {
      const inputElement = parameterInputRefs.current[lastAddedParamIndex]
      inputElement?.focus()
      inputElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setLastAddedParamIndex(null)
    }
  }, [lastAddedParamIndex, editingChart?.yAxisParams?.length])

  if (!editingChart) return null

  return (
    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Chart: {editingChart.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Side - Appearance and Parameters */}
          <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "appearance"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
                onClick={() => setActiveTab("appearance")}
              >
                Appearance
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "parameters"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
                onClick={() => setActiveTab("parameters")}
              >
                Parameters
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Appearance Section */}
              {activeTab === "appearance" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="chart-title" className="text-sm">Title</Label>
                    <Input
                      id="chart-title"
                      value={editingChart.title}
                      onChange={(e) => {
                        setEditingChart({
                          ...editingChart,
                          title: e.target.value,
                        })
                      }}
                      className="h-9 text-base"
                    />
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
                    <Label htmlFor="show-legend" className="text-sm">Show Legend</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="x-label" className="text-sm">X-axis Label</Label>
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
                        className="h-9 text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="y-label" className="text-sm">Y-axis Label</Label>
                      <Input
                        id="y-label"
                        value={editingChart.yLabel || ""}
                        onChange={(e) => {
                          setEditingChart({
                            ...editingChart,
                            yLabel: e.target.value,
                          })
                        }}
                        placeholder="Y-axis label"
                        className="h-9 text-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Parameters Section */}
              {activeTab === "parameters" && (
                <div className="flex flex-col space-y-4 h-full">
                  {/* X Parameter Settings */}
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <h4 className="font-medium text-sm mb-2">X Parameter Settings</h4>
                    <div className="flex gap-2">
                      {/* Axis Type */}
                      <div className="w-38">
                        <Label htmlFor="x-axis-type" className="text-sm mb-1 block">Axis Type</Label>
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

                      {/* Parameter */}
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

                      {/* X Range */}
                      <div className="min-w-0">
                        <Label className="text-sm mb-1 block">X Range</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 px-2 text-sm whitespace-nowrap">
                              {editingChart.xAxisRange?.auto !== false ? 
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
                              
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="x-range-min" className="text-sm">Min Value</Label>
                                  <Input
                                    id="x-range-min"
                                    type="text"
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
                                    type="text"
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
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Y Parameters Settings */}
                  <div className="flex flex-col border rounded-lg p-3 bg-muted/30 min-h-0 flex-1">
                    <div className="flex justify-between items-center mb-2 flex-shrink-0">
                      <h4 className="font-medium text-sm">Y Parameters Settings</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const newParam = {
                            parameter: "",
                            axisNo: 1,
                            axisName: "",
                            range: {
                              auto: true,
                              min: 0,
                              max: 100
                            },
                            line: {
                              width: 2,
                              color: "#000000",
                              style: "solid" as const
                            }
                          }
                          const newParams = [...(editingChart.yAxisParams || []), newParam]
                          setEditingChart({
                            ...editingChart,
                            yAxisParams: newParams
                          })
                          setLastAddedParamIndex(newParams.length - 1)
                        }}
                      >
                        Add Y Parameter
                      </Button>
                    </div>
                    
                    {/* Calculate max Y Range width */}
                    {(() => {
                      const maxYRangeWidth = Math.max(
                        48, // minimum width for "Auto"
                        ...(editingChart.yAxisParams?.map(param => {
                          const text = param.range?.auto !== false ? 
                            "Auto" : 
                            `${param.range?.min || 0} - ${param.range?.max || 100}`;
                          return Math.max(48, text.length * 8 + 16); // approximate width calculation
                        }) || [48])
                      );
                      
                      return (
                        <>
                          {/* Table Header */}
                          <div className="flex gap-2 mb-2 px-1 pb-1 border-b flex-shrink-0">
                            <div className="flex-1 text-xs font-medium text-muted-foreground">Parameter</div>
                            <div className="w-16 text-xs font-medium text-muted-foreground">Axis No</div>
                            <div className="text-xs font-medium text-muted-foreground text-center" style={{ width: maxYRangeWidth }}>Y Range</div>
                            <div className="w-7"></div>
                          </div>
                          
                          {/* Y Parameter List */}
                          <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="space-y-1">
                              {editingChart.yAxisParams?.map((param, index) => (
                              <div key={index} className="flex gap-2 p-1">
                                {/* Parameter */}
                                <div className="flex-1">
                                  <Input
                                    ref={(el) => {
                                      parameterInputRefs.current[index] = el
                                    }}
                                    value={param.parameter}
                                    onChange={(e) => {
                                      const newParams = [...(editingChart.yAxisParams || [])]
                                      newParams[index] = { ...newParams[index], parameter: e.target.value }
                                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                                    }}
                                    placeholder="Parameter"
                                    className="h-7 text-sm"
                                  />
                                </div>
                                
                                {/* Axis No */}
                                <div className="w-16">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={param.axisNo || 1}
                                    onChange={(e) => {
                                      const newParams = [...(editingChart.yAxisParams || [])]
                                      newParams[index] = { ...newParams[index], axisNo: parseInt(e.target.value) || 1 }
                                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                                    }}
                                    className="h-7 text-sm"
                                  />
                                </div>
                                
                                {/* Y Range */}
                                <div style={{ width: maxYRangeWidth }}>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" size="sm" className="w-full h-7 px-1 text-xs">
                                        {param.range?.auto !== false ? 
                                          "Auto" : 
                                          `${param.range?.min || 0} - ${param.range?.max || 100}`
                                        }
                                      </Button>
                                    </PopoverTrigger>
                              <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                  <h4 className="font-medium text-sm">Y Range Settings</h4>
                                  
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`y-range-auto-${index}`}
                                      checked={param.range?.auto ?? true}
                                      onChange={(e) => {
                                        const newParams = [...(editingChart.yAxisParams || [])]
                                        newParams[index] = {
                                          ...newParams[index],
                                          range: {
                                            ...newParams[index].range,
                                            auto: e.target.checked,
                                            min: newParams[index].range?.min || 0,
                                            max: newParams[index].range?.max || 100
                                          }
                                        }
                                        setEditingChart({ ...editingChart, yAxisParams: newParams })
                                      }}
                                      className="rounded"
                                    />
                                    <Label htmlFor={`y-range-auto-${index}`} className="text-sm">Auto Range</Label>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor={`y-range-min-${index}`} className="text-sm">Min Value</Label>
                                      <Input
                                        id={`y-range-min-${index}`}
                                        type="number"
                                        value={param.range?.min || 0}
                                        onChange={(e) => {
                                          const newParams = [...(editingChart.yAxisParams || [])]
                                          newParams[index] = {
                                            ...newParams[index],
                                            range: {
                                              ...newParams[index].range,
                                              auto: false,
                                              min: parseFloat(e.target.value) || 0,
                                              max: newParams[index].range?.max || 100
                                            }
                                          }
                                          setEditingChart({ ...editingChart, yAxisParams: newParams })
                                        }}
                                        placeholder="Enter min value"
                                        disabled={param.range?.auto ?? true}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`y-range-max-${index}`} className="text-sm">Max Value</Label>
                                      <Input
                                        id={`y-range-max-${index}`}
                                        type="number"
                                        value={param.range?.max || 100}
                                        onChange={(e) => {
                                          const newParams = [...(editingChart.yAxisParams || [])]
                                          newParams[index] = {
                                            ...newParams[index],
                                            range: {
                                              ...newParams[index].range,
                                              auto: false,
                                              min: newParams[index].range?.min || 0,
                                              max: parseFloat(e.target.value) || 100
                                            }
                                          }
                                          setEditingChart({ ...editingChart, yAxisParams: newParams })
                                        }}
                                        placeholder="Enter max value"
                                        disabled={param.range?.auto ?? true}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          {/* Delete Button */}
                          <div className="w-7">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                const newParams = editingChart.yAxisParams?.filter((_, i) => i !== index) || []
                                setEditingChart({ ...editingChart, yAxisParams: newParams })
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )) || <p className="text-sm text-muted-foreground px-1">No Y parameters added yet.</p>}
                      </div>
                    </div>
                          </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Split into two sections */}
          <div className="grid grid-rows-2 gap-4 h-full">
            {/* Top Right - Additional Settings */}
            <div className="border rounded-lg p-4 overflow-y-auto">
              <h3 className="text-base font-semibold border-b pb-1 mb-2">Additional Settings</h3>
              <p className="text-base text-muted-foreground">Additional chart settings can be configured here.</p>
            </div>

            {/* Bottom Right - Data Source Information */}
            <div className="border rounded-lg p-4 overflow-y-auto">
              <h3 className="text-base font-semibold border-b pb-1 mb-2">Data Source</h3>
              {editingChart.dataSource ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Source Name</p>
                    <p className="text-sm text-muted-foreground">{editingChart.dataSource.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Table</p>
                    <p className="text-sm text-muted-foreground">{editingChart.dataSource.table}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Columns</p>
                    <p className="text-sm text-muted-foreground">{editingChart.dataSource.columns.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">{editingChart.dataSource.lastUpdated}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data source configured</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // In a real app, you would save the changes here
              setEditModalOpen(false)
            }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}