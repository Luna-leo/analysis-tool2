"use client"

import React, { useEffect, useRef, useMemo, useLayoutEffect, useCallback } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import {
  renderScatterPlot,
  ReferenceLines
} from "./ChartPreview/index"
import { ChartLegend } from "./ChartLegend"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { hideAllTooltips } from "@/utils/chartTooltip"
import { useThrottle } from "@/hooks/useDebounce"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { useChartZoom } from "./ChartPreview/useChartZoom"
import { ZoomControls } from "./ChartPreview/ZoomControls"
import { useQualityOptimization } from "./ChartPreview/useQualityOptimization"

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
  enableZoom?: boolean
  enablePan?: boolean
  zoomMode?: 'x' | 'xy' | 'auto'
}


export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, maxDataPoints, dataSourceStyles, chartSettings, enableZoom = true, enablePan = true, zoomMode = 'auto' }: ChartPreviewGraphProps) => {
  const [isShiftPressed, setIsShiftPressed] = React.useState(false)
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

  useEffect(() => {
    legendRatioRef.current = mergedChart.legendPosition ?? null
  }, [mergedChart.legendPosition])
  
  // Base scales (never modified)
  const baseScalesRef = useRef<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
    yScale: d3.ScaleLinear<number, number> | null
  }>({ xScale: null, yScale: null })

  // Current scales (with zoom applied)
  const currentScalesRef = useRef<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
    yScale: d3.ScaleLinear<number, number> | null
  }>({ xScale: null, yScale: null })

  // Force update when zoom changes
  const [zoomVersion, setZoomVersion] = React.useState(0)
  
  // Track if initial render is complete
  const isInitialRenderComplete = useRef(false)
  
  // Track pending zoom transform
  const pendingZoomTransform = useRef<d3.ZoomTransform | null>(null)
  

  // Handle zoom transformation
  const handleZoomTransform = useCallback((transform: d3.ZoomTransform) => {
    if (!baseScalesRef.current.xScale || !baseScalesRef.current.yScale) {
      pendingZoomTransform.current = transform;
      return;
    }

    // Determine zoom mode based on chart type
    const effectiveZoomMode = zoomMode === 'auto' 
      ? (mergedChart.type === 'scatter' ? 'xy' : 'x')
      : zoomMode

    // Update current scales with zoom transform
    const newXScale = transform.rescaleX(baseScalesRef.current.xScale)
    const newYScale = effectiveZoomMode === 'xy' 
      ? transform.rescaleY(baseScalesRef.current.yScale)
      : baseScalesRef.current.yScale

    // Only update if scales actually changed
    if (currentScalesRef.current.xScale !== newXScale || currentScalesRef.current.yScale !== newYScale) {
      currentScalesRef.current.xScale = newXScale
      currentScalesRef.current.yScale = newYScale
      
      // Clear pending transform
      pendingZoomTransform.current = null;

      // Force re-render
      setZoomVersion(v => v + 1)
    }
  }, [zoomMode, mergedChart.type])

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
      const defaultPos = {
        x: containerRect.width - legendRect.width - 20,
        y: 20
      }
      const defaultRatio = {
        xRatio: defaultPos.x / containerRect.width,
        yRatio: defaultPos.y / containerRect.height
      }
      legendRatioRef.current = defaultRatio
      setLegendPos(defaultPos)
      setEditingChart?.({ ...mergedChart, legendPosition: defaultRatio })
    }
  }, [mergedChart, setEditingChart])

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
  
  // Initialize quality optimization
  const {
    qualityState,
    startInteraction,
    endInteraction,
    cleanup: cleanupQuality,
  } = useQualityOptimization({
    dataCount: chartData?.length || 0,
    enableOptimization: settings.performanceSettings.qualityControl?.dynamicQuality ?? true,
    qualityThreshold: settings.performanceSettings.qualityControl?.qualityThreshold ?? 5000,
    debounceDelay: 150,
  })
  
  // Initialize zoom functionality
  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    selectionState,
  } = useChartZoom({
    svgRef,
    width: dimensions.width,
    height: dimensions.height,
    minZoom: 0.5,
    maxZoom: 10,
    enablePan,
    enableZoom,
    onZoom: handleZoomTransform,
    onZoomStart: startInteraction,
    onZoomEnd: endInteraction,
    margin: mergedChart.margins || { top: 20, right: 40, bottom: 60, left: 60 },
    chartId: mergedChart.id,
    enableRangeSelection: true,
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
    if (legendPos?.x !== newPos.x || legendPos?.y !== newPos.y) {
      setLegendPos(newPos)
    }
  }, [dimensions])

  const handleLegendPointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current || !legendRef.current) return
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

  // Render chart function (not memoized for zoom updates)
  const renderChart = () => {
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
          
          // Clear everything
          svg.selectAll("*").remove()

          const margin = mergedChart.margins || { top: 20, right: 40, bottom: 60, left: 60 }
          const width = dimensions.width - margin.left - margin.right
          const height = dimensions.height - margin.top - margin.bottom

          // Main group with margin transform
          const mainGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)

          if (chartData && chartData.length > 0) {
            // Use baseScalesRef for initial render, currentScalesRef for zoomed state
            // Check if we have valid current scales (they would be set after zoom)
            const hasValidCurrentScales = currentScalesRef.current.xScale !== null && currentScalesRef.current.yScale !== null
            const scalesToUse = isInitialRenderComplete.current && hasValidCurrentScales ? currentScalesRef : baseScalesRef
            
            // Only log significant state changes
            if (process.env.NODE_ENV === 'development' && zoomVersion > 0) {
              console.log(`[Chart ${mergedChart.id}] Rendering with zoom version:`, zoomVersion)
            }
            
            
            // Apply quality optimization if enabled
            const dataToRender = qualityState.renderOptions.samplingRate < 1
              ? chartData.filter((_, i) => i % Math.round(1 / qualityState.renderOptions.samplingRate) === 0)
              : chartData
              
            // Override chart display options based on quality level
            const optimizedChart = {
              ...mergedChart,
              showMarkers: qualityState.renderOptions.enableMarkers && mergedChart.showMarkers,
            }
            
            // Render chart with current scales - pass mainGroup
            renderScatterPlot({ 
              g: mainGroup, 
              data: dataToRender, 
              width, 
              height, 
              editingChart: optimizedChart, 
              scalesRef: scalesToUse, 
              dataSourceStyles, 
              canvas: canvasRef.current ?? undefined,
              plotStyles: mergedChart.plotStyles,
              enableSampling: settings.performanceSettings.dataProcessing.enableSampling
            })

            // On first render, copy base scales to current scales
            if (!isInitialRenderComplete.current && baseScalesRef.current.xScale) {
              currentScalesRef.current.xScale = baseScalesRef.current.xScale
              currentScalesRef.current.yScale = baseScalesRef.current.yScale
              isInitialRenderComplete.current = true
              // Initial render complete, scales ready
              
              // Apply pending zoom transform if any
              if (pendingZoomTransform.current) {
                // Apply pending zoom transform
                handleZoomTransform(pendingZoomTransform.current);
              }
            }
          } else {
            // Show loading or no data message
            if (!isLoadingData) {
              // Only show "No data" message if we're truly not loading
              mainGroup.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("fill", "#9ca3af")
                .style("font-size", "14px")
                .text("No data available")
            }
            // If loading, the loading indicator in the parent component will show
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

  // Initial render and updates
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
  }, [chartData, dimensions, isLoadingData, mergedChart, dataSourceStyles, settings.performanceSettings.dataProcessing.enableSampling, zoomVersion, qualityState])
  

  // Track shift key state for visual feedback - only for this chart
  const [isMouseOver, setIsMouseOver] = React.useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && isMouseOver) {
        setIsShiftPressed(true)
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isMouseOver])

  // Clean up tooltips on unmount
  useEffect(() => {
    return () => {
      hideAllTooltips()
      cleanupQuality()
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current)
      }
    }
  }, [cleanupQuality])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden"
      onMouseEnter={() => setIsMouseOver(true)}
      onMouseLeave={() => {
        setIsMouseOver(false)
        setIsShiftPressed(false)
      }}
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
      <div className="relative w-full h-full">
        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height} 
          className="absolute inset-0" 
          style={{ visibility: isLoadingData ? 'hidden' : 'visible' }}
          data-chart-id={mergedChart.id}
        />
        {selectionState.isSelecting && (
          <svg 
            width={dimensions.width} 
            height={dimensions.height} 
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 10 }}
          >
            <rect
              x={Math.min(selectionState.startX, selectionState.endX) + (mergedChart.margins?.left || 60)}
              y={Math.min(selectionState.startY, selectionState.endY) + (mergedChart.margins?.top || 20)}
              width={Math.abs(selectionState.endX - selectionState.startX)}
              height={Math.abs(selectionState.endY - selectionState.startY)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
          </svg>
        )}
      </div>
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
          scalesRef={currentScalesRef}
          dimensions={dimensions}
        />
      )}
      {enableZoom && (
        <>
          <ZoomControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetZoom}
            zoomLevel={zoomLevel}
            minZoom={0.5}
            maxZoom={10}
            showZoomLevel={true}
          />
          {isShiftPressed && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md backdrop-blur-sm">
              Range selection mode - Drag to select area
            </div>
          )}
          {qualityState.isTransitioning && qualityState.level !== 'high' && (
            <div className="absolute bottom-20 right-4 bg-yellow-500/90 text-white px-2 py-1 rounded text-xs font-medium shadow-sm backdrop-blur-sm">
              Performance mode
            </div>
          )}
        </>
      )}
    </div>
  )
})