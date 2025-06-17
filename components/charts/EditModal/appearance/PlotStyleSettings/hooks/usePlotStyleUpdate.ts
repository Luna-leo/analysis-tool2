import { useCallback } from "react"
import { ChartComponent } from "@/types"
import { MarkerSettings, LineSettings, LegendMode, PlotStyle } from "@/types/plot-style"
import { getDefaultColor } from "@/utils/chartColors"

export const usePlotStyleUpdate = (
  editingChart: ChartComponent,
  setEditingChart: (chart: ChartComponent) => void
) => {
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
    const mode = editingChart.plotStyles?.mode || editingChart.legendMode || 'datasource'
    const plotStyles = { ...editingChart.plotStyles } || { mode, byDataSource: {}, byParameter: {}, byBoth: {} }

    if (mode === 'datasource') {
      plotStyles.byDataSource = plotStyles.byDataSource || {}
      plotStyles.byDataSource[dataSourceId] = {
        ...plotStyles.byDataSource[dataSourceId],
        marker
      }
    } else if (mode === 'parameter') {
      plotStyles.byParameter = plotStyles.byParameter || {}
      plotStyles.byParameter[paramIndex] = {
        ...plotStyles.byParameter[paramIndex],
        marker
      }
    } else {
      const key = `${dataSourceId}-${paramIndex}`
      plotStyles.byBoth = plotStyles.byBoth || {}
      plotStyles.byBoth[key] = {
        ...plotStyles.byBoth[key],
        marker
      }
    }

    setEditingChart({ ...editingChart, plotStyles })
  }, [editingChart, setEditingChart])

  // Update line style
  const updateLineStyle = useCallback((
    dataSourceId: string,
    dataSourceIndex: number,
    paramIndex: number,
    line: LineSettings
  ) => {
    const mode = editingChart.plotStyles?.mode || editingChart.legendMode || 'datasource'
    const plotStyles = { ...editingChart.plotStyles } || { mode, byDataSource: {}, byParameter: {}, byBoth: {} }

    if (mode === 'datasource') {
      plotStyles.byDataSource = plotStyles.byDataSource || {}
      plotStyles.byDataSource[dataSourceId] = {
        ...plotStyles.byDataSource[dataSourceId],
        line
      }
    } else if (mode === 'parameter') {
      plotStyles.byParameter = plotStyles.byParameter || {}
      plotStyles.byParameter[paramIndex] = {
        ...plotStyles.byParameter[paramIndex],
        line
      }
    } else {
      const key = `${dataSourceId}-${paramIndex}`
      plotStyles.byBoth = plotStyles.byBoth || {}
      plotStyles.byBoth[key] = {
        ...plotStyles.byBoth[key],
        line
      }
    }

    setEditingChart({ ...editingChart, plotStyles })
  }, [editingChart, setEditingChart])

  // Update legend text
  const updateLegend = useCallback((
    dataSourceId: string,
    dataSourceIndex: number,
    paramIndex: number,
    legendText: string
  ) => {
    const mode = editingChart.plotStyles?.mode || editingChart.legendMode || 'datasource'
    const plotStyles = { ...editingChart.plotStyles } || { mode, byDataSource: {}, byParameter: {}, byBoth: {} }

    if (mode === 'datasource') {
      plotStyles.byDataSource = plotStyles.byDataSource || {}
      plotStyles.byDataSource[dataSourceId] = {
        ...plotStyles.byDataSource[dataSourceId],
        legendText
      }
    } else if (mode === 'parameter') {
      plotStyles.byParameter = plotStyles.byParameter || {}
      plotStyles.byParameter[paramIndex] = {
        ...plotStyles.byParameter[paramIndex],
        legendText
      }
    } else {
      const key = `${dataSourceId}-${paramIndex}`
      plotStyles.byBoth = plotStyles.byBoth || {}
      plotStyles.byBoth[key] = {
        ...plotStyles.byBoth[key],
        legendText
      }
    }

    setEditingChart({ ...editingChart, plotStyles })
  }, [editingChart, setEditingChart])

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
    const mode = editingChart.plotStyles?.mode || editingChart.legendMode || 'datasource'
    const plotStyles = { ...editingChart.plotStyles } || { mode, byDataSource: {}, byParameter: {}, byBoth: {} }

    if (mode === 'datasource') {
      plotStyles.byDataSource = plotStyles.byDataSource || {}
      plotStyles.byDataSource[dataSourceId] = {
        ...plotStyles.byDataSource[dataSourceId],
        visible
      }
    } else if (mode === 'parameter') {
      plotStyles.byParameter = plotStyles.byParameter || {}
      plotStyles.byParameter[paramIndex] = {
        ...plotStyles.byParameter[paramIndex],
        visible
      }
    } else {
      const key = `${dataSourceId}-${paramIndex}`
      plotStyles.byBoth = plotStyles.byBoth || {}
      plotStyles.byBoth[key] = {
        ...plotStyles.byBoth[key],
        visible
      }
    }

    setEditingChart({ ...editingChart, plotStyles })
  }, [editingChart, setEditingChart])

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