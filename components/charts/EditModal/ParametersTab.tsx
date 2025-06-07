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
import { X, Plus, ChevronDown, Copy } from "lucide-react"
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
  const [isNewInterlock, setIsNewInterlock] = useState(false)
  const parameterInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const parameterTypeSelectRefs = useRef<(HTMLSelectElement | null)[]>([])

  useEffect(() => {
    if (!editingChart.yAxisParams || editingChart.yAxisParams.length === 0) {
      const defaultParam = {
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
      setEditingChart({
        ...editingChart,
        yAxisParams: [defaultParam],
      })
    }
  }, [editingChart, setEditingChart])

  useEffect(() => {
    if (lastAddedParamIndex !== null && parameterTypeSelectRefs.current[lastAddedParamIndex]) {
      const selectElement = parameterTypeSelectRefs.current[lastAddedParamIndex]
      selectElement?.focus()
      selectElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Show dropdown after focusing
      setTimeout(() => {
        if (selectElement && typeof selectElement.showPicker === 'function') {
          selectElement.showPicker()
        } else {
          // Fallback for browsers that don't support showPicker
          const event = new MouseEvent('mousedown', { bubbles: true })
          selectElement?.dispatchEvent(event)
        }
      }, 100)
      setLastAddedParamIndex(null)
    }
  }, [lastAddedParamIndex, editingChart?.yAxisParams?.length])

  // Reset search query when switching between different comboboxes
  useEffect(() => {
    setSearchQuery("")
  }, [openComboboxIndex])

  const handleInterlockSave = (interlockDefinition: InterlockDefinition, selectedThresholds: string[], _plant: string, _machineNo: string) => {
    if (editingInterlockIndex !== null) {
      const newParams = [...(editingChart.yAxisParams || [])]
      // 選択された閾値がない場合は、デフォルトですべての閾値を選択
      const finalSelectedThresholds = selectedThresholds.length > 0 
        ? selectedThresholds 
        : interlockDefinition.thresholds.map(t => t.id)
      newParams[editingInterlockIndex] = {
        ...newParams[editingInterlockIndex],
        interlockDefinition,
        parameter: interlockDefinition.name,
        interlockSource: "custom",
        selectedThresholds: finalSelectedThresholds
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

  const handleInterlockSelect = (index: number, value: string, duplicate: boolean = false) => {
    setOpenComboboxIndex(null)
    setSearchQuery("") // Reset search query after selection
    
    if (value === "add-new") {
      setEditingInterlockIndex(index)
      setIsNewInterlock(true)
      // Clear any existing interlock data for truly new interlock
      const newParams = [...(editingChart.yAxisParams || [])]
      if (newParams[index]) {
        newParams[index] = {
          ...newParams[index],
          interlockDefinition: undefined,
          selectedThresholds: undefined
        }
      }
      setEditingChart({ ...editingChart, yAxisParams: newParams })
      setShowInterlockDialog(true)
      return
    }

    const selectedMaster = mockInterlockMaster.find(m => m.id === value)
    if (selectedMaster) {
      if (duplicate) {
        // Open dialog with the master's definition as initial values for duplication
        setEditingInterlockIndex(index)
        setIsNewInterlock(false)
        // Store the master data temporarily to pass to dialog
        const newParams = [...(editingChart.yAxisParams || [])]
        newParams[index] = {
          ...newParams[index],
          interlockDefinition: selectedMaster.definition,
          selectedThresholds: selectedMaster.definition.thresholds.map(t => t.id)
        }
        setEditingChart({ ...editingChart, yAxisParams: newParams })
        setShowInterlockDialog(true)
      } else {
        const newParams = [...(editingChart.yAxisParams || [])]
        // デフォルトですべての閾値を選択
        const allThresholdIds = selectedMaster.definition.thresholds.map(t => t.id)
        newParams[index] = {
          ...newParams[index],
          interlockId: value,
          interlockSource: "master",
          interlockDefinition: selectedMaster.definition,
          parameter: selectedMaster.name,
          selectedThresholds: allThresholdIds
        }
        setEditingChart({ ...editingChart, yAxisParams: newParams })
      }
    }
  }

  const filterInterlocks = (interlocks: typeof mockInterlockMaster) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return interlocks

    return interlocks.filter(master => {
      const searchableText = [
        master.name,
        master.plant_name,
        master.machine_no
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }

  const handleThresholdRemove = (paramIndex: number, thresholdId: string) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    const currentSelectedThresholds = newParams[paramIndex].selectedThresholds || []
    newParams[paramIndex] = {
      ...newParams[paramIndex],
      selectedThresholds: currentSelectedThresholds.filter(id => id !== thresholdId)
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }

  const handleThresholdAdd = (paramIndex: number, thresholdId: string) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    const currentSelectedThresholds = newParams[paramIndex].selectedThresholds || []
    if (!currentSelectedThresholds.includes(thresholdId)) {
      newParams[paramIndex] = {
        ...newParams[paramIndex],
        selectedThresholds: [...currentSelectedThresholds, thresholdId]
      }
      setEditingChart({ ...editingChart, yAxisParams: newParams })
    }
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
                      ref={(el) => {
                        parameterTypeSelectRefs.current[index] = el
                      }}
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
                                      setSearchQuery("") // Always reset search query
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
                                              className="flex items-center justify-between group"
                                            >
                                              <div className="flex flex-col items-start flex-1">
                                                <span className="font-medium text-left">{master.name}</span>
                                                <span className="text-xs text-muted-foreground text-left">
                                                  {master.plant_name} • {master.machine_no}
                                                </span>
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleInterlockSelect(index, master.id, true)
                                                }}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
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
                          {(param.selectedThresholds && param.selectedThresholds.length > 0) || param.interlockDefinition ? (
                            <div className="flex gap-1 flex-wrap items-center relative">
                              {param.selectedThresholds?.map(thresholdId => {
                                const threshold = param.interlockDefinition?.thresholds.find(t => t.id === thresholdId)
                                return threshold ? (
                                  <Badge 
                                    key={thresholdId} 
                                    variant="secondary" 
                                    className="text-xs px-1.5 py-0 h-5 flex items-center gap-1"
                                    style={{ 
                                      backgroundColor: threshold.color + '20',
                                      borderColor: threshold.color,
                                      color: threshold.color
                                    }}
                                  >
                                    <span>{threshold.name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleThresholdRemove(index, thresholdId)
                                      }}
                                      className="hover:bg-black/10 rounded-full p-0.5"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  </Badge>
                                ) : null
                              })}
                              {param.interlockDefinition && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 border border-dashed border-gray-400 hover:border-gray-600 absolute -right-6 top-0 z-10"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-1">
                                    <div className="space-y-1">
                                      {param.interlockDefinition.thresholds
                                        .filter(threshold => !param.selectedThresholds?.includes(threshold.id))
                                        .map(threshold => (
                                          <button
                                            key={threshold.id}
                                            onClick={() => handleThresholdAdd(index, threshold.id)}
                                            className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded flex items-center gap-2"
                                          >
                                            <span
                                              className="w-2 h-2 rounded-full"
                                              style={{ backgroundColor: threshold.color }}
                                            />
                                            {threshold.name}
                                          </button>
                                        ))}
                                      {param.interlockDefinition.thresholds.every(threshold => 
                                        param.selectedThresholds?.includes(threshold.id)
                                      ) && (
                                        <div className="px-2 py-1 text-xs text-muted-foreground">
                                          All thresholds selected
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          ) : null}
                        </div>
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
        onOpenChange={(open) => {
          setShowInterlockDialog(open)
          if (!open) {
            setIsNewInterlock(false)
          }
        }}
        onSave={handleInterlockSave}
        initialDefinition={
          editingInterlockIndex !== null && !isNewInterlock
            ? editingChart.yAxisParams?.[editingInterlockIndex]?.interlockDefinition 
            : undefined
        }
        initialSelectedThresholds={
          editingInterlockIndex !== null && !isNewInterlock
            ? editingChart.yAxisParams?.[editingInterlockIndex]?.selectedThresholds 
            : undefined
        }
      />
    </div>
  )
}