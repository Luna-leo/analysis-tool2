import { useCallback } from "react"
import { ChartComponent } from "@/types"
import { MarkerSettings, LineSettings, LegendMode } from "@/types/plot-style"

export const usePlotStyleUpdate = (
  editingChart: ChartComponent,
  setEditingChart: (chart: ChartComponent) => void
) => {
  const updateMarkerStyle = useCallback((paramIndex: number, marker: MarkerSettings) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    newParams[paramIndex] = {
      ...newParams[paramIndex],
      marker
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }, [editingChart, setEditingChart])

  const updateLineStyle = useCallback((paramIndex: number, line: LineSettings) => {
    const newParams = [...(editingChart.yAxisParams || [])]
    newParams[paramIndex] = {
      ...newParams[paramIndex],
      line
    }
    setEditingChart({ ...editingChart, yAxisParams: newParams })
  }, [editingChart, setEditingChart])

  const updateLegend = useCallback((mode: LegendMode, rowId: string, legendText: string, paramIndex?: number) => {
    if (mode === 'datasource') {
      // Update dataSourceLegends
      setEditingChart({
        ...editingChart,
        dataSourceLegends: {
          ...editingChart.dataSourceLegends,
          [rowId]: legendText
        }
      })
    } else {
      // Update parameter legendText
      if (paramIndex !== undefined) {
        const newParams = [...(editingChart.yAxisParams || [])]
        newParams[paramIndex] = {
          ...newParams[paramIndex],
          legendText
        }
        setEditingChart({ ...editingChart, yAxisParams: newParams })
      }
    }
  }, [editingChart, setEditingChart])

  const updateMode = useCallback((mode: LegendMode) => {
    setEditingChart({ ...editingChart, legendMode: mode })
  }, [editingChart, setEditingChart])

  return {
    updateMarkerStyle,
    updateLineStyle,
    updateLegend,
    updateMode
  }
}