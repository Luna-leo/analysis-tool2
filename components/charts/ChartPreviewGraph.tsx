"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo } from "@/types"
import { 
  renderEmptyChart, 
  renderLineChart, 
  renderScatterPlot,
  ReferenceLines,
  generateMockData
} from "./ChartPreview/index"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { hideAllTooltips, hideTooltip } from "@/utils/chartTooltip"

interface ChartPreviewGraphProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
  maxDataPoints?: number
}

export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, maxDataPoints = 1000 }: ChartPreviewGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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

  // Handle resize with debounce
  useEffect(() => {
    if (!containerRef.current) return

    let timeoutId: NodeJS.Timeout
    const resizeObserver = new ResizeObserver(entries => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          setDimensions({ 
            width: Math.max(300, width), 
            height: Math.max(250, height - 20) // Subtract some padding
          })
        }
      }, 100)
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!svgRef.current) return

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
      // Render scatter plot
      renderScatterPlot({ g, data: chartData, width, height, editingChart, scalesRef })
    } else {
      // Render empty chart with axes
      renderEmptyChart({ g, width, height, chartType: "scatter", editingChart, scalesRef })
    }
    
    // Ensure proper layering: reference lines should not block interaction
    const refLinesLayer = svg.select(".reference-lines-layer")
    if (!refLinesLayer.empty()) {
      refLinesLayer.style("pointer-events", "none")
    }

  }, [chartConfigWithoutRefLines, chartData, dimensions])

  // Clean up tooltips on unmount
  useEffect(() => {
    return () => {
      hideAllTooltips()
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative"
    >
      {isLoadingData && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="text-sm text-muted-foreground">Loading data...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="text-sm text-destructive">Error loading data</div>
        </div>
      )}
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
      <ReferenceLines
        svgRef={svgRef}
        editingChart={editingChart}
        setEditingChart={setEditingChart}
        scalesRef={scalesRef}
        dimensions={dimensions}
      />
    </div>
  )
})