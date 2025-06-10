"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo } from "@/types"
import { 
  renderEmptyChart, 
  renderLineChart, 
  ReferenceLines,
  generateMockData
} from "./ChartPreview/index"

interface ChartPreviewGraphProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
}

export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart }: ChartPreviewGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 400, height: 300 })
  
  // Store scales in refs to avoid recreation during drag
  const scalesRef = useRef<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
    yScale: d3.ScaleLinear<number, number> | null
  }>({ xScale: null, yScale: null })

  // Create a memoized version of editingChart without referenceLines to prevent re-renders
  const chartConfigWithoutRefLines = React.useMemo(() => {
    const { referenceLines, ...rest } = editingChart
    return rest
  }, [editingChart.title, editingChart.xAxisType, editingChart.xParameter, 
      editingChart.xLabel, editingChart.xAxisRange, editingChart.yAxisParams, editingChart.yAxisLabels])

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ 
          width: Math.max(300, width), 
          height: Math.max(250, height - 20) // Subtract some padding
        })
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
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

    const data = generateMockData(editingChart, selectedDataSourceItems)
    
    if (data.length > 0) {
      // Always render as line/scatter chart
      renderLineChart({ g, data, width, height, editingChart, scalesRef })
    } else {
      // Render empty chart with axes
      renderEmptyChart({ g, width, height, chartType: "line", editingChart, scalesRef })
    }

  }, [chartConfigWithoutRefLines, selectedDataSourceItems, dimensions])

  return (
    <div ref={containerRef} className="w-full h-full relative">
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