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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Plus, ChevronDown, ChevronRight, Copy, Edit2 } from "lucide-react"
import { ChartComponent, InterlockDefinition } from "@/types"
import { mockInterlockMaster } from "@/data/interlockMaster"
import { InterlockRegistrationDialog } from "./InterlockRegistrationDialog"

interface YParametersSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function YParametersSettings({ editingChart, setEditingChart }: YParametersSettingsProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [lastAddedParamIndex, setLastAddedParamIndex] = useState<number | null>(null)
  const [showInterlockDialog, setShowInterlockDialog] = useState(false)
  const [editingInterlockIndex, setEditingInterlockIndex] = useState<number | null>(null)
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [interlockMode, setInterlockMode] = useState<"create" | "edit" | "duplicate">("create")
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

  const handleInterlockSelect = (index: number, value: string, mode: "select" | "edit" | "duplicate" = "select") => {
    setOpenComboboxIndex(null)
    setSearchQuery("") // Reset search query after selection
    
    if (value === "add-new") {
      setEditingInterlockIndex(index)
      setInterlockMode("create")
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
      if (mode === "edit" || mode === "duplicate") {
        // Open dialog with the master's definition as initial values
        setEditingInterlockIndex(index)
        setInterlockMode(mode)
        // Store the master data temporarily to pass to dialog
        const newParams = [...(editingChart.yAxisParams || [])]
        
        // For duplicate mode, append " (Copy)" to the name
        const definitionToUse = mode === "duplicate" 
          ? {
              ...selectedMaster.definition,
              name: `${selectedMaster.definition.name} (Copy)`
            }
          : selectedMaster.definition
        
        newParams[index] = {
          ...newParams[index],
          interlockDefinition: definitionToUse,
          selectedThresholds: selectedMaster.definition.thresholds.map(t => t.id),
          interlockSource: "custom", // Always create as custom when editing/duplicating
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

  // Group parameters by axis number
  const groupParametersByAxis = () => {
    const groups: Record<number, number[]> = {}
    editingChart.yAxisParams?.forEach((param, index) => {
      const axisNo = param.axisNo || 1
      if (!groups[axisNo]) {
        groups[axisNo] = []
      }
      groups[axisNo].push(index)
    })
    return groups
  }

  // Update axis label for all parameters on the same axis
  const updateAxisLabel = (axisNo: number, label: string) => {
    setEditingChart({
      ...editingChart,
      yAxisLabels: {
        ...editingChart.yAxisLabels,
        [axisNo]: label
      }
    })
  }

  // Update axis range for all parameters on the same axis
  const updateAxisRange = (axisNo: number, rangeUpdate: Partial<{ auto: boolean; min: number; max: number }>) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    newParams.forEach((param, index) => {
      if (param.axisNo === axisNo) {
        newParams[index] = {
          ...param,
          range: {
            ...param.range,
            ...rangeUpdate,
            min: rangeUpdate.min ?? param.range?.min ?? 0,
            max: rangeUpdate.max ?? param.range?.max ?? 100,
          }
        }
      }
    })
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }

  // Get next available axis number
  const getNextAxisNumber = () => {
    const existingAxisNumbers = (editingChart.yAxisParams || []).map(param => param.axisNo || 1)
    const maxAxis = Math.max(...existingAxisNumbers, 0)
    return maxAxis + 1
  }

  // Add new axis group
  const addNewAxisGroup = () => {
    setIsOpen(true)
    const newAxisNo = getNextAxisNumber()
    const newParam = {
      parameterType: "Parameter" as "Parameter" | "Formula" | "Interlock",
      parameter: "",
      axisNo: newAxisNo,
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
  }

  // Add parameter to specific axis
  const addParameterToAxis = (axisNo: number) => {
    const newParam = {
      parameterType: "Parameter" as "Parameter" | "Formula" | "Interlock",
      parameter: "",
      axisNo: axisNo,
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
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex flex-col border rounded-lg bg-muted/30 min-h-0 flex-1">
          <div className="flex items-center gap-2 p-3">
            <CollapsibleTrigger className="flex items-center gap-2 text-left hover:bg-muted/50 transition-colors p-1 rounded">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <h4 className="font-medium text-sm">Y Parameters Settings</h4>
            </CollapsibleTrigger>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs ml-auto"
              onClick={addNewAxisGroup}
            >
              New Axis Group
            </Button>
          </div>
          <CollapsibleContent>
            <div className="px-3 pb-3">

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-4">
            {editingChart.yAxisParams && editingChart.yAxisParams.length > 0 ? (
              Object.entries(groupParametersByAxis()).map(([axisNoStr, paramIndexes]) => {
                const axisNo = parseInt(axisNoStr)
                const firstParam = editingChart.yAxisParams![paramIndexes[0]]
                const axisLabel = editingChart.yAxisLabels?.[axisNo] || ""
                const axisRange = firstParam.range || { auto: true, min: 0, max: 100 }
                
                return (
                  <div key={axisNo} className="border rounded-lg p-2 bg-muted/10">
                    {/* Compact header: Y-Axis | Y-axis Label | Range | Axis No */}
                    <div className="mb-1 pb-1 border-b">
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <h5 className="font-medium text-sm">Y-Axis {axisNo}</h5>
                          <span className="text-xs text-muted-foreground">
                            ({paramIndexes.length} param{paramIndexes.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <Input
                            value={axisLabel}
                            onChange={(e) => updateAxisLabel(axisNo, e.target.value)}
                            placeholder={`Y-axis ${axisNo} label`}
                            className="h-7 text-sm"
                          />
                        </div>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                              {axisRange.auto ? "Range: Auto" : `Range: ${axisRange.min} - ${axisRange.max}`}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`y-auto-axis-${axisNo}`}
                                  checked={axisRange.auto}
                                  onCheckedChange={(checked) => updateAxisRange(axisNo, { auto: checked === true })}
                                />
                                <Label htmlFor={`y-auto-axis-${axisNo}`} className="text-sm">Auto Range</Label>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs">Min Value</Label>
                                  <Input
                                    type="number"
                                    value={axisRange.min}
                                    onChange={(e) => updateAxisRange(axisNo, { min: parseFloat(e.target.value) || 0 })}
                                    disabled={axisRange.auto}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Max Value</Label>
                                  <Input
                                    type="number"
                                    value={axisRange.max}
                                    onChange={(e) => updateAxisRange(axisNo, { max: parseFloat(e.target.value) || 100 })}
                                    disabled={axisRange.auto}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        <div className="flex items-center gap-1">
                          <Label className="text-xs">Axis No:</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={axisNo}
                            onChange={(e) => {
                              const newAxisNo = parseInt(e.target.value) || 1
                              if (newAxisNo !== axisNo) {
                                const newParams = [...(editingChart.yAxisParams || [])]
                                paramIndexes.forEach(index => {
                                  newParams[index] = { ...newParams[index], axisNo: newAxisNo }
                                })
                                setEditingChart({ ...editingChart, yAxisParams: newParams })
                              }
                            }}
                            className="w-12 h-7 text-xs px-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Type | Parameter table */}
                    <div className="space-y-0.5 pt-1">
                      <div className="flex gap-2 mb-1 px-1 text-xs font-medium text-muted-foreground border-b pb-1">
                        <div className="w-24">Type</div>
                        <div className="flex-1">Parameter</div>
                        <div className="w-7 flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 border-dashed border-blue-400 hover:border-blue-600 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                            onClick={() => addParameterToAxis(axisNo)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      {paramIndexes.map((index) => {
                        const param = editingChart.yAxisParams![index]
                        return (
                          <div key={index} className="flex gap-2 items-center">
                            <div className="w-24">
                              <select
                                ref={(el) => {
                                  parameterTypeSelectRefs.current[index] = el
                                }}
                                value={param.parameterType || "Parameter"}
                                onChange={(e) => handleParameterTypeChange(index, e.target.value as "Parameter" | "Formula" | "Interlock")}
                                className="w-full h-7 px-2 py-1 border rounded-md text-xs"
                              >
                                <option value="Parameter">Parameter</option>
                                <option value="Formula">Formula</option>
                                <option value="Interlock">Interlock</option>
                              </select>
                            </div>
                            
                            <div className="flex-1">
                              <div className="space-y-1">
                                {param.parameterType === "Interlock" ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="w-full">
                                          <Popover 
                                            open={openComboboxIndex === index} 
                                            onOpenChange={(open) => {
                                              setOpenComboboxIndex(open ? index : null)
                                              setSearchQuery("")
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
                                                      onSelect={() => handleInterlockSelect(index, master.id, "select")}
                                                      className="flex items-center justify-between group"
                                                    >
                                                      <div className="flex flex-col items-start flex-1">
                                                        <span className="font-medium text-left">{master.name}</span>
                                                        <span className="text-xs text-muted-foreground text-left">
                                                          {master.plant_name} • {master.machine_no}
                                                        </span>
                                                      </div>
                                                      <div className="flex gap-1">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                          onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleInterlockSelect(index, master.id, "edit")
                                                          }}
                                                          title="Edit interlock"
                                                        >
                                                          <Edit2 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                          onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleInterlockSelect(index, master.id, "duplicate")
                                                          }}
                                                          title="Duplicate interlock"
                                                        >
                                                          <Copy className="h-3 w-3" />
                                                        </Button>
                                                      </div>
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
                                
                                {param.parameterType === "Interlock" && ((param.selectedThresholds && param.selectedThresholds.length > 0) || param.interlockDefinition) && (
                                  <div className="flex gap-1 flex-wrap items-center mt-1">
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
                                            className="h-5 w-5 p-0 border border-dashed border-gray-400 hover:border-gray-600"
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
                                )}
                              </div>
                            </div>
                            
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
                        )
                      })}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground px-1">No Y parameters added yet.</p>
            )}
          </div>
        </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <InterlockRegistrationDialog
        open={showInterlockDialog}
        onOpenChange={(open) => {
          setShowInterlockDialog(open)
          if (!open) {
            setInterlockMode("create")
          }
        }}
        onSave={handleInterlockSave}
        mode={interlockMode}
        initialDefinition={
          editingInterlockIndex !== null && interlockMode !== "create"
            ? editingChart.yAxisParams?.[editingInterlockIndex]?.interlockDefinition 
            : undefined
        }
        initialSelectedThresholds={
          editingInterlockIndex !== null && interlockMode !== "create"
            ? editingChart.yAxisParams?.[editingInterlockIndex]?.selectedThresholds 
            : undefined
        }
      />
    </>
  )
}