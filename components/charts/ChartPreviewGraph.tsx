"use client"

import React, { useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import {
  renderEmptyChart,
  renderScatterPlot,
  ReferenceLines
} from "./ChartPreview/index"
import { getRenderMethod } from "./ChartPreview/LODRenderer"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { hideAllTooltips } from "@/utils/chartTooltip"
import { useThrottle } from "@/hooks/useDebounce"

interface ChartPreviewGraphProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
  maxDataPoints?: number
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
}


export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, maxDataPoints = 500, dataSourceStyles }: ChartPreviewGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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

          const renderMethod = getRenderMethod(chartData.length, { width, height })

          if (renderMethod === 'canvas' && containerRef.current) {
            if (!canvasRef.current) {
              canvasRef.current = document.createElement('canvas')
              canvasRef.current.style.position = 'absolute'
              canvasRef.current.style.pointerEvents = 'none'
              containerRef.current.appendChild(canvasRef.current)
            }
            canvasRef.current.style.left = `${margin.left}px`
            canvasRef.current.style.top = `${margin.top}px`
            canvasRef.current.width = width
            canvasRef.current.height = height
          } else if (canvasRef.current && containerRef.current) {
            containerRef.current.removeChild(canvasRef.current)
            canvasRef.current = null
          }

          if (chartData.length > 0) {
            // Render chart (ScatterPlot now handles both scatter and line types)
            renderScatterPlot({ g, data: chartData, width, height, editingChart, scalesRef, dataSourceStyles, canvas: canvasRef.current ?? undefined })
          } else {
            // Render empty chart with axes
            renderEmptyChart({ g, width, height, chartType: editingChart.type || 'scatter', editingChart, scalesRef })
          }
          
          // Ensure reference lines layer is above main chart
          const refLinesLayer = svg.select(".reference-lines-layer")
          if (!refLinesLayer.empty()) {
            refLinesLayer.raise()
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
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current)
      }
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