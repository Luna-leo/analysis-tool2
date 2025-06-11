"use client"

import React from "react"
import { YAxisGroup } from "./YAxisGroup"
import { ChartComponent, InterlockMaster, EventInfo } from "@/types"
import { FormulaMaster } from "@/data/formulaMaster"

interface YParameterListProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  parameterInputRefs: { current: (HTMLInputElement | null)[] }
  parameterTypeSelectRefs: { current: (HTMLSelectElement | null)[] }
  axisLabelInputRefs: { current: Record<number, HTMLInputElement | null> }
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
  updateAxisLabel: (axisNo: number, label: string) => void
  updateAxisRange: (axisNo: number, rangeUpdate: Partial<{ auto: boolean; min: number; max: number }>) => void
  addParameterToAxis: (axisNo: number) => void
  removeAxisGroup: (axisNo: number) => void
  groupParametersByAxis: () => Record<number, number[]>
  selectedDataSourceItems?: EventInfo[]
}

export function YParameterList({
  editingChart,
  setEditingChart,
  parameterInputRefs,
  parameterTypeSelectRefs,
  axisLabelInputRefs,
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
  updateAxisLabel,
  updateAxisRange,
  addParameterToAxis,
  removeAxisGroup,
  groupParametersByAxis,
  selectedDataSourceItems
}: YParameterListProps) {
  return (
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
              removeAxisGroup={removeAxisGroup}
              totalAxisGroups={Object.keys(groupParametersByAxis()).length}
              parameterInputRefs={parameterInputRefs}
              parameterTypeSelectRefs={parameterTypeSelectRefs}
              axisLabelInputRef={axisLabelInputRefs}
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
          )
        })
      ) : (
        <p className="text-sm text-muted-foreground px-1">No Y parameters added yet.</p>
      )}
    </div>
  )
}