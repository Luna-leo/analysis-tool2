"use client"

import React, { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronRight, Trash2, Plus, RotateCcw } from "lucide-react"
import { ChartComponent, InterlockMaster, EventInfo } from "@/types"
import { FormulaMaster } from "@/data/formulaMaster"
import { ParameterRow } from "./ParameterRow"
import { useUnitValidation } from "@/hooks/useUnitValidation"
import { UnitMismatchAlert } from "./UnitMismatchAlert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { parseParameterKey } from "@/utils/parameterUtils"

interface YAxisGroupProps {
  axisNo: number
  paramIndexes: number[]
  axisLabel: string
  axisRange: { auto: boolean; min: number; max: number }
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  updateAxisLabel: (axisNo: number, label: string) => void
  updateAxisRange: (
    axisNo: number,
    rangeUpdate: Partial<{ auto: boolean; min: number; max: number }>
  ) => void
  addParameterToAxis: (axisNo: number) => void
  removeAxisGroup: (axisNo: number) => void
  totalAxisGroups: number
  parameterInputRefs: React.RefObject<(HTMLInputElement | null)[]>
  parameterTypeSelectRefs: React.RefObject<(HTMLSelectElement | null)[]>
  axisLabelInputRef?: React.RefObject<Record<number, HTMLInputElement | null>>
  openComboboxIndex: number | null
  setOpenComboboxIndex: (index: number | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleParameterTypeChange: (index: number, newType: "Parameter" | "Formula" | "Interlock") => void
  handleFormulaSelect: (index: number, value: string, mode?: "select" | "edit" | "duplicate") => void
  handleInterlockSelect: (index: number, value: string, mode?: "select" | "edit" | "duplicate") => void
  filterFormulas: (formulas: FormulaMaster[]) => FormulaMaster[]
  filterInterlocks: (interlocks: InterlockMaster[]) => InterlockMaster[]
  handleThresholdRemove: (paramIndex: number, thresholdId: string) => void
  handleThresholdAdd: (paramIndex: number, thresholdId: string) => void
  selectedDataSourceItems?: EventInfo[]
}

export function YAxisGroup({
  axisNo,
  paramIndexes,
  axisLabel,
  axisRange,
  editingChart,
  setEditingChart,
  updateAxisLabel,
  updateAxisRange,
  addParameterToAxis,
  removeAxisGroup,
  totalAxisGroups,
  parameterInputRefs,
  parameterTypeSelectRefs,
  axisLabelInputRef,
  openComboboxIndex,
  setOpenComboboxIndex,
  searchQuery,
  setSearchQuery,
  handleParameterTypeChange,
  handleFormulaSelect,
  handleInterlockSelect,
  filterFormulas,
  filterInterlocks,
  handleThresholdRemove,
  handleThresholdAdd,
  selectedDataSourceItems,
}: YAxisGroupProps) {
  const [isOpen, setIsOpen] = useState(true)
  
  // Validate units for this axis
  const unitValidation = useUnitValidation({
    axisNo,
    paramIndexes,
    chartParams: editingChart.yAxisParams,
  })

  // Generate auto label for this axis
  const getAutoLabelForAxis = () => {
    const params = editingChart.yAxisParams?.filter((_, idx) => paramIndexes.includes(idx)) || []
    if (params.length === 0) return ""
    
    // Use the first parameter name for that axis
    const firstParam = params[0]
    if (firstParam.parameterType === "Formula" || firstParam.parameterType === "Interlock") {
      return firstParam.parameter
    }
    
    const parsed = parseParameterKey(firstParam.parameter)
    return parsed ? parsed.name : firstParam.parameter
  }

  const handleResetLabel = () => {
    updateAxisLabel(axisNo, getAutoLabelForAxis())
  }

  return (
    <div className="border rounded-lg bg-muted/10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header with collapse trigger */}
        <div className="p-2">
          <div className="flex items-center gap-4">
            <CollapsibleTrigger className="flex items-center gap-1 hover:bg-muted/50 transition-colors p-1 rounded -ml-1">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <h5 className="font-medium text-sm">Y-Axis {axisNo}</h5>
              <span className="text-xs text-muted-foreground">
                ({paramIndexes.length} param{paramIndexes.length !== 1 ? "s" : ""})
              </span>
            </CollapsibleTrigger>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                  {axisRange.auto ? `Range: Auto` : `Range: ${axisRange.min} - ${axisRange.max}`}
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
                    <Label htmlFor={`y-auto-axis-${axisNo}`} className="text-sm">
                      Auto Range
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Min Value</Label>
                      <Input
                        type="number"
                        value={axisRange.min}
                        onChange={(e) => updateAxisRange(axisNo, { auto: false, min: parseFloat(e.target.value) || 0 })}
                        disabled={axisRange.auto}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Value</Label>
                      <Input
                        type="number"
                        value={axisRange.max}
                        onChange={(e) => updateAxisRange(axisNo, { auto: false, max: parseFloat(e.target.value) || 100 })}
                        disabled={axisRange.auto}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-1 ml-auto">
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
                    paramIndexes.forEach((index) => {
                      newParams[index] = { ...newParams[index], axisNo: newAxisNo }
                    })
                    setEditingChart({ ...editingChart, yAxisParams: newParams })
                  }
                }}
                className="w-12 h-7 text-xs px-1"
              />
              {totalAxisGroups > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAxisGroup(axisNo)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible parameter table */}
        <CollapsibleContent>
          <div className="px-2 pb-2">
            {/* Y-axis label row */}
            <div className="flex gap-2 items-center mb-2 px-1">
              <Label htmlFor={`y-axis-label-${axisNo}`} className="text-sm w-24">Y-axis Label</Label>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  id={`y-axis-label-${axisNo}`}
                  ref={(el) => {
                    if (axisLabelInputRef) {
                      axisLabelInputRef.current[axisNo] = el
                    }
                  }}
                  value={axisLabel}
                  onChange={(e) => updateAxisLabel(axisNo, e.target.value)}
                  placeholder={axisLabel ? `Y-axis ${axisNo} label` : `Auto: ${getAutoLabelForAxis() || "Add parameters first"}`}
                  className="h-7 text-sm flex-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Checkbox
                          id={`auto-update-y-label-${axisNo}`}
                          checked={editingChart.autoUpdateYLabels ?? true}
                          onCheckedChange={(checked) => {
                            setEditingChart({
                              ...editingChart,
                              autoUpdateYLabels: checked === true,
                            })
                          }}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`auto-update-y-label-${axisNo}`}
                          className="text-xs font-normal cursor-pointer ml-1.5"
                        >
                          Auto-update
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Auto-update label when parameters change</p>
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
                        className="h-7 w-7 p-0"
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
            
            <div className="pt-1 border-t">
              <div className="flex gap-2 mb-1 px-1 text-xs font-medium text-muted-foreground border-b pb-1 mt-1">
                <div className="w-24">Type</div>
                <div className="flex-1">Parameter</div>
                <div className="w-24">Display Unit</div>
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

              <div className="max-h-48 overflow-y-auto">
                {paramIndexes.map((index) => (
                  <ParameterRow
                    key={index}
                    index={index}
                    editingChart={editingChart}
                    setEditingChart={setEditingChart}
                    parameterInputRefs={parameterInputRefs}
                    parameterTypeSelectRefs={parameterTypeSelectRefs}
                    openComboboxIndex={openComboboxIndex}
                    setOpenComboboxIndex={setOpenComboboxIndex}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    handleParameterTypeChange={handleParameterTypeChange}
                    handleFormulaSelect={handleFormulaSelect}
                    handleInterlockSelect={handleInterlockSelect}
                    filterFormulas={filterFormulas}
                    filterInterlocks={filterInterlocks}
                    handleThresholdRemove={handleThresholdRemove}
                    handleThresholdAdd={handleThresholdAdd}
                    selectedDataSourceItems={selectedDataSourceItems}
                  />
                ))}

              </div>

              {/* Unit mismatch warning */}
              <UnitMismatchAlert
                unitValidation={unitValidation}
                paramIndexes={paramIndexes}
                editingChart={editingChart}
                setEditingChart={setEditingChart}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
