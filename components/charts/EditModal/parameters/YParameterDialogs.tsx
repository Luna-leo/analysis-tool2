"use client"

import React from "react"
import { InterlockRegistrationDialog } from "./InterlockRegistrationDialog"
import { FormulaRegistrationDialog } from "./FormulaRegistrationDialog"
import { ChartComponent, InterlockDefinition } from "@/types"
import { FormulaMaster } from "@/data/formulaMaster"

interface YParameterDialogsProps {
  showInterlockDialog: boolean
  setShowInterlockDialog: (open: boolean) => void
  showFormulaDialog: boolean
  setShowFormulaDialog: (open: boolean) => void
  interlockMode: "create" | "edit" | "duplicate"
  setInterlockMode: (mode: "create" | "edit" | "duplicate") => void
  formulaMode: "create" | "edit" | "duplicate"
  setFormulaMode: (mode: "create" | "edit" | "duplicate") => void
  editingInterlockIndex: number | null
  editingFormulaIndex: number | null
  editingChart: ChartComponent
  handleInterlockSave: (interlockDefinition: InterlockDefinition, selectedThresholds: string[], plant: string, machineNo: string) => void
  handleFormulaSave: (formula: FormulaMaster) => void
}

export function YParameterDialogs({
  showInterlockDialog,
  setShowInterlockDialog,
  showFormulaDialog,
  setShowFormulaDialog,
  interlockMode,
  setInterlockMode,
  formulaMode,
  setFormulaMode,
  editingInterlockIndex,
  editingFormulaIndex,
  editingChart,
  handleInterlockSave,
  handleFormulaSave
}: YParameterDialogsProps) {
  return (
    <>
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

      <FormulaRegistrationDialog
        open={showFormulaDialog}
        onOpenChange={(open) => {
          setShowFormulaDialog(open)
          if (!open) {
            setFormulaMode("create")
          }
        }}
        onSave={handleFormulaSave}
        mode={formulaMode}
        initialFormula={
          editingFormulaIndex !== null && formulaMode !== "create"
            ? editingChart.yAxisParams?.[editingFormulaIndex]?.formulaDefinition
            : undefined
        }
      />
    </>
  )
}