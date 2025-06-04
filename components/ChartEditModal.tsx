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
import { X, Settings, Plus, Edit2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface EventInfo {
  id: string
  plant: string
  machineNo: string
  label: string
  event: string
  start: string
  end: string
}

export function ChartEditModal() {
  const { editingChart, editModalOpen, setEditingChart, setEditModalOpen } = useAnalysisStore()
  const [activeTab, setActiveTab] = useState<"parameters" | "datasource">("parameters")
  const [lastAddedParamIndex, setLastAddedParamIndex] = useState<number | null>(null)
  const parameterInputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  // Event data state
  const [events, setEvents] = useState<EventInfo[]>([
    { id: "1", plant: "Plant A", machineNo: "M001", label: "Maintenance", event: "Scheduled Stop", start: "2024-01-15 10:00", end: "2024-01-15 12:00" },
    { id: "2", plant: "Plant A", machineNo: "M002", label: "Production", event: "Normal Operation", start: "2024-01-15 08:00", end: "2024-01-15 16:00" },
    { id: "3", plant: "Plant B", machineNo: "M003", label: "Alert", event: "Temperature Warning", start: "2024-01-15 14:30", end: "2024-01-15 14:45" },
  ])
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  const [editingEvent, setEditingEvent] = useState<EventInfo | null>(null)
  const [eventFormOpen, setEventFormOpen] = useState(false)

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
    <>
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col overflow-hidden" hideCloseButton>
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <DialogTitle>Edit Chart: {editingChart.title}</DialogTitle>
            <div className="flex gap-2">
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
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Left Side - Parameters and DataSource */}
          <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
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
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "datasource"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
                onClick={() => setActiveTab("datasource")}
              >
                DataSource
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {/* DataSource Section */}
              {activeTab === "datasource" && (
                <div className="space-y-4">
                  {/* Event Information Section */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium">Event Information</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const newEvent: EventInfo = {
                            id: Date.now().toString(),
                            plant: "",
                            machineNo: "",
                            label: "",
                            event: "",
                            start: "",
                            end: ""
                          }
                          setEditingEvent(newEvent)
                          setEventFormOpen(true)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Event
                      </Button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8 text-xs w-6 px-1">
                              <Checkbox
                                checked={selectedEventIds.size === events.length && events.length > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEventIds(new Set(events.map(e => e.id)))
                                  } else {
                                    setSelectedEventIds(new Set())
                                  }
                                }}
                                className="h-3 w-3"
                              />
                            </TableHead>
                            <TableHead className="h-8 text-xs px-2">Plant</TableHead>
                            <TableHead className="h-8 text-xs px-2">Machine</TableHead>
                            <TableHead className="h-8 text-xs px-2">Label</TableHead>
                            <TableHead className="h-8 text-xs px-2">Event</TableHead>
                            <TableHead className="h-8 text-xs px-2">Start</TableHead>
                            <TableHead className="h-8 text-xs px-2">End</TableHead>
                            <TableHead className="h-8 text-xs w-6 px-1"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {events.map((event) => (
                            <TableRow 
                              key={event.id}
                              className={selectedEventIds.has(event.id) ? "bg-muted/50" : ""}
                            >
                              <TableCell className="px-1 py-1">
                                <Checkbox
                                  checked={selectedEventIds.has(event.id)}
                                  onCheckedChange={(checked) => {
                                    const newSelectedIds = new Set(selectedEventIds)
                                    if (checked) {
                                      newSelectedIds.add(event.id)
                                    } else {
                                      newSelectedIds.delete(event.id)
                                    }
                                    setSelectedEventIds(newSelectedIds)
                                  }}
                                  className="h-3 w-3"
                                />
                              </TableCell>
                              <TableCell className="px-2 py-1 text-xs">{event.plant}</TableCell>
                              <TableCell className="px-2 py-1 text-xs">{event.machineNo}</TableCell>
                              <TableCell className="px-2 py-1 text-xs">{event.label}</TableCell>
                              <TableCell className="px-2 py-1 text-xs">{event.event}</TableCell>
                              <TableCell className="px-2 py-1 text-xs">
                                <div className="leading-tight">
                                  <div>{event.start.split(" ")[0]}</div>
                                  <div>{event.start.split(" ")[1]}</div>
                                </div>
                              </TableCell>
                              <TableCell className="px-2 py-1 text-xs">
                                <div className="leading-tight">
                                  <div>{event.end.split(" ")[0]}</div>
                                  <div>{event.end.split(" ")[1]}</div>
                                </div>
                              </TableCell>
                              <TableCell className="px-1 py-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    setEditingEvent(event)
                                    setEventFormOpen(true)
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
                    
                    {/* Table Header */}
                    <div className="flex gap-2 mb-2 px-1 pb-1 border-b flex-shrink-0">
                      <div className="flex-1 text-xs font-medium text-muted-foreground">Parameter</div>
                      <div className="w-16 text-xs font-medium text-muted-foreground">Axis No</div>
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

            {/* Bottom Right - Appearance Settings */}
            <div className="border rounded-lg p-4 overflow-y-auto">
              <h3 className="text-base font-semibold border-b pb-1 mb-2">Appearance Settings</h3>
              <div className="space-y-2">
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
                                              unit: e.target.value as "sec" | "min" | "hr"
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
                  <div className="mt-1 h-24 overflow-y-auto border rounded-md p-2">
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
              </div>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>

    {/* Event Edit Dialog */}
    <Dialog open={eventFormOpen} onOpenChange={setEventFormOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        {editingEvent && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-plant" className="text-sm">Plant</Label>
              <Input
                id="edit-plant"
                value={editingEvent.plant}
                onChange={(e) => setEditingEvent({ ...editingEvent, plant: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-machine" className="text-sm">Machine No</Label>
              <Input
                id="edit-machine"
                value={editingEvent.machineNo}
                onChange={(e) => setEditingEvent({ ...editingEvent, machineNo: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-label" className="text-sm">Label</Label>
              <Input
                id="edit-label"
                value={editingEvent.label}
                onChange={(e) => setEditingEvent({ ...editingEvent, label: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-event" className="text-sm">Event</Label>
              <Input
                id="edit-event"
                value={editingEvent.event}
                onChange={(e) => setEditingEvent({ ...editingEvent, event: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-start" className="text-sm">Start</Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={editingEvent.start}
                onChange={(e) => setEditingEvent({ ...editingEvent, start: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-end" className="text-sm">End</Label>
              <Input
                id="edit-end"
                type="datetime-local"
                value={editingEvent.end}
                onChange={(e) => setEditingEvent({ ...editingEvent, end: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEventFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (events.find(ev => ev.id === editingEvent.id)) {
                  // Update existing event
                  const newEvents = events.map(ev => 
                    ev.id === editingEvent.id ? editingEvent : ev
                  )
                  setEvents(newEvents)
                } else {
                  // Add new event
                  setEvents([...events, editingEvent])
                }
                setEventFormOpen(false)
                setEditingEvent(null)
              }}>
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}