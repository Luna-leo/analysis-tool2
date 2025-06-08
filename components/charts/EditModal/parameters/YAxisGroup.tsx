"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ChevronDown, ChevronRight } from "lucide-react"
import { ChartComponent } from "@/types"
import { mockInterlockMaster } from "@/data/interlockMaster"
import { ParameterRow } from "./ParameterRow"

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
  parameterInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  parameterTypeSelectRefs: React.MutableRefObject<(HTMLSelectElement | null)[]>
  axisLabelInputRef?: React.MutableRefObject<Record<number, HTMLInputElement | null>>
  openComboboxIndex: number | null
  setOpenComboboxIndex: (index: number | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleParameterTypeChange: (index: number, newType: "Parameter" | "Formula" | "Interlock") => void
  handleInterlockSelect: (index: number, value: string, mode?: "select" | "edit" | "duplicate") => void
  filterInterlocks: (interlocks: typeof mockInterlockMaster) => typeof mockInterlockMaster
  handleThresholdRemove: (paramIndex: number, thresholdId: string) => void
  handleThresholdAdd: (paramIndex: number, thresholdId: string) => void
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
  parameterInputRefs,
  parameterTypeSelectRefs,
  axisLabelInputRef,
  openComboboxIndex,
  setOpenComboboxIndex,
  searchQuery,
  setSearchQuery,
  handleParameterTypeChange,
  handleInterlockSelect,
  filterInterlocks,
  handleThresholdRemove,
  handleThresholdAdd,
}: YAxisGroupProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border rounded-lg bg-muted/10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header with collapse trigger */}
        <div className="p-2">
          <div className="flex items-center gap-4">
            <div className="w-32">
              <div className="flex items-center gap-1">
                <CollapsibleTrigger className="flex items-center gap-1 hover:bg-muted/50 transition-colors p-1 rounded -ml-1">
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  <h5 className="font-medium text-sm">Y-Axis {axisNo}</h5>
                </CollapsibleTrigger>
                <span className="text-xs text-muted-foreground">
                  ({paramIndexes.length} param{paramIndexes.length !== 1 ? "s" : ""})
                </span>
              </div>
            </div>

            <div className="flex-1">
              <Input
                ref={(el) => {
                  if (axisLabelInputRef) {
                    axisLabelInputRef.current[axisNo] = el
                  }
                }}
                value={axisLabel}
                onChange={(e) => updateAxisLabel(axisNo, e.target.value)}
                placeholder={`Y-axis ${axisNo} label`}
                className="h-7 text-sm"
              />
            </div>

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
                    paramIndexes.forEach((index) => {
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

        {/* Collapsible parameter table */}
        <CollapsibleContent>
          <div className="px-2 pb-2">
            <div className="space-y-0.5 pt-1 border-t">
              <div className="flex gap-2 mb-1 px-1 text-xs font-medium text-muted-foreground border-b pb-1 mt-1">
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
                  handleInterlockSelect={handleInterlockSelect}
                  filterInterlocks={filterInterlocks}
                  handleThresholdRemove={handleThresholdRemove}
                  handleThresholdAdd={handleThresholdAdd}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
