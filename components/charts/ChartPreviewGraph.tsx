"use client"

import React, { useEffect, useRef, useMemo, useLayoutEffect } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import {
  renderEmptyChart,
  renderScatterPlot,
  ReferenceLines
} from "./ChartPreview/index"
import { ChartLegend } from "./ChartLegend"
import { getRenderMethod } from "./ChartPreview/LODRenderer"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { hideAllTooltips } from "@/utils/chartTooltip"
import { useThrottle } from "@/hooks/useDebounce"
import { useSettingsStore } from "@/stores/useSettingsStore"

interface ChartPreviewGraphProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
  maxDataPoints?: number
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
  chartSettings?: {
    showXAxis: boolean
    showYAxis: boolean
    showGrid: boolean
    showLegend?: boolean
    showChartTitle?: boolean
    margins?: {
      top: number
      right: number
      bottom: number
      left: number
    }
    xLabelOffset?: number
    yLabelOffset?: number
    marginMode?: 'auto' | 'manual'
    autoMarginScale?: number
    marginOverrides?: Record<string, any>
  }
}


export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, maxDataPoints, dataSourceStyles, chartSettings }: ChartPreviewGraphProps) => {
  const { settings } = useSettingsStore()
  const defaultMaxDataPoints = settings.performanceSettings.dataProcessing.enableSampling 
    ? settings.performanceSettings.dataProcessing.defaultSamplingPoints
    : Number.MAX_SAFE_INTEGER
  const effectiveMaxDataPoints = maxDataPoints ?? defaultMaxDataPoints
  
  // Merge global chart settings with individual chart settings
  const mergedChart = useMemo(() => {
    if (!chartSettings) return editingChart
    
    return {
      ...editingChart,
      showLegend: chartSettings.showLegend !== undefined ? chartSettings.showLegend : editingChart.showLegend,
      showTitle: chartSettings.showChartTitle !== undefined ? chartSettings.showChartTitle : editingChart.showTitle,
      showXLabel: chartSettings.showXAxis !== undefined ? chartSettings.showXAxis : editingChart.showXLabel,
      showYLabel: chartSettings.showYAxis !== undefined ? chartSettings.showYAxis : editingChart.showYLabel,
      showGrid: chartSettings.showGrid !== undefined ? chartSettings.showGrid : editingChart.showGrid,
      margins: chartSettings.margins !== undefined ? chartSettings.margins : editingChart.margins,
      xLabelOffset: chartSettings.xLabelOffset !== undefined ? chartSettings.xLabelOffset : editingChart.xLabelOffset,
      yLabelOffset: chartSettings.yLabelOffset !== undefined ? chartSettings.yLabelOffset : editingChart.yLabelOffset
    }
  }, [editingChart, chartSettings])

  // Apply zoomed domains to chart config without mutating original
  const chartForRender = useMemo(() => {
    if (!zoomDomains.xDomain && !zoomDomains.yDomain) return mergedChart

    const xRange = zoomDomains.xDomain
      ? {
          auto: false,
          min:
            mergedChart.xAxisType === 'datetime'
              ? (zoomDomains.xDomain[0] as Date).toISOString()
              : zoomDomains.xDomain[0],
          max:
            mergedChart.xAxisType === 'datetime'
              ? (zoomDomains.xDomain[1] as Date).toISOString()
              : zoomDomains.xDomain[1],
          unit: mergedChart.xAxisRange?.unit
        }
      : mergedChart.xAxisRange

    const yParams = mergedChart.yAxisParams?.map(param => {
      if (!zoomDomains.yDomain) return param
      return {
        ...param,
        range: { auto: false, min: zoomDomains.yDomain[0], max: zoomDomains.yDomain[1] }
      }
    })

    return { ...mergedChart, xAxisRange: xRange, yAxisParams: yParams }
  }, [mergedChart, zoomDomains])
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderingRef = useRef<boolean>(false)
  const animationFrameRef = useRef<number | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [dimensions, setDimensions] = React.useState({ width: 400, height: 300 })
  const legendRef = useRef<HTMLDivElement>(null)
  const [legendPos, setLegendPos] = React.useState<{ x: number; y: number } | null>(null)
  const legendRatioRef = useRef<{ xRatio: number; yRatio: number } | null>(
    mergedChart.legendPosition ?? null
  )

  // Zoom state storing current domains
  const [zoomDomains, setZoomDomains] = React.useState<{
    xDomain: [any, any] | null
    yDomain: [number, number] | null
  }>({ xDomain: null, yDomain: null })

  useEffect(() => {
    legendRatioRef.current = mergedChart.legendPosition ?? null
  }, [mergedChart.legendPosition])
  
  // Store scales in refs to avoid recreation during drag
  const scalesRef = useRef<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
    yScale: d3.ScaleLinear<number, number> | null
  }>({ xScale: null, yScale: null })

  // Initialize legend position once container and legend are mounted
  useLayoutEffect(() => {
    if (!containerRef.current || !legendRef.current) return
    if (legendPos !== null) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const legendRect = legendRef.current.getBoundingClientRect()

    if (mergedChart.legendPosition) {
      const { xRatio, yRatio } = mergedChart.legendPosition
      const ratioX = Number.isFinite(xRatio) ? xRatio : 0
      const ratioY = Number.isFinite(yRatio) ? yRatio : 0
      const pos = {
        x: Math.min(
          Math.max(0, ratioX * containerRect.width),
          containerRect.width - legendRect.width
        ),
        y: Math.min(
          Math.max(0, ratioY * containerRect.height),
          containerRect.height - legendRect.height
        )
      }
      setLegendPos(pos)
    } else {
      const defaultPos = { x: containerRect.width - legendRect.width - 4, y: 4 }
      const defaultRatio = {
        xRatio: containerRect.width
          ? defaultPos.x / containerRect.width
          : 0,
        yRatio: containerRect.height
          ? defaultPos.y / containerRect.height
          : 0
      }
      legendRatioRef.current = defaultRatio
      setLegendPos(defaultPos)
      setEditingChart?.({ ...mergedChart, legendPosition: defaultRatio })
    }
  }, [legendPos, dimensions, mergedChart.legendPosition, mergedChart.showLegend])

  // Sync legend position if editingChart changes elsewhere
  useEffect(() => {
    if (!containerRef.current || !legendRef.current || !mergedChart.legendPosition) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const legendRect = legendRef.current.getBoundingClientRect()
    const { xRatio, yRatio } = mergedChart.legendPosition
    const ratioX = Number.isFinite(xRatio) ? xRatio : 0
    const ratioY = Number.isFinite(yRatio) ? yRatio : 0
    const newPos = {
      x: Math.min(
        Math.max(0, ratioX * containerRect.width),
        containerRect.width - legendRect.width
      ),
      y: Math.min(
        Math.max(0, ratioY * containerRect.height),
        containerRect.height - legendRect.height
      )
    }
    if (legendPos?.x !== newPos.x || legendPos?.y !== newPos.y) {
      setLegendPos(newPos)
    }
  }, [mergedChart.legendPosition, dimensions])
  
  // Use optimized data loading hook
  const { data: chartData, isLoading: isLoadingData, error } = useOptimizedChart({
    editingChart: mergedChart,
    selectedDataSourceItems,
    maxDataPoints: effectiveMaxDataPoints
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

  // Keep legend within bounds when container resizes or ratio changes
  useEffect(() => {
    if (!containerRef.current || !legendRef.current || !legendRatioRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const legendRect = legendRef.current.getBoundingClientRect()
    const { xRatio, yRatio } = legendRatioRef.current
    const ratioX = Number.isFinite(xRatio) ? xRatio : 0
    const ratioY = Number.isFinite(yRatio) ? yRatio : 0
    const newPos = {
      x: Math.min(
        Math.max(0, ratioX * containerRect.width),
        containerRect.width - legendRect.width
      ),
      y: Math.min(
        Math.max(0, ratioY * containerRect.height),
        containerRect.height - legendRect.height
      )
    }
    setLegendPos(newPos)
  }, [dimensions, mergedChart.legendPosition])

  const handleLegendPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!legendRef.current || !containerRef.current) return
    e.preventDefault()
    const containerRect = containerRef.current.getBoundingClientRect()
    const legendRect = legendRef.current.getBoundingClientRect()
    const offsetX = e.clientX - legendRect.left
    const offsetY = e.clientY - legendRect.top

    const handleMove = (ev: PointerEvent) => {
      const x = ev.clientX - containerRect.left - offsetX
      const y = ev.clientY - containerRect.top - offsetY
      const newPos = {
        x: Math.min(Math.max(0, x), containerRect.width - legendRect.width),
        y: Math.min(Math.max(0, y), containerRect.height - legendRect.height)
      }
      const newRatio = {
        xRatio: containerRect.width ? newPos.x / containerRect.width : 0,
        yRatio: containerRect.height ? newPos.y / containerRect.height : 0
      }
      legendRatioRef.current = newRatio
      setLegendPos(newPos)
      setEditingChart?.({ ...mergedChart, legendPosition: newRatio })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      if (legendRatioRef.current) {
        setEditingChart?.({ ...mergedChart, legendPosition: legendRatioRef.current })
      }
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  // Handle resize with throttle
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [handleResize])

  // Initialize d3 zoom behavior
  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)

    const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      if (!scalesRef.current.xScale || !scalesRef.current.yScale) return
      const zx = event.transform.rescaleX(scalesRef.current.xScale as any)
      const zy = event.transform.rescaleY(scalesRef.current.yScale as any)
      setZoomDomains({ xDomain: zx.domain() as [any, any], yDomain: zy.domain() as [number, number] })
    }

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .extent([[0, 0], [dimensions.width, dimensions.height]])
      .translateExtent([[0, 0], [dimensions.width, dimensions.height]])
      .on('zoom', zoomed)

    svg.call(zoom as any)

    return () => {
      svg.on('.zoom', null)
    }
  }, [dimensions])

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

          const margin = chartForRender.margins || { top: 20, right: 40, bottom: 60, left: 60 }
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
              canvasRef.current.style.zIndex = '0'
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
            renderScatterPlot({
              g,
              data: chartData,
              width,
              height,
              editingChart: chartForRender,
              scalesRef,
              dataSourceStyles,
              canvas: canvasRef.current ?? undefined,
              plotStyles: chartForRender.plotStyles,
              enableSampling: settings.performanceSettings.dataProcessing.enableSampling
            })
          } else {
            // Render empty chart with axes
            renderEmptyChart({ g, width, height, chartType: chartForRender.type || 'scatter', editingChart: chartForRender, scalesRef })
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
  }, [chartData, dimensions, isLoadingData, chartForRender, dataSourceStyles])

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
  
  // Force re-render when chart settings change (including margins)
  useEffect(() => {
    if (chartSettings) {
      renderChart()
    }
  }, [JSON.stringify(chartSettings?.margins), renderChart])

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
      {!isLoadingData && mergedChart.showLegend !== false && selectedDataSourceItems.length > 0 && (
        <ChartLegend
          ref={legendRef}
          onPointerDown={handleLegendPointerDown}
          style={legendPos ? { top: legendPos.y, left: legendPos.x } : undefined}
          className="absolute cursor-move z-20"
          editingChart={mergedChart}
          dataSources={selectedDataSourceItems}
          dataSourceStyles={dataSourceStyles}
        />
      )}
      {!isLoadingData && (
        <ReferenceLines
          svgRef={svgRef}
          editingChart={mergedChart}
          setEditingChart={setEditingChart}
          scalesRef={scalesRef}
          dimensions={dimensions}
        />
      )}
    </div>
  )
})