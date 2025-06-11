"use client"

import React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Plus } from "lucide-react"
import { ChartComponent, UnitValidationResult } from "@/types"
import { useUnitConverterFormulaStore } from "@/stores/useUnitConverterFormulaStore"

interface UnitMismatchAlertProps {
  unitValidation: UnitValidationResult
  paramIndexes: number[]
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function UnitMismatchAlert({
  unitValidation,
  paramIndexes,
  editingChart,
  setEditingChart,
}: UnitMismatchAlertProps) {
  const { openDialog } = useUnitConverterFormulaStore()

  if (!unitValidation.hasUnitMismatch) {
    return null
  }

  const handleConvertAllToUnit = (targetUnit: string) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    paramIndexes.forEach((index) => {
      newParams[index] = {
        ...newParams[index],
        unit: targetUnit,
        // The unit conversion ID will be set by the ParameterRow component
      }
    })
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }

  const handleCreateUnitConversion = () => {
    openDialog('create')
  }

  return (
    <div className="pt-2 px-1">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
        <AlertDescription className="text-sm">
          <div className="font-medium text-yellow-800">Unit mismatch detected</div>
          <div className="text-yellow-700 mt-1 break-words">
            Different units on the same axis: {unitValidation.units.join(", ")}
          </div>
          <div className="text-yellow-700 mt-2">
            {unitValidation.canBeConverted ? (
              <>
                <div className="break-words">Convert all parameters to a common unit:</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {unitValidation.units.map((unit) => (
                    <Button
                      key={unit}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-yellow-400 hover:bg-yellow-100"
                      onClick={() => handleConvertAllToUnit(unit)}
                    >
                      Convert All to {unit}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="break-words">No conversion formula available between these units.</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs border-yellow-400 hover:bg-yellow-100"
                  onClick={handleCreateUnitConversion}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Create Unit Conversion Formula
                </Button>
              </>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}