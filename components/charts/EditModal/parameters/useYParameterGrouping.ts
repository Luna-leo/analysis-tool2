import { ChartComponent } from "@/types"

interface UseYParameterGroupingProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  setLastAddedParamIndex: (index: number | null) => void
  setLastAddedAxisNo: (axisNo: number | null) => void
}

export function useYParameterGrouping({
  editingChart,
  setEditingChart,
  setLastAddedParamIndex,
  setLastAddedAxisNo
}: UseYParameterGroupingProps) {
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
        // Determine the auto value - if explicitly provided use it, otherwise keep current
        const autoValue = rangeUpdate.auto !== undefined ? rangeUpdate.auto : (param.range?.auto ?? true)
        
        newParams[index] = {
          ...param,
          range: {
            auto: autoValue,
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

  // Remove axis group and all its parameters
  const removeAxisGroup = (axisNo: number) => {
    const newParams = (editingChart.yAxisParams || []).filter(param => param.axisNo !== axisNo)
    setEditingChart({
      ...editingChart,
      yAxisParams: newParams,
    })
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

  return {
    groupParametersByAxis,
    updateAxisLabel,
    updateAxisRange,
    getNextAxisNumber,
    addNewAxisGroup,
    removeAxisGroup,
    addParameterToAxis
  }
}