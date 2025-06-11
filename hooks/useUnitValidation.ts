import { useMemo } from "react"
import { ChartComponent, UnitValidationResult } from "@/types"
import { validateAxisUnits } from "@/utils/unitValidation"
import { useFormulaMasterStore } from "@/stores/useFormulaMasterStore"
import { useUnitConverterFormulaStore } from "@/stores/useUnitConverterFormulaStore"

interface UseUnitValidationProps {
  axisNo: number
  paramIndexes: number[]
  chartParams: ChartComponent["yAxisParams"]
}

export function useUnitValidation({
  axisNo,
  paramIndexes,
  chartParams,
}: UseUnitValidationProps): UnitValidationResult {
  const { formulas } = useFormulaMasterStore()
  const { formulas: unitConverterFormulas } = useUnitConverterFormulaStore()

  return useMemo(() => {
    return validateAxisUnits(axisNo, paramIndexes, chartParams, formulas, unitConverterFormulas)
  }, [axisNo, paramIndexes, chartParams, formulas, unitConverterFormulas])
}