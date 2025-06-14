"use client"

import React, { useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import { 
  renderEmptyChart, 
  renderLineChart, 
  renderScatterPlot,
  ReferenceLines,
  generateMockData
} from "./ChartPreview/index"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { hideAllTooltips, hideTooltip } from "@/utils/chartTooltip"
import { useThrottle } from "@/hooks/useDebounce"

interface ChartPreviewGraphProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
  maxDataPoints?: number
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
}

// Transform scatter plot data to line chart format
const transformToLineChartData = (scatterData: any[], xParameter: string = 'timestamp') => {
  // Group data by x value
  const dataByX = new Map<string, any>()
  
  scatterData.forEach(point => {
    const xKey = String(point.x)
    if (!dataByX.has(xKey)) {
      const xValue = point.x instanceof Date ? point.x : new Date(point.x)
      dataByX.set(xKey, {
        [xParameter]: xValue,
        // Always include timestamp field for datetime axis
        timestamp: xValue
      })
    }
    
    // Extract parameter name from series (format: "DataSource - Parameter")
    const paramName = point.series.split(' - ').pop()
    if (paramName) {
      dataByX.get(xKey)[paramName] = point.y
    }
  })
  
  // Convert to array and sort by x value
  return Array.from(dataByX.values()).sort((a, b) => {
    const aVal = a[xParameter]
    const bVal = b[xParameter]
    if (aVal instanceof Date && bVal instanceof Date) {
      return aVal.getTime() - bVal.getTime()
    }
    return Number(aVal) - Number(bVal)
  })
}

export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, maxDataPoints = 500, dataSourceStyles }: ChartPreviewGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderingRef = useRef<boolean>(false)
  const animationFrameRef = useRef<number | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [dimensions, setDimensions] = React.useState({ width: 400, height: 300 })
  
  // Store scales in refs to avoid recreation during drag
  const scalesRef = useRef<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
    yScale: d3.ScaleLinear<number, number> | null
  }>({ xScale: null, yScale: null })
  
  // Use optimized data loading hook
  const { data: chartData, isLoading: isLoadingData, error } = useOptimizedChart({
    editingChart,
    selectedDataSourceItems,
    maxDataPoints
  })

  // Create a memoized version of editingChart without referenceLines to prevent re-renders
  const chartConfigWithoutRefLines = React.useMemo(() => {
    const { referenceLines, ...rest } = editingChart
    return rest
  }, [editingChart.title, editingChart.xAxisType, editingChart.xParameter, 
      editingChart.xLabel, editingChart.xAxisRange, editingChart.yAxisParams, editingChart.yAxisLabels])

  // Throttled resize handler for better performance
  const handleResize = useThrottle((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      setDimensions({ 
        width: Math.max(300, width), 
        height: Math.max(250, height - 20) // Subtract some padding
      })
    }
  }, 150)

  // Handle resize with throttle
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [handleResize])

  // Use requestAnimationFrame for smooth rendering
  const renderChart = useMemo(() => {
    return () => {
      if (!svgRef.current || renderingRef.current) return
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      
      // Clean up any previous rendering
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      
      // Skip rendering if loading
      if (isLoadingData) return
      
      renderingRef.current = true
      
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!svgRef.current) {
          renderingRef.current = false
          return
        }

        try {
          const svg = d3.select(svgRef.current)
          
          // Only clear the main chart group, preserve reference lines layer
          let mainGroup = svg.select<SVGGElement>(".main-chart-group")
          if (!mainGroup.empty()) {
            mainGroup.remove()
          }

          const margin = { top: 20, right: 40, bottom: 60, left: 60 }
          const width = dimensions.width - margin.left - margin.right
          const height = dimensions.height - margin.top - margin.bottom

          const g = svg.append("g")
            .attr("class", "main-chart-group")
            .attr("transform", `translate(${margin.left},${margin.top})`)
          
          if (chartData.length > 0) {
            // Render chart based on type
            if (editingChart.type === "line") {
              // Transform scatter data to line chart format
              // Use timestamp as default for datetime axis type
              const xParameter = editingChart.xParameter || 
                ((editingChart.xAxisType || 'datetime') === 'datetime' ? 'timestamp' : 'timestamp')
              const lineChartData = transformToLineChartData(chartData, xParameter)
              renderLineChart({ g, data: lineChartData, width, height, editingChart, scalesRef })
            } else {
              // Default to scatter plot
              renderScatterPlot({ g, data: chartData, width, height, editingChart, scalesRef, dataSourceStyles })
            }
          } else {
            // Render empty chart with axes
            renderEmptyChart({ g, width, height, chartType: editingChart.type || "scatter", editingChart, scalesRef })
          }
          
          // Ensure proper layering: reference lines should not block interaction
          const refLinesLayer = svg.select(".reference-lines-layer")
          if (!refLinesLayer.empty()) {
            refLinesLayer.style("pointer-events", "none")
          }
          
          // Store cleanup function
          cleanupRef.current = () => {
            hideAllTooltips()
          }
        } catch (error) {
          console.error('Error rendering chart:', error)
        } finally {
          renderingRef.current = false
          animationFrameRef.current = null
        }
      })
    }
  }, [chartData, dimensions, isLoadingData, editingChart, dataSourceStyles])

  useEffect(() => {
    renderChart()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      renderingRef.current = false
    }
  }, [renderChart])

  // Clean up tooltips on unmount
  useEffect(() => {
    return () => {
      hideAllTooltips()
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden"
    >
      {isLoadingData && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-sm text-muted-foreground">Loading data...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-sm text-destructive">Error loading data</div>
        </div>
      )}
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" style={{ visibility: isLoadingData ? 'hidden' : 'visible' }} />
      {!isLoadingData && (
        <ReferenceLines
          svgRef={svgRef}
          editingChart={editingChart}
          setEditingChart={setEditingChart}
          scalesRef={scalesRef}
          dimensions={dimensions}
        />
      )}
    </div>
  )
})