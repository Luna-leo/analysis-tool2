import { useMemo } from "react"
import { ChartComponent } from "@/types"
import { PlotStyleRow, LegendMode } from "@/types/plot-style"

interface DataSourceItem {
  id: string
  plant: string
  machineNo: string
  label: string
  labelDescription?: string
}

export const usePlotStyleRows = (
  editingChart: ChartComponent,
  selectedDataSourceItems: DataSourceItem[],
  mode: LegendMode,
  getPlotStyle: (dataSourceId: string, dataSourceIndex: number, paramIndex: number) => any
): PlotStyleRow[] => {
  return useMemo(() => {
    const rows: PlotStyleRow[] = []

    if (selectedDataSourceItems.length === 0 || !editingChart.yAxisParams || editingChart.yAxisParams.length === 0) {
      return rows
    }

    if (mode === 'datasource') {
      // By Data Source mode - one row per data source
      selectedDataSourceItems.forEach((dataSource, dataSourceIndex) => {
        const plotStyle = getPlotStyle(dataSource.id, dataSourceIndex, 0)
        const defaultLegend = dataSource.labelDescription 
          ? `${dataSource.label} (${dataSource.labelDescription})` 
          : dataSource.label

        rows.push({
          id: dataSource.id,
          dataSource,
          parameter: editingChart.yAxisParams?.[0], // Use first parameter for reference
          paramIndex: 0,
          dataSourceIndex,
          legendText: plotStyle.legendText || defaultLegend,
          colorIndex: dataSourceIndex
        })
      })
    } else if (mode === 'parameter') {
      // By Parameter mode - one row per parameter
      editingChart.yAxisParams.forEach((param, paramIndex) => {
        const plotStyle = getPlotStyle('', 0, paramIndex)
        
        rows.push({
          id: `param-${paramIndex}`,
          parameter: param,
          paramIndex,
          legendText: plotStyle.legendText || param.parameter || "Unnamed",
          colorIndex: paramIndex
        })
      })
    } else {
      // By Data Source x Parameter mode - one row per combination
      selectedDataSourceItems.forEach((dataSource, dataSourceIndex) => {
        editingChart.yAxisParams?.forEach((param, paramIndex) => {
          const plotStyle = getPlotStyle(dataSource.id, dataSourceIndex, paramIndex)
          const defaultLegend = `${dataSource.label}-${param.parameter || "Unnamed"}`
          
          rows.push({
            id: `${dataSource.id}-${paramIndex}`,
            dataSource,
            parameter: param,
            paramIndex,
            dataSourceIndex,
            legendText: plotStyle.legendText || defaultLegend,
            colorIndex: dataSourceIndex
          })
        })
      })
    }

    return rows
  }, [editingChart, selectedDataSourceItems, mode, getPlotStyle])
}