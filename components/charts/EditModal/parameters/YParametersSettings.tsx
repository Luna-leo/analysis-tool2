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
import { YAxisGroup } from "./YAxisGroup"
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
  const [lastAddedAxisNo, setLastAddedAxisNo] = useState<number | null>(null)
  const [showInterlockDialog, setShowInterlockDialog] = useState(false)
  const [editingInterlockIndex, setEditingInterlockIndex] = useState<number | null>(null)
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [interlockMode, setInterlockMode] = useState<"create" | "edit" | "duplicate">("create")
  const parameterInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const parameterTypeSelectRefs = useRef<(HTMLSelectElement | null)[]>([])
  const axisLabelInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

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
      setLastAddedParamIndex(null)
    }
  }, [lastAddedParamIndex, editingChart?.yAxisParams?.length])

  // Reset search query when switching between different comboboxes
  useEffect(() => {
    setSearchQuery("")
  }, [openComboboxIndex])

  // Focus on Y-axis label input when new axis group is added
  useEffect(() => {
    if (lastAddedAxisNo !== null && axisLabelInputRefs.current[lastAddedAxisNo]) {
      const inputElement = axisLabelInputRefs.current[lastAddedAxisNo]
      inputElement?.focus()
      inputElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setLastAddedAxisNo(null)
    }
  }, [lastAddedAxisNo, editingChart?.yAxisParams?.length])

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
    setLastAddedAxisNo(newAxisNo)
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
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="h-full flex flex-col"
      >
        <div className="border rounded-lg bg-muted/30 flex flex-col flex-1">
          <div className="flex items-center gap-2 p-3 border-b bg-muted/20 sticky top-0 z-10">
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

        <div className="flex-1 overflow-y-auto min-h-0 max-h-96">
          <div className="space-y-4">
              {editingChart.yAxisParams && editingChart.yAxisParams.length > 0 ? (
                Object.entries(groupParametersByAxis()).map(([axisNoStr, paramIndexes]) => {
                  const axisNo = parseInt(axisNoStr)
                  const firstParam = editingChart.yAxisParams![paramIndexes[0]]
                  const axisLabel = editingChart.yAxisLabels?.[axisNo] || ""
                  const axisRange = { 
                    auto: firstParam.range?.auto ?? true, 
                    min: firstParam.range?.min ?? 0, 
                    max: firstParam.range?.max ?? 100 
                  }
                  return (
                    <YAxisGroup
                      key={axisNo}
                      axisNo={axisNo}
                      paramIndexes={paramIndexes}
                      axisLabel={axisLabel}
                      axisRange={axisRange}
                      editingChart={editingChart}
                      setEditingChart={setEditingChart}
                      updateAxisLabel={updateAxisLabel}
                      updateAxisRange={updateAxisRange}
                      addParameterToAxis={addParameterToAxis}
                      parameterInputRefs={parameterInputRefs}
                      parameterTypeSelectRefs={parameterTypeSelectRefs}
                      axisLabelInputRef={axisLabelInputRefs}
                      openComboboxIndex={openComboboxIndex}
                      setOpenComboboxIndex={setOpenComboboxIndex}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      handleParameterTypeChange={handleParameterTypeChange}
                      handleInterlockSelect={handleInterlockSelect}
                      filterInterlocks={filterInterlocks}
                      handleThresholdRemove={handleThresholdRemove}
                      handleThresholdAdd={handleThresholdAdd}
                    />
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