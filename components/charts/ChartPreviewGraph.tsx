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
import { useChartLoadingStore } from "@/stores/useChartLoadingStore"
import { useChartZoom } from "./ChartPreview/useChartZoom"
import { ZoomControls } from "./ChartPreview/ZoomControls"
import { useQualityOptimization } from "./ChartPreview/useQualityOptimization"
import { 
  calculateMarginInPixels, 
  createLayoutContext, 
  getUnifiedLayoutCategory,
  getUnifiedMinimumMargins,
  getUnifiedMaximumMargins,
  calculateUnifiedMargins,
  DEFAULT_UNIFIED_MARGIN_CONFIG,
  MarginValue
} from "@/utils/chart/marginCalculator"
import { arePlotStylesEqual } from "@/utils/plotStylesComparison"

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
    } | {
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
    // If references are different, we need to re-render
    // This is important because UIStore creates new objects on update
    return false
  }
  
  // If references are the same, do deep comparison of properties that affect rendering
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
    // More efficient plotStyles comparison using custom comparison function
    !arePlotStylesEqual(prevChart.plotStyles, nextChart.plotStyles)
  ) {
    return false
  }
  
  // Check if selectedDataSourceItems changed
  if (prevProps.selectedDataSourceItems !== nextProps.selectedDataSourceItems) {
    if (prevProps.selectedDataSourceItems.length !== nextProps.selectedDataSourceItems.length) {
      return false
    }
    // Could add deeper comparison if needed
  }
  
  // Check if dataSourceStyles changed (shallow comparison)
  if (JSON.stringify(prevProps.dataSourceStyles) !== JSON.stringify(nextProps.dataSourceStyles)) {
    return false
  }
  
  // Check if chartSettings changed
  if (JSON.stringify(prevProps.chartSettings) !== JSON.stringify(nextProps.chartSettings)) {
    return false
  }
  
  return true
}

export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, maxDataPoints, dataSourceStyles, chartSettings, enableZoom = true, enablePan = true, zoomMode = 'auto', showZoomControls = true, isCompactLayout = false, gridLayout }: ChartPreviewGraphProps) => {
  const [isShiftPressed, setIsShiftPressed] = React.useState(false)
  const [isRangeSelectionMode, setIsRangeSelectionMode] = React.useState(false)
  const { settings } = useSettingsStore()
  const { registerRendering, unregisterRendering } = useChartLoadingStore()
  
  // Extract only what we need from settings to avoid unnecessary re-renders
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
  }, [editingChart.xAxisType, editingChart.xLabel])
  
  // Merge global chart settings with individual chart settings
  const mergedChart = useMemo(() => {
    let baseChart = editingChart
    
    // Apply xLabel if needed (without calling setState)
    if ((baseChart.xAxisType === "datetime" || !baseChart.xAxisType) && !baseChart.xLabel) {
      baseChart = {
        ...baseChart,
        xLabel: "Datetime"
      }
    }
    
    if (!chartSettings) return baseChart
    
    const merged = {
      ...baseChart,
      showLegend: chartSettings.showLegend !== undefined ? chartSettings.showLegend : baseChart.showLegend,
      showTitle: chartSettings.showChartTitle !== undefined ? chartSettings.showChartTitle : baseChart.showTitle,
      showXLabel: chartSettings.showXAxis !== undefined ? chartSettings.showXAxis : baseChart.showXLabel,
      showYLabel: chartSettings.showYAxis !== undefined ? chartSettings.showYAxis : baseChart.showYLabel,
      showGrid: chartSettings.showGrid !== undefined ? chartSettings.showGrid : baseChart.showGrid,
      margins: chartSettings.margins !== undefined ? 
        (typeof chartSettings.margins === 'object' && chartSettings.margins ? {
          top: typeof chartSettings.margins.top === 'number' ? chartSettings.margins.top : 20,
          right: typeof chartSettings.margins.right === 'number' ? chartSettings.margins.right : 20,
          bottom: typeof chartSettings.margins.bottom === 'number' ? chartSettings.margins.bottom : 40,
          left: typeof chartSettings.margins.left === 'number' ? chartSettings.margins.left : 40
        } : baseChart.margins) : baseChart.margins,
      xLabelOffset: chartSettings.xLabelOffset !== undefined ? chartSettings.xLabelOffset : baseChart.xLabelOffset,
      yLabelOffset: chartSettings.yLabelOffset !== undefined ? chartSettings.yLabelOffset : baseChart.yLabelOffset,
      // Always use the latest plotStyles and legendMode from baseChart
      plotStyles: baseChart.plotStyles,
      legendMode: baseChart.legendMode
    }
    
    
    return merged
  }, [editingChart, chartSettings])
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderingRef = useRef<boolean>(false)
  const animationFrameRef = useRef<number | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const [dimensions, setDimensions] = React.useState({ width: 600, height: 400 })
  const legendRef = useRef<HTMLDivElement>(null)
  const [legendPos, setLegendPos] = React.useState<{ x: number; y: number } | null>(null)
  const legendRatioRef = useRef<{ xRatio: number; yRatio: number } | null>(
    mergedChart.legendPosition ?? null
  )
  
  // States for draggable labels
  const [titlePos, setTitlePos] = React.useState<{ x: number; y: number } | null>(null)
  const [xLabelPos, setXLabelPos] = React.useState<{ x: number; y: number } | null>(null)
  const [yLabelPos, setYLabelPos] = React.useState<{ x: number; y: number } | null>(null)
  const titleRatioRef = useRef<{ xRatio: number; yRatio: number } | null>(
    mergedChart.titlePosition ?? null
  )
  const xLabelRatioRef = useRef<{ xRatio: number; yRatio: number } | null>(
    mergedChart.xLabelPosition ?? null
  )
  const yLabelRatioRef = useRef<{ xRatio: number; yRatio: number } | null>(
    mergedChart.yLabelPosition ?? null
  )

  useEffect(() => {
    legendRatioRef.current = mergedChart.legendPosition ?? null
  }, [mergedChart.legendPosition])
  
  useEffect(() => {
    titleRatioRef.current = mergedChart.titlePosition ?? null
    xLabelRatioRef.current = mergedChart.xLabelPosition ?? null
    yLabelRatioRef.current = mergedChart.yLabelPosition ?? null
  }, [mergedChart.titlePosition, mergedChart.xLabelPosition, mergedChart.yLabelPosition])
  
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
  
  // Track previous parameters to detect changes
  const prevParamsRef = useRef<{
    xParameter?: string
    yAxisParams?: string
    xAxisType?: string
  }>({})
  
  // Store reset zoom function ref to use in effect
  const resetZoomRef = useRef<(() => void) | null>(null)
  
  // Track data version to detect actual data changes
  const dataVersionRef = useRef<string>('')
  const isWaitingForNewDataRef = useRef(false)
  
  // Track previous dimensions to detect size changes
  const prevDimensionsRef = useRef<{ width: number; height: number } | null>(null)
  
  // Extract render-critical properties from mergedChart to optimize re-renders
  const chartRenderProps = useMemo(() => ({
    id: mergedChart.id,
    type: mergedChart.type,
    showMarkers: mergedChart.showMarkers,
    showLines: mergedChart.showLines,
    plotStyles: mergedChart.plotStyles,
    // Add display settings that affect rendering
    title: mergedChart.title,
    showTitle: mergedChart.showTitle,
    showGrid: mergedChart.showGrid,
    showXLabel: mergedChart.showXLabel,
    showYLabel: mergedChart.showYLabel,
  }), [
    mergedChart.id, 
    mergedChart.type, 
    mergedChart.showMarkers, 
    mergedChart.showLines, 
    mergedChart.plotStyles,
    mergedChart.title,
    mergedChart.showTitle,
    mergedChart.showGrid,
    mergedChart.showXLabel,
    mergedChart.showYLabel
  ])
  

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
  
  // Memoize chartData to prevent unnecessary re-renders
  // Only create new reference when data actually changes
  const memoizedChartData = useMemo(() => {
    return chartData
  }, [JSON.stringify(chartData?.slice(0, 10)), chartData?.length]) // Use first 10 items + length as a fingerprint
  
  // Initialize quality optimization
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
  
  // Extract quality render options separately to avoid unnecessary re-renders
  const qualityRenderOptions = qualityState.renderOptions
  
  // Memoize dataSourceStyles to prevent unnecessary re-renders
  const memoizedDataSourceStyles = useMemo(() => {
    return dataSourceStyles || {}
  }, [JSON.stringify(dataSourceStyles)])
  
  // Track when scales are ready
  const [scalesReady, setScalesReady] = React.useState(false)
  React.useEffect(() => {
    if (baseScalesRef.current.xScale && baseScalesRef.current.yScale) {
      setScalesReady(true)
    }
  }, [zoomVersion]) // Update when zoom changes
  
  // Calculate margins based on current state
  const computedMargins = useMemo(() => {
    let margin = { top: 20, right: 40, bottom: 60, left: 60 }
    
    // Priority 1: Grid-wide chart settings margins (from Layout Settings)
    if (chartSettings?.margins) {
      margin = {
        top: Number(chartSettings.margins.top) || 20,
        right: Number(chartSettings.margins.right) || 40,
        bottom: Number(chartSettings.margins.bottom) || 50,
        left: Number(chartSettings.margins.left) || 55
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[ChartPreviewGraph] Using grid-wide margins from chartSettings:', margin)
      }
    }
    // Priority 2: 4x4 layout gets ultra-compact margins
    else if (gridLayout?.columns === 4 && gridLayout?.rows === 4) {
      margin = {
        top: Math.round(dimensions.height * 0.03),    // 3%
        right: Math.round(dimensions.width * 0.04),   // 4%
        bottom: Math.round(dimensions.height * 0.06), // 6%
        left: Math.round(dimensions.width * 0.10)     // 10%
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[ChartPreviewGraph] Computed 4x4 margins:', {
          margin,
          dimensions,
          percentages: {
            top: '3%',
            right: '4%',
            bottom: '6%',
            left: '10%'
          }
        })
      }
    } else {
      // Check if we have percentage margins
      const hasPercentageMargins = mergedChart.margins && 
        typeof mergedChart.margins.top === 'string' && 
        (mergedChart.margins.top as string).endsWith('%')
      
      if ((chartSettings?.marginMode === 'unified' || chartSettings?.marginMode === 'percentage' || hasPercentageMargins) && gridLayout) {
        // Use the new unified margin calculation with grid layout info
        margin = calculateUnifiedMargins(dimensions.width, dimensions.height, DEFAULT_UNIFIED_MARGIN_CONFIG, gridLayout)
      } else if (hasPercentageMargins && mergedChart.margins) {
        // Convert percentage margins to pixels (for cases without gridLayout)
        margin = {
          top: calculateMarginInPixels(mergedChart.margins.top as MarginValue, dimensions.height),
          right: calculateMarginInPixels(mergedChart.margins.right as MarginValue, dimensions.width),
          bottom: calculateMarginInPixels(mergedChart.margins.bottom as MarginValue, dimensions.height),
          left: calculateMarginInPixels(mergedChart.margins.left as MarginValue, dimensions.width)
        }
      } else if (mergedChart.margins) {
        // Fall back to existing margins if not using unified mode
        margin = mergedChart.margins as { top: number; right: number; bottom: number; left: number }
      }
    }
    
    return margin
  }, [dimensions, gridLayout, mergedChart.margins, chartSettings?.marginMode, chartSettings?.margins])
  
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
    margin: computedMargins,
    chartId: editingChart.id,
    enableRangeSelection: true,
    isRangeSelectionMode,
    getScales: useCallback(() => ({
      baseScales: baseScalesRef.current,
      currentScales: currentScalesRef.current,
    }), []),
  })
  
  // Store resetZoom in ref for use in effects
  useEffect(() => {
    resetZoomRef.current = resetZoom
  }, [resetZoom])
  
  // Reset scales when parameters change
  useEffect(() => {
    const currentParams = {
      xParameter: mergedChart.xParameter,
      yAxisParams: JSON.stringify(mergedChart.yAxisParams),
      xAxisType: mergedChart.xAxisType
    }
    
    // Check if any parameter has changed
    const hasParamsChanged = 
      prevParamsRef.current.xParameter !== currentParams.xParameter ||
      prevParamsRef.current.yAxisParams !== currentParams.yAxisParams ||
      prevParamsRef.current.xAxisType !== currentParams.xAxisType
    
    if (hasParamsChanged && prevParamsRef.current.xParameter !== undefined) {
      
      // Reset all scale-related state
      isInitialRenderComplete.current = false
      baseScalesRef.current = { xScale: null, yScale: null }
      currentScalesRef.current = { xScale: null, yScale: null }
      pendingZoomTransform.current = null
      isWaitingForNewDataRef.current = true // Mark that we're waiting for new data
      setScalesReady(false) // Reset scales ready state for ReferenceLines
      
      // Reset zoom if available
      if (resetZoomRef.current) {
        resetZoomRef.current()
      }
      
      // Force re-render
      setZoomVersion(v => v + 1)
    }
    
    // Update previous params
    prevParamsRef.current = currentParams
  }, [mergedChart.xParameter, mergedChart.yAxisParams, mergedChart.xAxisType])
  
  // Track data changes and force scale recreation when new data arrives
  useEffect(() => {
    if (!memoizedChartData || isLoadingData) return
    
    // Create a data fingerprint to detect actual data changes
    const dataFingerprint = JSON.stringify({
      length: memoizedChartData.length,
      firstItems: memoizedChartData.slice(0, 5).map(d => ({
        x: d.x instanceof Date ? d.x.getTime() : d.x,
        y: d.y,
        series: d.series
      })),
      lastItems: memoizedChartData.slice(-5).map(d => ({
        x: d.x instanceof Date ? d.x.getTime() : d.x,
        y: d.y,
        series: d.series
      }))
    })
    
    const dataChanged = dataFingerprint !== dataVersionRef.current
    
    if (dataChanged && isWaitingForNewDataRef.current) {
      
      // Force scale recreation with new data
      isInitialRenderComplete.current = false
      baseScalesRef.current = { xScale: null, yScale: null }
      currentScalesRef.current = { xScale: null, yScale: null }
      isWaitingForNewDataRef.current = false
      
      // Force re-render to create new scales with fresh data
      setZoomVersion(v => v + 1)
    }
    
    dataVersionRef.current = dataFingerprint
  }, [memoizedChartData, isLoadingData])
  
  // Track dimension changes and update scales accordingly
  useEffect(() => {
    if (!prevDimensionsRef.current) {
      prevDimensionsRef.current = dimensions
      return
    }
    
    const prevDims = prevDimensionsRef.current
    const dimensionsChanged = prevDims.width !== dimensions.width || prevDims.height !== dimensions.height
    
    if (dimensionsChanged && isInitialRenderComplete.current) {
      // Dimensions changed after initial render - need to update scale ranges
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Chart ${chartRenderProps.id}] Dimensions changed:`, {
          prev: prevDims,
          new: dimensions
        })
      }
      
      // Force a re-render to update scale ranges
      setZoomVersion(v => v + 1)
    }
    
    prevDimensionsRef.current = dimensions
  }, [dimensions, chartRenderProps.id])


  // Calculate minimum height based on layout
  const getMinHeight = useCallback((currentGridLayout?: { columns: number; rows: number }) => {
    // Special handling for 4-column layouts
    if (currentGridLayout && currentGridLayout.columns >= 4) {
      if (currentGridLayout.rows === 1) return 80   // 1x4: Reduced height for horizontal emphasis
      if (currentGridLayout.rows === 2) return 100  // 2x4: Moderate height
      if (currentGridLayout.rows === 3) return 80   // 3x4: Compact
      if (currentGridLayout.rows >= 4) return 80    // 4x4: Increased from 60 to 80 for better visibility
    }
    // Existing logic for other layouts
    if (currentGridLayout && (currentGridLayout.columns >= 3 || currentGridLayout.rows >= 3)) {
      return 100 // Compact for 3x3
    }
    if (isCompactLayout) {
      return 150 // General compact layout
    }
    return 200 // Normal layout
  }, [isCompactLayout])

  // Throttled resize handler for better performance
  const handleResize = useThrottle((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      // Only update if we have valid dimensions
      if (width > 0 && height > 0) {
        const minHeight = getMinHeight(gridLayout)
        // Remove container padding to use full height
        setDimensions({ 
          width: Math.max(400, width), 
          height: Math.max(minHeight, height) // Use full container height
        })
      }
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
  
  // Add drag handlers for chart labels
  const addLabelDragHandlers = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return
    
    const svg = d3.select(svgRef.current)
    const containerRect = containerRef.current.getBoundingClientRect()
    
    // Helper function to setup drag behavior for a label
    const setupLabelDrag = (
      selector: string,
      posRef: React.MutableRefObject<{ xRatio: number; yRatio: number } | null>,
      setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
      updateKey: 'titlePosition' | 'xLabelPosition' | 'yLabelPosition',
      isRotated: boolean = false
    ) => {
      const label = svg.select(selector)
      if (label.empty()) return
      
      label.on('pointerdown', function(event: PointerEvent) {
        event.preventDefault()
        event.stopPropagation()
        
        const element = this as SVGTextElement
        const transform = element.getAttribute('transform')
        const currentX = +(element.getAttribute('x') || 0) || 0
        const currentY = +(element.getAttribute('y') || 0) || 0
        
        // Get the group transform to calculate absolute position
        const mainGroup = svg.select('g')
        const groupTransform = mainGroup.attr('transform')
        const translateMatch = groupTransform?.match(/translate\(([^,]+),([^)]+)\)/)
        const groupX = translateMatch ? +translateMatch[1] : 0
        const groupY = translateMatch ? +translateMatch[2] : 0
        
        let startX: number, startY: number
        if (isRotated) {
          // For rotated Y-label, swap coordinates
          startX = groupX - currentY  // Y becomes X (negated)
          startY = groupY - currentX  // X becomes Y (negated) 
        } else {
          startX = groupX + currentX
          startY = groupY + currentY
        }
        
        const initialMouseX = event.clientX
        const initialMouseY = event.clientY
        
        const handleMove = (ev: PointerEvent) => {
          const deltaX = ev.clientX - initialMouseX
          const deltaY = ev.clientY - initialMouseY
          
          let newX: number, newY: number
          if (isRotated) {
            // For rotated label, apply deltas inversely
            newX = startX + deltaX
            newY = startY + deltaY
            
            // Update element position (swap back for rotated element)
            element.setAttribute('x', String(-(newY - groupY)))
            element.setAttribute('y', String(newX - groupX))
          } else {
            newX = startX + deltaX
            newY = startY + deltaY
            
            // Update element position
            element.setAttribute('x', String(newX - groupX))
            element.setAttribute('y', String(newY - groupY))
          }
          
          // Calculate and store ratio
          const ratio = {
            xRatio: containerRect.width ? newX / containerRect.width : 0.5,
            yRatio: containerRect.height ? newY / containerRect.height : 0.5
          }
          
          posRef.current = ratio
          setPos({ x: newX, y: newY })
        }
        
        const handleUp = () => {
          document.removeEventListener('pointermove', handleMove)
          document.removeEventListener('pointerup', handleUp)
          
          if (posRef.current) {
            setEditingChart?.({ ...mergedChart, [updateKey]: posRef.current })
          }
        }
        
        document.addEventListener('pointermove', handleMove)
        document.addEventListener('pointerup', handleUp)
      })
    }
    
    // Setup drag for each label
    setupLabelDrag('.chart-title', titleRatioRef, setTitlePos, 'titlePosition')
    setupLabelDrag('.x-axis-label', xLabelRatioRef, setXLabelPos, 'xLabelPosition')
    setupLabelDrag('.y-axis-label', yLabelRatioRef, setYLabelPos, 'yLabelPosition', true)
  }, [mergedChart, setEditingChart])

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
      registerRendering(editingChart.id)  // Register rendering start
      
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!svgRef.current) {
          renderingRef.current = false
          unregisterRendering(editingChart.id)  // Unregister if aborted
          return
        }

        try {
          const svg = d3.select(svgRef.current)
          
          // Clear everything except reference lines layer and defs
          // Get all direct children of the SVG
          const svgNode = svgRef.current;
          if (svgNode) {
            const children = Array.from(svgNode.children);
            children.forEach(child => {
              const elem = d3.select(child);
              const tagName = child.tagName?.toLowerCase();
              
              // Keep defs (for clipPaths) and reference-lines-layer
              if (tagName === 'defs' || elem.classed('reference-lines-layer')) {
                return; // Keep these elements
              }
              
              // Remove everything else
              child.remove();
            });
          }

          // Use the pre-computed margins
          const margin = computedMargins
          
          // Debug logging
          if (process.env.NODE_ENV === 'development' && gridLayout?.columns === 4 && gridLayout?.rows === 4) {
            console.log('[ChartPreviewGraph] Using pre-computed margins:', {
              chartId: mergedChart.id,
              margin,
              dimensions,
              gridLayout
            })
          }
          
          const width = dimensions.width - margin.left - margin.right
          const height = dimensions.height - margin.top - margin.bottom
          
          // Set viewBox to ensure content stays within bounds
          svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")

          // Main group with margin transform
          const mainGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)

          if (memoizedChartData && memoizedChartData.length > 0) {
            // Use baseScalesRef for initial render, currentScalesRef for zoomed state
            // Check if we have valid current scales (they would be set after zoom)
            const hasValidCurrentScales = currentScalesRef.current.xScale !== null && currentScalesRef.current.yScale !== null
            const scalesToUse = isInitialRenderComplete.current && hasValidCurrentScales ? currentScalesRef : baseScalesRef
            
            // Only log significant state changes
            if (process.env.NODE_ENV === 'development' && zoomVersion > 0) {
              console.log(`[Chart ${chartRenderProps.id}] Rendering with zoom version:`, zoomVersion)
            }
            
            
            // Apply quality optimization if enabled
            const dataToRender = qualityRenderOptions.samplingRate < 1
              ? memoizedChartData.filter((_, i) => i % Math.round(1 / qualityRenderOptions.samplingRate) === 0)
              : memoizedChartData
              
            // Override chart display options based on quality level
            const optimizedChart = {
              ...mergedChart,
              margins: margin, // Use calculated pixel values instead of percentage strings
              showMarkers: qualityRenderOptions.enableMarkers && mergedChart.showMarkers,
            }
            
            // Calculate label positions from ratios
            const labelPositions: any = {}
            
            if (titleRatioRef.current && containerRef.current) {
              const containerRect = containerRef.current.getBoundingClientRect()
              labelPositions.title = {
                x: titleRatioRef.current.xRatio * containerRect.width - margin.left,
                y: titleRatioRef.current.yRatio * containerRect.height - margin.top
              }
            }
            
            if (xLabelRatioRef.current && containerRef.current) {
              const containerRect = containerRef.current.getBoundingClientRect()
              labelPositions.xLabel = {
                x: xLabelRatioRef.current.xRatio * containerRect.width - margin.left,
                y: xLabelRatioRef.current.yRatio * containerRect.height - margin.top
              }
            }
            
            if (yLabelRatioRef.current && containerRef.current) {
              const containerRect = containerRef.current.getBoundingClientRect()
              labelPositions.yLabel = {
                x: yLabelRatioRef.current.xRatio * containerRect.width - margin.left,
                y: yLabelRatioRef.current.yRatio * containerRect.height - margin.top
              }
            }
            
            // Render chart with current scales - pass mainGroup
            renderScatterPlot({ 
              g: mainGroup, 
              data: dataToRender, 
              width, 
              height, 
              editingChart: optimizedChart, 
              scalesRef: scalesToUse, 
              dataSourceStyles: memoizedDataSourceStyles, 
              canvas: canvasRef.current ?? undefined,
              plotStyles: mergedChart.plotStyles,
              enableSampling: enableSampling,
              disableTooltips: selectionState.isSelecting || isShiftPressed,
              labelPositions: Object.keys(labelPositions).length > 0 ? labelPositions : undefined
            })

            // On first render, copy base scales to current scales
            if (!isInitialRenderComplete.current && baseScalesRef.current.xScale) {
              currentScalesRef.current.xScale = baseScalesRef.current.xScale
              currentScalesRef.current.yScale = baseScalesRef.current.yScale
              isInitialRenderComplete.current = true
              // Initial render complete, scales ready
              setScalesReady(true) // Mark scales as ready for ReferenceLines
              
              // Apply pending zoom transform if any
              if (pendingZoomTransform.current) {
                // Apply pending zoom transform
                handleZoomTransform(pendingZoomTransform.current);
              }
            }
            
            // Add selection overlay if selecting or shift is pressed or in range selection mode
            if (selectionState.isSelecting || isShiftPressed || isRangeSelectionMode) {
              // Create an invisible overlay that captures all mouse events during selection
              svg.append("rect")
                .attr("class", "selection-overlay")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", dimensions.width)
                .attr("height", dimensions.height)
                .attr("fill", "transparent")
                .style("cursor", "crosshair")
                .style("pointer-events", "all");
              
              // Draw selection rectangle within the plot area (only if actively selecting)
              if (selectionState.isSelecting) {
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[ChartPreviewGraph ${editingChart.id}] Drawing selection rect:`, {
                    selectionState,
                    plotDimensions: { width, height },
                    margin
                  });
                }
                
                // Create a unique clip path for selection
                const selectionClipId = `selection-clip-${Math.random().toString(36).substr(2, 9)}`;
                mainGroup.append("clipPath")
                  .attr("id", selectionClipId)
                  .append("rect")
                  .attr("x", 0)
                  .attr("y", 0)
                  .attr("width", width)
                  .attr("height", height);
                
                const selectionGroup = mainGroup.append("g")
                  .attr("class", "selection-rect")
                  .attr("clip-path", `url(#${selectionClipId})`);
                
                const rectX = Math.min(selectionState.startX, selectionState.endX) - margin.left;
                const rectY = Math.min(selectionState.startY, selectionState.endY) - margin.top;
                const rectWidth = Math.abs(selectionState.endX - selectionState.startX);
                const rectHeight = Math.abs(selectionState.endY - selectionState.startY);
                
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[ChartPreviewGraph ${editingChart.id}] Selection rect attributes:`, {
                    x: rectX,
                    y: rectY,
                    width: rectWidth,
                    height: rectHeight
                  });
                }
                
                selectionGroup.append("rect")
                  .attr("x", rectX)
                  .attr("y", rectY)
                  .attr("width", rectWidth)
                  .attr("height", rectHeight)
                  .attr("fill", "rgba(59, 130, 246, 0.1)")
                  .attr("stroke", "rgb(59, 130, 246)")
                  .attr("stroke-width", "2")
                  .attr("stroke-dasharray", "4,2")
                  .style("pointer-events", "none");
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
          
          // Add drag handlers for labels after rendering
          setTimeout(() => {
            addLabelDragHandlers()
          }, 50)
          
          // Use double requestAnimationFrame to wait for browser paint
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              renderingRef.current = false
              animationFrameRef.current = null
              unregisterRendering(editingChart.id)  // Unregister after paint
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`[Chart ${editingChart.id}] Rendering complete (after paint)`)
              }
            })
          })
        } catch (error) {
          console.error('Error rendering chart:', error)
          renderingRef.current = false
          animationFrameRef.current = null
          unregisterRendering(editingChart.id)  // Unregister on error
        }
      })
    }

  // Initial render and updates
  useEffect(() => {
    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && memoizedChartData?.length > 0) {
      const currentDeps = {
        chartData: memoizedChartData,
        dimensions,
        isLoadingData,
        enableSampling,
        zoomVersion,
        samplingRate: qualityRenderOptions.samplingRate,
        enableMarkers: qualityRenderOptions.enableMarkers,
        chartId: chartRenderProps.id,
        chartType: chartRenderProps.type || 'scatter',
        showMarkers: chartRenderProps.showMarkers || false,
        showLines: chartRenderProps.showLines || false,
        plotStyles: chartRenderProps.plotStyles,
        computedMargins,
      }
      
      if (prevRenderDeps.current) {
        const changes: string[] = []
        if (prevRenderDeps.current.chartData !== currentDeps.chartData) changes.push('chartData')
        if (prevRenderDeps.current.dimensions !== currentDeps.dimensions) changes.push('dimensions')
        if (prevRenderDeps.current.isLoadingData !== currentDeps.isLoadingData) changes.push('isLoadingData')
        if (prevRenderDeps.current.enableSampling !== currentDeps.enableSampling) changes.push('enableSampling')
        if (prevRenderDeps.current.zoomVersion !== currentDeps.zoomVersion) changes.push('zoomVersion')
        if (prevRenderDeps.current.samplingRate !== currentDeps.samplingRate) changes.push('samplingRate')
        if (prevRenderDeps.current.enableMarkers !== currentDeps.enableMarkers) changes.push('enableMarkers')
        if (prevRenderDeps.current.chartId !== currentDeps.chartId) changes.push('chartId')
        if (prevRenderDeps.current.chartType !== currentDeps.chartType) changes.push('chartType')
        if (prevRenderDeps.current.showMarkers !== currentDeps.showMarkers) changes.push('showMarkers')
        if (prevRenderDeps.current.showLines !== currentDeps.showLines) changes.push('showLines')
        if (!arePlotStylesEqual(prevRenderDeps.current.plotStyles, currentDeps.plotStyles)) changes.push('plotStyles')
        if (JSON.stringify(prevRenderDeps.current.computedMargins) !== JSON.stringify(currentDeps.computedMargins)) changes.push('computedMargins')
        
        console.log(`[Chart ${chartRenderProps.id}] Render triggered by changes in:`, changes)
      }
      
      prevRenderDeps.current = currentDeps
    }
    
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
      if (renderingRef.current) {
        renderingRef.current = false
        unregisterRendering(editingChart.id)  // Clean up if render was in progress
      }
    }
  }, [
    memoizedChartData, 
    dimensions, 
    isLoadingData, 
    enableSampling, 
    zoomVersion,
    // Extract individual properties from qualityRenderOptions to avoid object reference changes
    qualityRenderOptions.samplingRate,
    qualityRenderOptions.enableMarkers,
    // Use specific chart render properties instead of whole objects
    chartRenderProps.id,
    chartRenderProps.type,
    chartRenderProps.showMarkers,
    chartRenderProps.showLines,
    chartRenderProps.plotStyles,
    // Display settings
    chartRenderProps.title,
    chartRenderProps.showTitle,
    chartRenderProps.showGrid,
    chartRenderProps.showXLabel,
    chartRenderProps.showYLabel,
    // margins are accessed directly from mergedChart in render function
    selectionState.isSelecting,
    selectionState.startX,
    selectionState.startY,
    selectionState.endX,
    selectionState.endY,
    isShiftPressed,
    computedMargins,
  ])
  

  // Debug: Track previous render values in development
  const prevRenderDeps = useRef<{
    chartData: any[],
    dimensions: any,
    isLoadingData: boolean,
    enableSampling: boolean,
    zoomVersion: number,
    samplingRate: number,
    enableMarkers: boolean,
    chartId: string,
    chartType: string,
    showMarkers: boolean,
    showLines: boolean,
    plotStyles: any,
    computedMargins: { top: number; right: number; bottom: number; left: number },
  } | null>(null)
  
  // Track shift key state for visual feedback - only for this chart
  const [isMouseOver, setIsMouseOver] = React.useState(false)
  
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

  
  // Clean up tooltips on unmount
  useEffect(() => {
    return () => {
      hideAllTooltips()
      cleanupQuality()
      unregisterRendering(editingChart.id)  // Clean up rendering state
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current)
      }
    }
  }, [cleanupQuality, editingChart.id, unregisterRendering])

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
      <div className="relative w-full h-full overflow-hidden">
        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height} 
          className="absolute inset-0" 
          style={{ 
            visibility: isLoadingData ? 'hidden' : 'visible',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
          data-chart-id={chartRenderProps.id}
        />
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
      {!isLoadingData && scalesReady && currentScalesRef.current.xScale && currentScalesRef.current.yScale && (
        <ReferenceLines
          svgRef={svgRef}
          editingChart={mergedChart}
          setEditingChart={setEditingChart}
          scalesRef={currentScalesRef}
          dimensions={dimensions}
          margins={computedMargins}
        />
      )}
      {enableZoom && showZoomControls && (
        <>
          {/* Check if this is being used in ChartCard (has chartSettings) */}
          {chartSettings ? (
            // Compact mode for ChartCard - show on hover
            <div className={`absolute ${isCompactLayout ? 'bottom-1 right-1' : 'bottom-1 right-1'} z-10 transition-opacity duration-200 ${isMouseOver ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <ZoomControls
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={resetZoom}
                zoomLevel={zoomLevel}
                minZoom={0.5}
                maxZoom={10}
                showZoomLevel={false}
                isRangeSelectionMode={isRangeSelectionMode}
                onToggleRangeSelection={() => setIsRangeSelectionMode(!isRangeSelectionMode)}
                variant={isCompactLayout ? "ultra-compact" : "default"}
                position="static"
                orientation="horizontal"
              />
            </div>
          ) : (
            // Default mode for ChartEditModal - reduce margins
            <div className="absolute bottom-2 right-2 z-10">
              <ZoomControls
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={resetZoom}
                zoomLevel={zoomLevel}
                minZoom={0.5}
                maxZoom={10}
                showZoomLevel={true}
                isRangeSelectionMode={isRangeSelectionMode}
                onToggleRangeSelection={() => setIsRangeSelectionMode(!isRangeSelectionMode)}
                variant="default"
                position="static"
                orientation="horizontal"
              />
            </div>
          )}
          {(isShiftPressed || isRangeSelectionMode) && (
            <div className={`absolute ${chartSettings ? 'top-1' : 'top-4'} left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-3 py-1 rounded-md text-sm font-medium shadow-md backdrop-blur-sm`}>
              {isRangeSelectionMode ? '範囲選択モード - ドラッグで範囲を選択' : 'Range selection mode - Drag to select area'}
            </div>
          )}
          {qualityState.isTransitioning && qualityState.level !== 'high' && !chartSettings && (
            <div className="absolute bottom-20 right-4 bg-yellow-500/90 text-white px-2 py-1 rounded text-xs font-medium shadow-sm backdrop-blur-sm">
              Performance mode
            </div>
          )}
        </>
      )}
    </div>
  )
}, chartPreviewGraphPropsAreEqual)