import { useCallback } from "react"
import { ChartComponent } from "@/types"
import { MarkerSettings, LineSettings, LegendMode, PlotStyle } from "@/types/plot-style"
import { getDefaultColor } from "@/utils/chartColors"

export const usePlotStyleUpdate = (
  editingChart: ChartComponent,
  setEditingChart: (chart: ChartComponent) => void
) => {
  // Helper function to get the style key based on mode
  const getStyleKey = useCallback((
    mode: LegendMode,
    dataSourceId: string,
    paramIndex: number
  ): string => {
    if (mode === 'datasource') return dataSourceId
    if (mode === 'parameter') return paramIndex.toString()
    return `${dataSourceId}-${paramIndex}`
  }, [])

  // Helper function to update plot style property
  const updatePlotStyleProperty = useCallback((
    dataSourceId: string,
    dataSourceIndex: number,
    paramIndex: number,
    property: Partial<PlotStyle>
  ) => {
    const mode = editingChart.plotStyles?.mode || editingChart.legendMode || 'datasource'
    const plotStyles = editingChart.plotStyles ? { ...editingChart.plotStyles } : { mode, byDataSource: {}, byParameter: {}, byBoth: {} }
    const key = getStyleKey(mode, dataSourceId, paramIndex)

    if (mode === 'datasource') {
      plotStyles.byDataSource = plotStyles.byDataSource || {}
      plotStyles.byDataSource[key] = {
        ...plotStyles.byDataSource[key],
        ...property
      }
    } else if (mode === 'parameter') {
      plotStyles.byParameter = plotStyles.byParameter || {}
      plotStyles.byParameter[key] = {
        ...plotStyles.byParameter[key],
        ...property
      }
    } else {
      plotStyles.byBoth = plotStyles.byBoth || {}
      plotStyles.byBoth[key] = {
        ...plotStyles.byBoth[key],
        ...property
      }
    }

    setEditingChart({ ...editingChart, plotStyles: { ...plotStyles, mode } })
  }, [editingChart, setEditingChart, getStyleKey])
  // Initialize plotStyles if not exists
  const initializePlotStyles = useCallback(() => {
    if (!editingChart.plotStyles) {
      setEditingChart({
        ...editingChart,
        plotStyles: {
          mode: editingChart.legendMode || 'datasource',
          byDataSource: {},
          byParameter: {},
          byBoth: {}
        }
      })
    }
  }, [editingChart, setEditingChart])

  // Get current plot style based on mode
  const getPlotStyle = useCallback((
    dataSourceId: string,
    dataSourceIndex: number,
    paramIndex: number
  ): PlotStyle => {
    const mode = editingChart.plotStyles?.mode || editingChart.legendMode || 'datasource'
    
    // Default style
    const defaultStyle: PlotStyle = {
      marker: {
        type: 'circle',
        size: 6,
        borderColor: getDefaultColor(mode === 'parameter' ? paramIndex : dataSourceIndex),
        fillColor: getDefaultColor(mode === 'parameter' ? paramIndex : dataSourceIndex)
      },
      line: {
        style: 'solid',
        width: 2,
        color: getDefaultColor(mode === 'parameter' ? paramIndex : dataSourceIndex)
      },
      visible: true
    }

    if (mode === 'datasource') {
      return editingChart.plotStyles?.byDataSource?.[dataSourceId] || defaultStyle
    } else if (mode === 'parameter') {
      return editingChart.plotStyles?.byParameter?.[paramIndex] || defaultStyle
    } else {
      const key = `${dataSourceId}-${paramIndex}`
      return editingChart.plotStyles?.byBoth?.[key] || defaultStyle
    }
  }, [editingChart])

  // Update marker style
  const updateMarkerStyle = useCallback((
    dataSourceId: string,
    dataSourceIndex: number,
    paramIndex: number,
    marker: MarkerSettings
  ) => {
    updatePlotStyleProperty(dataSourceId, dataSourceIndex, paramIndex, { marker })
  }, [updatePlotStyleProperty])

  // Update line style
  const updateLineStyle = useCallback((
    dataSourceId: string,
    dataSourceIndex: number,
    paramIndex: number,
    line: LineSettings
  ) => {
    updatePlotStyleProperty(dataSourceId, dataSourceIndex, paramIndex, { line })
  }, [updatePlotStyleProperty])

  // Update legend text
  const updateLegend = useCallback((
    dataSourceId: string,
    dataSourceIndex: number,
    paramIndex: number,
    legendText: string
  ) => {
    updatePlotStyleProperty(dataSourceId, dataSourceIndex, paramIndex, { legendText })
  }, [updatePlotStyleProperty])

  // Initialize default styles for a mode
  const initializeDefaultStylesForMode = useCallback((
    mode: LegendMode,
    dataSources: any[],
    parameters: any[]
  ) => {
    const styles: any = {
      mode,
      byDataSource: {},
      byParameter: {},
      byBoth: {}
    }

    if (mode === 'datasource') {
      // Create default style for each data source
      dataSources.forEach((ds, idx) => {
        const defaultColor = getDefaultColor(idx)
        styles.byDataSource[ds.id] = {
          marker: {
            type: 'circle',
            size: 6,
            borderColor: defaultColor,
            fillColor: defaultColor
          },
          line: {
            style: 'solid',
            width: 2,
            color: defaultColor
          },
          legendText: ds.labelDescription ? `${ds.label} (${ds.labelDescription})` : ds.label,
          visible: true
        }
      })
    } else if (mode === 'parameter') {
      // Create default style for each parameter
      parameters.forEach((param, idx) => {
        const defaultColor = getDefaultColor(idx)
        styles.byParameter[idx] = {
          marker: {
            type: 'circle',
            size: 6,
            borderColor: defaultColor,
            fillColor: defaultColor
          },
          line: {
            style: 'solid',
            width: 2,
            color: defaultColor
          },
          legendText: param.parameter || 'Unnamed',
          visible: true
        }
      })
    } else {
      // Create default style for each combination
      dataSources.forEach((ds, dsIdx) => {
        parameters.forEach((param, paramIdx) => {
          const key = `${ds.id}-${paramIdx}`
          const defaultColor = getDefaultColor(dsIdx)
          styles.byBoth[key] = {
            marker: {
              type: 'circle',
              size: 6,
              borderColor: defaultColor,
              fillColor: defaultColor
            },
            line: {
              style: 'solid',
              width: 2,
              color: defaultColor
            },
            legendText: `${ds.label}-${param.parameter || 'Unnamed'}`,
            visible: true
          }
        })
      })
    }

    return styles
  }, [])

  // Update mode
  const updateMode = useCallback((mode: LegendMode) => {
    setEditingChart({ 
      ...editingChart, 
      legendMode: mode,
      plotStyles: { ...editingChart.plotStyles, mode }
    })
  }, [editingChart, setEditingChart])

  // Update visibility
  const updateVisibility = useCallback((
    dataSourceId: string,
    dataSourceIndex: number,
    paramIndex: number,
    visible: boolean
  ) => {
    updatePlotStyleProperty(dataSourceId, dataSourceIndex, paramIndex, { visible })
  }, [updatePlotStyleProperty])

  return {
    initializePlotStyles,
    initializeDefaultStylesForMode,
    getPlotStyle,
    updateMarkerStyle,
    updateLineStyle,
    updateLegend,
    updateMode,
    updateVisibility
  }
}