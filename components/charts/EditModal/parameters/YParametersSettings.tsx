"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { ChartComponent, InterlockMaster, InterlockDefinition } from "@/types"
import { FormulaDefinition } from "@/types/formula"
import { FormulaMaster } from "@/data/formulaMaster"
import { formulaMasterToDefinition } from "@/utils/formulaUtils"
import { YParameterList } from "./YParameterList"
import { YParameterDialogs } from "./YParameterDialogs"
import { useYParameterHandlers } from "./useYParameterHandlers"
import { useYParameterGrouping } from "./useYParameterGrouping"

interface YParametersSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  isReferenceLinesOpen?: boolean
}

export function YParametersSettings({ editingChart, setEditingChart, isReferenceLinesOpen }: YParametersSettingsProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [lastAddedParamIndex, setLastAddedParamIndex] = useState<number | null>(null)
  const [lastAddedAxisNo, setLastAddedAxisNo] = useState<number | null>(null)
  const [showInterlockDialog, setShowInterlockDialog] = useState(false)
  const [editingInterlockIndex, setEditingInterlockIndex] = useState<number | null>(null)
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [interlockMode, setInterlockMode] = useState<"create" | "edit" | "duplicate">("create")
  const [showFormulaDialog, setShowFormulaDialog] = useState(false)
  const [editingFormulaIndex, setEditingFormulaIndex] = useState<number | null>(null)
  const [formulaMode, setFormulaMode] = useState<"create" | "edit" | "duplicate">("create")
  const parameterInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const parameterTypeSelectRefs = useRef<(HTMLSelectElement | null)[]>([])
  const axisLabelInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  // Initialize default parameter if none exist
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

  // Focus on newly added parameter type select
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

  // Use custom hooks for handlers and grouping
  const handlers = useYParameterHandlers({
    editingChart,
    setEditingChart,
    setEditingInterlockIndex,
    setInterlockMode,
    setShowInterlockDialog,
    setEditingFormulaIndex,
    setFormulaMode,
    setShowFormulaDialog,
    setOpenComboboxIndex,
    setSearchQuery
  })

  // Wrap save handlers to include index
  const handleFormulaSave = (formula: FormulaMaster) => {
    if (editingFormulaIndex !== null) {
      handlers.handleFormulaSave(formula, editingFormulaIndex)
    }
  }

  const handleInterlockSave = (interlockDefinition: InterlockDefinition, selectedThresholds: string[], plant: string, machineNo: string) => {
    if (editingInterlockIndex !== null) {
      handlers.handleInterlockSave(interlockDefinition, selectedThresholds, plant, machineNo, editingInterlockIndex)
    }
  }

  const {
    groupParametersByAxis,
    updateAxisLabel,
    updateAxisRange,
    addNewAxisGroup,
    removeAxisGroup,
    addParameterToAxis
  } = useYParameterGrouping({
    editingChart,
    setEditingChart,
    setLastAddedParamIndex,
    setLastAddedAxisNo
  })

  // Override filter functions to use searchQuery from state
  const filterFormulasWithQuery = (formulas: FormulaMaster[]) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return formulas

    return formulas.filter(formula => {
      const searchableText = [
        formula.name,
        formula.description,
        formula.category,
        formula.expression
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }

  const filterInterlocksWithQuery = (interlocks: InterlockMaster[]) => {
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

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <div className="border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 p-3 border-b bg-muted/20">
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
            <div className={`px-3 pt-3 pb-3 overflow-y-auto ${isReferenceLinesOpen ? 'max-h-48' : 'max-h-96'}`}>
              <YParameterList
                editingChart={editingChart}
                setEditingChart={setEditingChart}
                parameterInputRefs={parameterInputRefs}
                parameterTypeSelectRefs={parameterTypeSelectRefs}
                axisLabelInputRefs={axisLabelInputRefs}
                openComboboxIndex={openComboboxIndex}
                setOpenComboboxIndex={setOpenComboboxIndex}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleParameterTypeChange={handlers.handleParameterTypeChange}
                handleFormulaSelect={handlers.handleFormulaSelect}
                handleInterlockSelect={handlers.handleInterlockSelect}
                filterFormulas={filterFormulasWithQuery}
                filterInterlocks={filterInterlocksWithQuery}
                handleThresholdRemove={handlers.handleThresholdRemove}
                handleThresholdAdd={handlers.handleThresholdAdd}
                updateAxisLabel={updateAxisLabel}
                updateAxisRange={updateAxisRange}
                addParameterToAxis={addParameterToAxis}
                removeAxisGroup={removeAxisGroup}
                groupParametersByAxis={groupParametersByAxis}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <YParameterDialogs
        showInterlockDialog={showInterlockDialog}
        setShowInterlockDialog={setShowInterlockDialog}
        showFormulaDialog={showFormulaDialog}
        setShowFormulaDialog={setShowFormulaDialog}
        interlockMode={interlockMode}
        setInterlockMode={setInterlockMode}
        formulaMode={formulaMode}
        setFormulaMode={setFormulaMode}
        editingInterlockIndex={editingInterlockIndex}
        editingFormulaIndex={editingFormulaIndex}
        editingChart={editingChart}
        handleInterlockSave={handleInterlockSave}
        handleFormulaSave={handleFormulaSave}
      />
    </>
  )
}