"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo } from "@/types"
import { useCSVDataStore } from "@/stores/useCSVDataStore"
import { 
  renderEmptyChart, 
  renderLineChart, 
  renderScatterPlot,
  ReferenceLines,
  generateMockData
} from "./ChartPreview/index"
import { convertToXValue } from "@/utils/chartAxisUtils"
import { isValidYValue } from "@/types/chart-axis"

interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  series: string;
  seriesIndex: number;
  timestamp: string;
  dataSourceId: string;
  dataSourceLabel: string;
}

interface ChartPreviewGraphProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
}

export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart }: ChartPreviewGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = React.useState({ width: 400, height: 300 })
  const { getParameterData } = useCSVDataStore()
  
  // Store scales in refs to avoid recreation during drag
  const scalesRef = useRef<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
    yScale: d3.ScaleLinear<number, number> | null
  }>({ xScale: null, yScale: null })
  
  // Memoize all parameters needed for the chart
  const allParameters = React.useMemo(() => {
    if (!editingChart.yAxisParams?.length) return []
    
    const params: string[] = []
    // For datetime type, we don't need to fetch x parameter as we'll use timestamp
    if (editingChart.xAxisType !== 'datetime' && editingChart.xParameter) {
      // Clean parameter name by removing unit part
      const cleanXParam = editingChart.xParameter.includes('|') 
        ? editingChart.xParameter.split('|')[0] 
        : editingChart.xParameter
      params.push(cleanXParam)
    }
    
    editingChart.yAxisParams.forEach(yParam => {
      if (yParam.parameter) {
        // Clean parameter name by removing unit part
        const cleanParam = yParam.parameter.includes('|') 
          ? yParam.parameter.split('|')[0] 
          : yParam.parameter
        if (!params.includes(cleanParam)) {
          params.push(cleanParam)
        }
      }
    })
    return params
  }, [editingChart.xAxisType, editingChart.xParameter, editingChart.yAxisParams])

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
  
  // Use state for async data loading
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [isLoadingData, setIsLoadingData] = React.useState(false)
  
  // Load data when parameters change
  React.useEffect(() => {
    const loadData = async () => {
      if (selectedDataSourceItems.length === 0 || (editingChart.xAxisType !== 'datetime' && allParameters.length === 0)) {
        setChartData([])
        return
      }
      
      setIsLoadingData(true)
      const data: ChartDataPoint[] = []
      
      try {
        // Collect data from all selected data sources
        for (const dataSource of selectedDataSourceItems) {
          const csvData = await getParameterData(dataSource.id, allParameters)
          
          // Debug logging
          if (!csvData || csvData.length === 0) {
            console.warn('No CSV data found for:', {
              dataSourceId: dataSource.id,
              requestedParameters: allParameters,
              dataSource: dataSource
            })
          }
          
          if (csvData && csvData.length > 0) {
            csvData.forEach(point => {
              // Create data point for scatter plot
              // Clean x parameter name for data lookup
              const cleanXParam = editingChart.xParameter?.includes('|') 
                ? editingChart.xParameter.split('|')[0] 
                : editingChart.xParameter
              
              const rawXValue = cleanXParam ? point[cleanXParam] : undefined
              const xValue = convertToXValue(
                rawXValue, 
                editingChart.xAxisType || 'datetime',
                point.timestamp
              )
              
              
              editingChart.yAxisParams?.forEach((yParam, index) => {
                // Clean parameter name for data lookup
                const cleanParam = yParam.parameter.includes('|') 
                  ? yParam.parameter.split('|')[0] 
                  : yParam.parameter
                
                let yValue = point[cleanParam]
                
                // Ensure y value is numeric
                if (typeof yValue === 'string' && !isNaN(Number(yValue))) {
                  yValue = Number(yValue)
                }
                
                if (xValue !== undefined && isValidYValue(yValue)) {
                  data.push({
                    x: xValue,
                    y: Number(yValue),
                    series: yParam.parameter, // Keep original for display
                    seriesIndex: index,
                    timestamp: point.timestamp,
                    dataSourceId: dataSource.id,
                    dataSourceLabel: dataSource.label
                  })
                }
              })
            })
          }
        }
      } catch (error) {
        console.error('Error fetching CSV data for chart:', error)
      } finally {
        setIsLoadingData(false)
      }
      
      setChartData(data)
    }
    
    loadData()
  }, [selectedDataSourceItems, allParameters, editingChart.xParameter, editingChart.yAxisParams, getParameterData, editingChart.xAxisType])

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
    
    // Ensure reference lines layer is always on top
    svg.select(".reference-lines-layer").raise()

  }, [chartConfigWithoutRefLines, chartData, dimensions])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {isLoadingData && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="text-sm text-muted-foreground">Loading data...</div>
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