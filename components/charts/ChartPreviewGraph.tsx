"use client"

import React, { useEffect, useRef, useMemo, useCallback, useState } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import { ChartContainer } from "./ChartPreview/ChartContainer"
import { ChartOverlay } from "./ChartPreview/ChartOverlay"
import { ChartCanvas } from "./ChartPreview/ChartCanvas"
import { ReferenceLines } from "./ChartPreview/ReferenceLines"
import { ChartLegend } from "./ChartLegend"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { useThrottle } from "@/hooks/useDebounce"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { useChartLoadingStore } from "@/stores/useChartLoadingStore"
import { useChartZoom } from "./ChartPreview/useChartZoom"
import { useQualityOptimization } from "./ChartPreview/useQualityOptimization"
import { arePlotStylesEqual } from "@/utils/plotStylesComparison"
import { renderChart } from "@/utils/chart/chartRenderer"
import { renderNoDataDisplay } from "@/utils/chart/noDataRenderer"
import {
  useChartScales,
  useChartLabelDrag,
  useChartLayout,
  useChartDimensions
} from "@/hooks/charts"

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
    showXLabel?: boolean
    showYLabel?: boolean
    showMarkers?: boolean
    showLines?: boolean
    showTooltip?: boolean
    margins?: {
      top: string | number
      right: string | number
      bottom: string | number
      left: string | number
    }
    xLabelOffset?: number
    yLabelOffset?: number
    marginMode?: 'auto' | 'manual' | 'percentage' | 'fixed' | 'adaptive' | 'unified'
    autoMarginScale?: number
    marginOverrides?: Record<string, any>
  }
  enableZoom?: boolean
  enablePan?: boolean
  zoomMode?: 'x' | 'xy' | 'auto'
  showZoomControls?: boolean
  isCompactLayout?: boolean
  gridLayout?: {
    columns: number
    rows: number
  }
}

const chartPreviewGraphPropsAreEqual = (prevProps: ChartPreviewGraphProps, nextProps: ChartPreviewGraphProps) => {
  // Check primitive props
  if (
    prevProps.maxDataPoints !== nextProps.maxDataPoints ||
    prevProps.enableZoom !== nextProps.enableZoom ||
    prevProps.enablePan !== nextProps.enablePan ||
    prevProps.zoomMode !== nextProps.zoomMode ||
    prevProps.showZoomControls !== nextProps.showZoomControls ||
    prevProps.isCompactLayout !== nextProps.isCompactLayout
  ) {
    return false
  }
  
  // Check if editingChart reference changed
  if (prevProps.editingChart !== nextProps.editingChart) {
    return false
  }
  
  // Check chart properties that affect rendering
  const prevChart = prevProps.editingChart
  const nextChart = nextProps.editingChart
  
  if (
    prevChart.id !== nextChart.id ||
    prevChart.type !== nextChart.type ||
    prevChart.xAxisType !== nextChart.xAxisType ||
    prevChart.xParameter !== nextChart.xParameter ||
    JSON.stringify(prevChart.yAxisParams) !== JSON.stringify(nextChart.yAxisParams) ||
    JSON.stringify(prevChart.margins) !== JSON.stringify(nextChart.margins) ||
    prevChart.xLabel !== nextChart.xLabel ||
    JSON.stringify(prevChart.yAxisLabels) !== JSON.stringify(nextChart.yAxisLabels) ||
    prevChart.autoUpdateXLabel !== nextChart.autoUpdateXLabel ||
    prevChart.autoUpdateYLabels !== nextChart.autoUpdateYLabels ||
    prevChart.showXLabel !== nextChart.showXLabel ||
    prevChart.showYLabel !== nextChart.showYLabel ||
    prevChart.title !== nextChart.title ||
    prevChart.showTitle !== nextChart.showTitle ||
    prevChart.legendMode !== nextChart.legendMode ||
    prevChart.showGrid !== nextChart.showGrid ||
    prevChart.xAxisTicks !== nextChart.xAxisTicks ||
    prevChart.yAxisTicks !== nextChart.yAxisTicks ||
    prevChart.xAxisTickPrecision !== nextChart.xAxisTickPrecision ||
    prevChart.yAxisTickPrecision !== nextChart.yAxisTickPrecision ||
    !arePlotStylesEqual(prevChart.plotStyles, nextChart.plotStyles)
  ) {
    return false
  }
  
  // Check other props
  if (prevProps.selectedDataSourceItems !== nextProps.selectedDataSourceItems) {
    if (prevProps.selectedDataSourceItems.length !== nextProps.selectedDataSourceItems.length) {
      return false
    }
  }
  
  if (JSON.stringify(prevProps.dataSourceStyles) !== JSON.stringify(nextProps.dataSourceStyles)) {
    return false
  }
  
  if (JSON.stringify(prevProps.chartSettings) !== JSON.stringify(nextProps.chartSettings)) {
    return false
  }
  
  return true
}

export const ChartPreviewGraph = React.memo(({ 
  editingChart, 
  selectedDataSourceItems, 
  setEditingChart, 
  maxDataPoints, 
  dataSourceStyles, 
  chartSettings, 
  enableZoom = true, 
  enablePan = true, 
  zoomMode = 'auto', 
  showZoomControls = true, 
  isCompactLayout = false, 
  gridLayout 
}: ChartPreviewGraphProps) => {
  // State management
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isRangeSelectionMode, setIsRangeSelectionMode] = useState(false)
  const [isMouseOver, setIsMouseOver] = useState(false)
  const [zoomVersion, setZoomVersion] = useState(0)
  
  // Refs
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderingRef = useRef<boolean>(false)
  const animationFrameRef = useRef<number | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const legendRef = useRef<HTMLDivElement>(null)
  const [legendPos, setLegendPos] = useState<{ x: number; y: number } | null>(null)
  const legendRatioRef = useRef<{ xRatio: number; yRatio: number } | null>(
    editingChart.legendPosition ?? null
  )
  
  // Store management
  const { settings } = useSettingsStore()
  const { registerRendering, unregisterRendering } = useChartLoadingStore()
  
  // Extract settings
  const enableSampling = settings.performanceSettings.dataProcessing.enableSampling
  const defaultSamplingPoints = settings.performanceSettings.dataProcessing.defaultSamplingPoints
  const dynamicQuality = true // Default to dynamic quality
  const qualityThreshold = 5000 // Default threshold
  
  const defaultMaxDataPoints = enableSampling 
    ? defaultSamplingPoints
    : Number.MAX_SAFE_INTEGER
  const effectiveMaxDataPoints = maxDataPoints ?? defaultMaxDataPoints
  
  // Initialize xLabel for datetime axis if missing
  useEffect(() => {
    if ((editingChart.xAxisType === "datetime" || !editingChart.xAxisType) && !editingChart.xLabel && setEditingChart) {
      setEditingChart({
        ...editingChart,
        xLabel: "Datetime"
      })
    }
  }, [editingChart.xAxisType, editingChart.xLabel, setEditingChart])
  
  // Merge global chart settings with individual chart settings
  const mergedChart = useMemo(() => {
    let baseChart = editingChart
    
    // Apply xLabel if needed
    if ((baseChart.xAxisType === "datetime" || !baseChart.xAxisType) && !baseChart.xLabel) {
      baseChart = {
        ...baseChart,
        xLabel: "Datetime"
      }
    }
    
    if (!chartSettings) return baseChart
    
    return {
      ...baseChart,
      showLegend: chartSettings.showLegend !== undefined ? chartSettings.showLegend : baseChart.showLegend,
      showTitle: chartSettings.showChartTitle !== undefined ? chartSettings.showChartTitle : baseChart.showTitle,
      showXAxis: chartSettings.showXAxis !== undefined ? chartSettings.showXAxis : baseChart.showXAxis,
      showYAxis: chartSettings.showYAxis !== undefined ? chartSettings.showYAxis : baseChart.showYAxis,
      showXLabel: chartSettings.showXLabel !== undefined ? chartSettings.showXLabel : baseChart.showXLabel,
      showYLabel: chartSettings.showYLabel !== undefined ? chartSettings.showYLabel : baseChart.showYLabel,
      showGrid: chartSettings.showGrid !== undefined ? chartSettings.showGrid : baseChart.showGrid,
      showMarkers: chartSettings.showMarkers !== undefined ? chartSettings.showMarkers : baseChart.showMarkers,
      showLines: chartSettings.showLines !== undefined ? chartSettings.showLines : baseChart.showLines,
      showTooltip: chartSettings.showTooltip !== undefined ? chartSettings.showTooltip : baseChart.showTooltip,
      margins: chartSettings.margins !== undefined ? 
        (typeof chartSettings.margins === 'object' && chartSettings.margins ? {
          top: typeof chartSettings.margins.top === 'number' ? chartSettings.margins.top : 20,
          right: typeof chartSettings.margins.right === 'number' ? chartSettings.margins.right : 20,
          bottom: typeof chartSettings.margins.bottom === 'number' ? chartSettings.margins.bottom : 40,
          left: typeof chartSettings.margins.left === 'number' ? chartSettings.margins.left : 40
        } : baseChart.margins) : baseChart.margins,
      xLabelOffset: chartSettings.xLabelOffset !== undefined ? chartSettings.xLabelOffset : baseChart.xLabelOffset,
      yLabelOffset: chartSettings.yLabelOffset !== undefined ? chartSettings.yLabelOffset : baseChart.yLabelOffset,
      plotStyles: baseChart.plotStyles,
      legendMode: baseChart.legendMode
    }
  }, [editingChart, chartSettings])
  
  // Custom hooks
  const { calculateAspectRatio } = useChartLayout({
    chart: mergedChart,
    dimensions: { width: 600, height: 400 }, // Will be updated by useChartDimensions
    gridLayout,
    chartSettings
  })
  
  const { dimensions } = useChartDimensions({
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    gridLayout,
    calculateAspectRatio
  })
  
  // Update layout with actual dimensions
  const { computedMargins: finalMargins, chartArea: finalChartArea } = useChartLayout({
    chart: mergedChart,
    dimensions,
    gridLayout,
    chartSettings
  })
  
  const {
    baseScalesRef,
    currentScalesRef,
    renderScalesRef,
    resetScales,
    applyZoomTransform,
    initializeScales,
    getScalesForRendering,
    areScalesReady
  } = useChartScales({
    zoomMode,
    chartType: mergedChart.type
  })
  
  const {
    addLabelDragHandlers,
    calculateLabelPositions
  } = useChartLabelDrag({
    chart: mergedChart,
    setEditingChart,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    svgRef: svgRef as React.RefObject<SVGSVGElement>,
    dimensions
  })
  
  // Data loading
  const { data: chartData, isLoading: isLoadingData, error } = useOptimizedChart({
    editingChart: mergedChart,
    selectedDataSourceItems,
    maxDataPoints: effectiveMaxDataPoints
  })
  
  // Memoize chartData
  const memoizedChartData = useMemo(() => {
    return chartData
  }, [JSON.stringify(chartData?.slice(0, 10)), chartData?.length])
  
  // Quality optimization
  const {
    qualityState,
    startInteraction,
    endInteraction,
    cleanup: cleanupQuality,
  } = useQualityOptimization({
    dataCount: memoizedChartData?.length || 0,
    enableOptimization: dynamicQuality,
    qualityThreshold: qualityThreshold,
    debounceDelay: 150,
  })
  
  // Zoom handling
  const handleZoomTransformBase = useCallback((transform: d3.ZoomTransform) => {
    const updated = applyZoomTransform(transform)
    if (updated) {
      setZoomVersion(v => v + 1)
    }
  }, [applyZoomTransform])
  
  const handleZoomTransform = useThrottle(handleZoomTransformBase, 16)
  
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
    margin: finalMargins,
    chartId: editingChart.id,
    enableRangeSelection: true,
    isRangeSelectionMode,
    getScales: useCallback(() => ({
      baseScales: baseScalesRef.current,
      currentScales: currentScalesRef.current,
    }), [baseScalesRef, currentScalesRef]),
  })
  
  // Legend position management
  useEffect(() => {
    if (!containerRef.current || !legendRef.current || legendPos !== null) return
    
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
  
  // Reset parameters on change
  useEffect(() => {
    resetScales()
    resetZoom()
    setZoomVersion(v => v + 1)
  }, [mergedChart.xParameter, mergedChart.yAxisParams, mergedChart.xAxisType, gridLayout, resetScales, resetZoom])
  
  // Track axis settings changes
  useEffect(() => {
    resetScales()
    setZoomVersion(v => v + 1)
  }, [
    mergedChart.xAxisTicks,
    mergedChart.yAxisTicks,
    mergedChart.xAxisTickPrecision,
    mergedChart.yAxisTickPrecision,
    mergedChart.showGrid,
    resetScales
  ])
  
  // Render chart function
  const doRenderChart = useCallback(() => {
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
    registerRendering(editingChart.id)
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (!svgRef.current) {
        renderingRef.current = false
        unregisterRendering(editingChart.id)
        return
      }

      try {
        if (memoizedChartData && memoizedChartData.length > 0) {
          const scalesToUse = getScalesForRendering()
          renderScalesRef.current = {
            xScale: scalesToUse.current.xScale,
            yScale: scalesToUse.current.yScale
          }
          
          const qualityRenderOptions = qualityState.renderOptions
          const labelPositions = calculateLabelPositions(finalMargins)
          
          const result = renderChart({
            svg: svgRef.current,
            data: memoizedChartData,
            dimensions,
            margin: finalMargins,
            chart: mergedChart,
            scalesToUse,
            dataSourceStyles: dataSourceStyles || {},
            enableSampling,
            qualityRenderOptions,
            selectionState,
            isShiftPressed,
            isRangeSelectionMode,
            labelPositions,
            canvas: canvasRef.current ?? undefined,
            editingChartId: editingChart.id
          })
          
          cleanupRef.current = result.cleanup
          
          // Initialize scales after first render
          if (initializeScales()) {
            setZoomVersion(v => v + 1)
          }
        } else {
          // Render no data display
          const svg = d3.select(svgRef.current)
          svg.selectAll("*").remove()
          
          const mainGroup = svg.append("g")
            .attr("transform", `translate(${finalMargins.left},${finalMargins.top})`)
          
          renderNoDataDisplay(
            mainGroup,
            finalChartArea.width,
            finalChartArea.height,
            mergedChart,
            selectedDataSourceItems
          )
        }
        
        // Add drag handlers for labels after rendering
        setTimeout(() => {
          addLabelDragHandlers()
        }, 50)
        
        // Use double requestAnimationFrame to wait for browser paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            renderingRef.current = false
            animationFrameRef.current = null
            unregisterRendering(editingChart.id)
          })
        })
      } catch (error) {
        console.error('Error rendering chart:', error)
        renderingRef.current = false
        animationFrameRef.current = null
        unregisterRendering(editingChart.id)
      }
    })
  }, [
    memoizedChartData,
    dimensions,
    finalMargins,
    finalChartArea,
    mergedChart,
    dataSourceStyles,
    enableSampling,
    qualityState.renderOptions,
    selectionState,
    isShiftPressed,
    isRangeSelectionMode,
    editingChart.id,
    isLoadingData,
    registerRendering,
    unregisterRendering,
    getScalesForRendering,
    initializeScales,
    calculateLabelPositions,
    addLabelDragHandlers,
    selectedDataSourceItems
  ])
  
  // Render on dependencies change
  useEffect(() => {
    doRenderChart()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      if (renderingRef.current) {
        renderingRef.current = false
        unregisterRendering(editingChart.id)
      }
    }
  }, [doRenderChart])
  
  // Track shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && (isMouseOver || isRangeSelectionMode)) {
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
  }, [isMouseOver, isRangeSelectionMode])
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupQuality()
      unregisterRendering(editingChart.id)
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current)
      }
    }
  }, [cleanupQuality, editingChart.id, unregisterRendering])
  
  return (
    <ChartContainer
      ref={containerRef}
      isLoading={isLoadingData}
      error={error}
      onMouseEnter={() => setIsMouseOver(true)}
      onMouseLeave={() => {
        setIsMouseOver(false)
        setIsShiftPressed(false)
      }}
    >
      <ChartCanvas
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        isLoading={isLoadingData}
        chartId={editingChart.id}
      />
      
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
      
      {!isLoadingData && areScalesReady() && renderScalesRef.current.xScale && renderScalesRef.current.yScale && (
        <ReferenceLines
          svgRef={svgRef}
          editingChart={mergedChart}
          setEditingChart={setEditingChart}
          scalesRef={renderScalesRef}
          dimensions={dimensions}
          margins={finalMargins}
          zoomVersion={zoomVersion}
        />
      )}
      
      <ChartOverlay
        enableZoom={enableZoom}
        showZoomControls={showZoomControls}
        isMouseOver={isMouseOver}
        isCompactLayout={isCompactLayout}
        chartSettings={chartSettings}
        zoomLevel={zoomLevel}
        isRangeSelectionMode={isRangeSelectionMode}
        isShiftPressed={isShiftPressed}
        qualityState={qualityState}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onToggleRangeSelection={() => setIsRangeSelectionMode(!isRangeSelectionMode)}
      />
    </ChartContainer>
  )
}, chartPreviewGraphPropsAreEqual)