"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo } from "@/types"
import { 
  renderEmptyChart, 
  renderLineChart, 
  renderBarChart, 
  renderPieChart, 
  ReferenceLines,
  generateMockData
} from "./ChartPreview/index"

interface ChartPreviewGraphProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
}

export function ChartPreviewGraph({ editingChart, selectedDataSourceItems, setEditingChart }: ChartPreviewGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  
  // Store scales in refs to avoid recreation during drag
  const scalesRef = useRef<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
    yScale: d3.ScaleLinear<number, number> | null
  }>({ xScale: null, yScale: null })

  // Create a memoized version of editingChart without referenceLines to prevent re-renders
  const chartConfigWithoutRefLines = React.useMemo(() => {
    const { referenceLines, ...rest } = editingChart
    return rest
  }, [editingChart.chartType, editingChart.title, editingChart.xAxisType, editingChart.xParameter, 
      editingChart.xLabel, editingChart.xAxisRange, editingChart.yAxisParams, editingChart.yAxisLabels])

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    
    // Only clear the main chart group, preserve reference lines layer
    let mainGroup = svg.select<SVGGElement>(".main-chart-group")
    if (!mainGroup.empty()) {
      mainGroup.remove()
    }

    const margin = { top: 20, right: 80, bottom: 40, left: 60 }
    const width = 400 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg.append("g")
      .attr("class", "main-chart-group")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const data = generateMockData(editingChart, selectedDataSourceItems)
    const chartType = editingChart.chartType || "line"
    
    if (data.length > 0) {
      // Render chart with data
      if (chartType === "line") {
        renderLineChart({ g, data, width, height, editingChart, scalesRef })
      } else if (chartType === "bar") {
        renderBarChart({ g, data, width, height, editingChart, scalesRef })
      } else if (chartType === "pie") {
        renderPieChart({ g, data, width, height, editingChart })
      }
    } else {
      // Render empty chart with axes
      renderEmptyChart({ g, width, height, chartType, editingChart, scalesRef })
    }

  }, [chartConfigWithoutRefLines, selectedDataSourceItems])

  return (
    <>
      <svg ref={svgRef} width={400} height={300} />
      <ReferenceLines
        svgRef={svgRef}
        editingChart={editingChart}
        setEditingChart={setEditingChart}
        scalesRef={scalesRef}
      />
    </>
  )
}