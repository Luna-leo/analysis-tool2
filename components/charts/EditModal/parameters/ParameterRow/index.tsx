"use client"

import React, { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ChartComponent, EventInfo } from "@/types"
import { FormulaMaster } from "@/data/formulaMaster"
import { mockInterlockMaster } from "@/data/interlockMaster"
import { FormulaParameterRow } from "./FormulaParameterRow"
import { InterlockParameterRow } from "./InterlockParameterRow"
import { RegularParameterRow } from "./RegularParameterRow"
import { UnitSelector } from "../UnitSelector"

interface ParameterRowProps {
  index: number
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  parameterInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  parameterTypeSelectRefs: React.MutableRefObject<(HTMLSelectElement | null)[]>
  openComboboxIndex: number | null
  setOpenComboboxIndex: (index: number | null) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleParameterTypeChange: (index: number, newType: "Parameter" | "Formula" | "Interlock") => void
  handleFormulaSelect: (index: number, value: string, mode?: "select" | "edit" | "duplicate") => void
  handleInterlockSelect: (index: number, value: string, mode?: "select" | "edit" | "duplicate") => void
  filterFormulas: (formulas: FormulaMaster[]) => FormulaMaster[]
  filterInterlocks: (interlocks: typeof mockInterlockMaster) => typeof mockInterlockMaster
  handleThresholdRemove: (paramIndex: number, thresholdId: string) => void
  handleThresholdAdd: (paramIndex: number, thresholdId: string) => void
  selectedDataSourceItems?: EventInfo[]
}

export const ParameterRow = React.memo(({
  index,
  editingChart,
  setEditingChart,
  parameterInputRefs,
  parameterTypeSelectRefs,
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
}: ParameterRowProps) => {
  const param = editingChart.yAxisParams![index]
  
  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    handleParameterTypeChange(index, e.target.value as "Parameter" | "Formula" | "Interlock")
  }, [handleParameterTypeChange, index])
  
  const handleRemove = useCallback(() => {
    const newParams = editingChart.yAxisParams?.filter((_, i) => i !== index) || []
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }, [editingChart, setEditingChart, index])

  return (
    <div className="flex gap-2 items-center">
      <div className="w-24">
        <select
          ref={(el) => {
            parameterTypeSelectRefs.current[index] = el
          }}
          value={param.parameterType || "Parameter"}
          onChange={handleTypeChange}
          className="w-full h-7 px-2 py-1 border rounded-md text-xs"
        >
          <option value="Parameter">Parameter</option>
          <option value="Formula">Formula</option>
          <option value="Interlock">Interlock</option>
        </select>
      </div>

      <div className="flex-1">
        <div className="space-y-1">
          {param.parameterType === "Formula" ? (
            <FormulaParameterRow
              index={index}
              parameter={param.parameter}
              formulaDefinition={param.formulaDefinition}
              openComboboxIndex={openComboboxIndex}
              setOpenComboboxIndex={setOpenComboboxIndex}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleFormulaSelect={handleFormulaSelect}
              filterFormulas={filterFormulas}
            />
          ) : param.parameterType === "Interlock" ? (
            <InterlockParameterRow
              index={index}
              parameter={param.parameter}
              interlockDefinition={param.interlockDefinition}
              selectedThresholds={param.selectedThresholds}
              openComboboxIndex={openComboboxIndex}
              setOpenComboboxIndex={setOpenComboboxIndex}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleInterlockSelect={handleInterlockSelect}
              filterInterlocks={filterInterlocks}
              handleThresholdRemove={handleThresholdRemove}
              handleThresholdAdd={handleThresholdAdd}
            />
          ) : (
            <RegularParameterRow
              index={index}
              parameter={param.parameter}
              editingChart={editingChart}
              setEditingChart={setEditingChart}
              selectedDataSourceItems={selectedDataSourceItems}
            />
          )}
        </div>
      </div>

      <UnitSelector
        index={index}
        param={param}
        editingChart={editingChart}
        setEditingChart={setEditingChart}
      />

      <div className="w-7">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={handleRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
})

ParameterRow.displayName = 'ParameterRow'

export { FormulaParameterRow } from "./FormulaParameterRow"
export { InterlockParameterRow } from "./InterlockParameterRow"
export { RegularParameterRow } from "./RegularParameterRow"