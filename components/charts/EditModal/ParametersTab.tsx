"use client"

import React, { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Settings, Plus, ChevronDown } from "lucide-react"
import { ChartComponent, InterlockDefinition } from "@/types"
import { mockInterlockMaster } from "@/data/interlockMaster"
import { InterlockRegistrationDialog } from "./InterlockRegistrationDialog"

interface ParametersTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ParametersTab({ editingChart, setEditingChart }: ParametersTabProps) {
  const [lastAddedParamIndex, setLastAddedParamIndex] = useState<number | null>(null)
  const [showInterlockDialog, setShowInterlockDialog] = useState(false)
  const [editingInterlockIndex, setEditingInterlockIndex] = useState<number | null>(null)
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const parameterInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (lastAddedParamIndex !== null && parameterInputRefs.current[lastAddedParamIndex]) {
      const inputElement = parameterInputRefs.current[lastAddedParamIndex]
      inputElement?.focus()
      inputElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setLastAddedParamIndex(null)
    }
  }, [lastAddedParamIndex, editingChart?.yAxisParams?.length])

  const handleInterlockSave = (interlockDefinition: InterlockDefinition, selectedThresholds: string[]) => {
    if (editingInterlockIndex !== null) {
      const newParams = [...(editingChart.yAxisParams || [])]
      newParams[editingInterlockIndex] = {
        ...newParams[editingInterlockIndex],
        interlockDefinition,
        parameter: interlockDefinition.name,
        interlockSource: "custom",
        selectedThresholds
      }
      setEditingChart({ ...editingChart, yAxisParams: newParams })
    }
    setEditingInterlockIndex(null)
  }

  const handleParameterTypeChange = (index: number, newType: "Parameter" | "Formula" | "Interlock") => {
    const newParams = [...(editingChart.yAxisParams || [])]
    newParams[index] = { 
      ...newParams[index], 
      parameterType: newType,
      parameter: "", // Clear parameter
      axisNo: 1, // Reset axis number to default
      // Reset interlock-specific fields when changing away from Interlock
      ...(newType !== "Interlock" && {
        interlockId: undefined,
        interlockSource: undefined,
        interlockDefinition: undefined,
        selectedThresholds: undefined
      })
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }

  const handleInterlockSelect = (index: number, value: string) => {
    setOpenComboboxIndex(null)
    setSearchQuery("") // Reset search query after selection
    
    if (value === "add-new") {
      setEditingInterlockIndex(index)
      setShowInterlockDialog(true)
      return
    }

    const selectedMaster = mockInterlockMaster.find(m => m.id === value)
    if (selectedMaster) {
      const newParams = [...(editingChart.yAxisParams || [])]
      newParams[index] = {
        ...newParams[index],
        interlockId: value,
        interlockSource: "master",
        interlockDefinition: selectedMaster.definition,
        parameter: selectedMaster.name,
        selectedThresholds: []
      }
      setEditingChart({ ...editingChart, yAxisParams: newParams })
    }
  }

  const filterInterlocks = (interlocks: typeof mockInterlockMaster) => {
    if (!searchQuery) return interlocks
    
    // Split search query by spaces and convert to lowercase
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0)
    
    return interlocks.filter(master => {
      const searchableText = [
        master.name.toLowerCase(),
        master.plant_name.toLowerCase(),
        master.machine_no.toLowerCase()
      ].join(" ")
      
      // Check if all search terms are found in the searchable text
      return searchTerms.every(term => searchableText.includes(term))
    })
  }



  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="border rounded-lg p-3 bg-muted/30">
        <h4 className="font-medium text-sm mb-2">X Parameter Settings</h4>
        <div className="flex gap-2">
          <div className="w-38">
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
        </div>
      </div>

      <div className="flex flex-col border rounded-lg p-3 bg-muted/30 min-h-0 flex-1">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <h4 className="font-medium text-sm">Y Parameters Settings</h4>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              const newParam = {
                parameterType: "Parameter" as "Parameter" | "Formula" | "Interlock",
                parameter: "",
                axisNo: 1,
                axisName: "",
                range: {
                  auto: true,
                  min: 0,
                  max: 100,
                },
                line: {
                  width: 2,
                  color: "#000000",
                  style: "solid" as const,
                },
              }
              const newParams = [...(editingChart.yAxisParams || []), newParam]
              setEditingChart({
                ...editingChart,
                yAxisParams: newParams,
              })
              setLastAddedParamIndex(newParams.length - 1)
            }}
          >
            Add Y Parameter
          </Button>
        </div>

        <div className="flex gap-2 mb-2 px-1 pb-1 border-b flex-shrink-0">
          <div className="w-28 flex-shrink-0 text-xs font-medium text-muted-foreground">Parameter Type</div>
          <div className="flex-1 min-w-0 text-xs font-medium text-muted-foreground">Parameter</div>
          <div className="w-16 flex-shrink-0 text-xs font-medium text-muted-foreground">Axis No</div>
          <div className="w-7 flex-shrink-0"></div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-3">
            {editingChart.yAxisParams?.map((param, index) => (
              <div key={index} className="space-y-2">
                <div className="flex gap-2 p-1">
                  <div className="w-28 flex-shrink-0">
                    <select
                      value={param.parameterType || "Parameter"}
                      onChange={(e) => handleParameterTypeChange(index, e.target.value as "Parameter" | "Formula" | "Interlock")}
                      className="w-full h-7 px-2 py-1 border rounded-md text-sm"
                    >
                      <option value="Parameter">Parameter</option>
                      <option value="Formula">Formula</option>
                      <option value="Interlock">Interlock</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-0">
                    {param.parameterType === "Interlock" ? (
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <Popover 
                                    open={openComboboxIndex === index} 
                                    onOpenChange={(open) => {
                                      setOpenComboboxIndex(open ? index : null)
                                      if (!open) setSearchQuery("") // Reset search when closing
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="h-7 w-full justify-start text-sm font-normal min-w-0"
                                      >
                                        <span className="truncate text-left mr-auto">
                                          {param.parameter || "Select Interlock"}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                      <Command shouldFilter={false}>
                                        <CommandInput 
                                          placeholder="Search by name, plant, machine..." 
                                          value={searchQuery}
                                          onValueChange={setSearchQuery}
                                        />
                                        <CommandEmpty>No interlock found.</CommandEmpty>
                                        <CommandGroup>
                                          {filterInterlocks(mockInterlockMaster).map((master) => (
                                            <CommandItem
                                              key={master.id}
                                              value={master.id}
                                              onSelect={() => handleInterlockSelect(index, master.id)}
                                              className="flex flex-col items-start"
                                            >
                                              <span className="font-medium text-left">{master.name}</span>
                                              <span className="text-xs text-muted-foreground text-left">
                                                {master.plant_name} • {master.machine_no}
                                              </span>
                                            </CommandItem>
                                          ))}
                                          <CommandItem
                                            value="add-new"
                                            onSelect={() => handleInterlockSelect(index, "add-new")}
                                            className="border-t"
                                          >
                                            <Plus className="mr-2 h-4 w-4" />
                                            <span>Add new interlock...</span>
                                          </CommandItem>
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  {param.parameter || "Select Interlock"}
                                  {param.selectedThresholds && param.selectedThresholds.length > 0 && (
                                    <>
                                      <br />
                                      <span className="text-xs">
                                        Thresholds: {param.selectedThresholds.map(thresholdId => {
                                          const threshold = param.interlockDefinition?.thresholds.find(t => t.id === thresholdId)
                                          return threshold?.name
                                        }).filter(Boolean).join(", ")}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {param.selectedThresholds && param.selectedThresholds.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {param.selectedThresholds.map(thresholdId => {
                                const threshold = param.interlockDefinition?.thresholds.find(t => t.id === thresholdId)
                                return threshold ? (
                                  <Badge 
                                    key={thresholdId} 
                                    variant="secondary" 
                                    className="text-xs px-1.5 py-0 h-5"
                                    style={{ 
                                      backgroundColor: threshold.color + '20',
                                      borderColor: threshold.color,
                                      color: threshold.color
                                    }}
                                  >
                                    {threshold.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          )}
                        </div>
                        {param.interlockId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 flex-shrink-0"
                            onClick={() => {
                              setEditingInterlockIndex(index)
                              setShowInterlockDialog(true)
                              
                              if (param.interlockSource === "master") {
                                // Set the current interlock as custom for editing
                                const newParams = [...(editingChart.yAxisParams || [])]
                                newParams[index] = {
                                  ...newParams[index],
                                  interlockSource: "custom",
                                  interlockDefinition: param.interlockDefinition ? { ...param.interlockDefinition } : undefined,
                                  selectedThresholds: newParams[index]?.selectedThresholds || []
                                }
                                setEditingChart({ ...editingChart, yAxisParams: newParams })
                              }
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
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
                    )}
                  </div>
                  <div className="w-16 flex-shrink-0">
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
                  <div className="w-7 flex-shrink-0">
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
              </div>
            )) || <p className="text-sm text-muted-foreground px-1">No Y parameters added yet.</p>}
          </div>
        </div>
      </div>

      <InterlockRegistrationDialog
        open={showInterlockDialog}
        onOpenChange={setShowInterlockDialog}
        onSave={handleInterlockSave}
        initialDefinition={
          editingInterlockIndex !== null 
            ? editingChart.yAxisParams?.[editingInterlockIndex]?.interlockDefinition 
            : undefined
        }
        initialSelectedThresholds={
          editingInterlockIndex !== null 
            ? editingChart.yAxisParams?.[editingInterlockIndex]?.selectedThresholds 
            : undefined
        }
      />
    </div>
  )
}