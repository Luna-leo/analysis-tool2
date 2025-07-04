"use client"

import React, { useEffect, useRef, useMemo, useLayoutEffect, useCallback, useDeferredValue } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import {
  renderScatterPlot,
  cleanupWebGLRenderer,
  ReferenceLines
} from "./ChartPreview/index"
import { ChartLegend } from "./ChartLegend"
import { NoDataDisplay } from "./NoDataDisplay"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { ChartErrorBoundary, useChartErrorRecovery } from "./ChartErrorBoundary"
import { hideAllTooltips } from "@/utils/chartTooltip"
import { useThrottle } from "@/hooks/useDebounce"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { globalIdleTaskQueue, IdleTaskPriority } from "@/utils/requestIdleCallbackPolyfill"
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
import { ChartScalesContext } from "@/contexts/ChartScalesContext"
import { useChartRenderConfig } from "@/hooks/useChartRenderConfig"
import { useStableMargins } from "@/hooks/useStableMargins"
import { useChartInteractionState } from "@/hooks/useChartInteractionState"

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
  // Callback to notify parent of scale updates
  onScalesUpdate?: (scales: {
    xDomain: [any, any]
    yDomain: [number, number]
    xAxisType: string
  }) => void
}


const chartPreviewGraphPropsAreEqual = (prevProps: ChartPreviewGraphProps, nextProps: ChartPreviewGraphProps) => {
  // Check primitive props
  if (
    prevProps.maxDataPoints !== nextProps.maxDataPoints ||
    prevProps.enableZoom !== nextProps.enableZoom ||
    prevProps.enablePan !== nextProps.enablePan ||
    prevProps.zoomMode !== nextProps.zoomMode ||
    prevProps.showZoomControls !== nextProps.showZoomControls ||
    prevProps.isCompactLayout !== nextProps.isCompactLayout ||
    prevProps.onScalesUpdate !== nextProps.onScalesUpdate
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
    prevChart.showGrid !== nextChart.showGrid ||
    // Axis tick settings
    prevChart.xAxisTicks !== nextChart.xAxisTicks ||
    prevChart.yAxisTicks !== nextChart.yAxisTicks ||
    prevChart.xAxisTickPrecision !== nextChart.xAxisTickPrecision ||
    prevChart.yAxisTickPrecision !== nextChart.yAxisTickPrecision ||
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

export const ChartPreviewGraph = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, maxDataPoints, dataSourceStyles, chartSettings, enableZoom = true, enablePan = true, zoomMode = 'auto', showZoomControls = true, isCompactLayout = false, gridLayout, onScalesUpdate }: ChartPreviewGraphProps) => {
  const [isShiftPressed, setIsShiftPressed] = React.useState(false)
  const [isRangeSelectionMode, setIsRangeSelectionMode] = React.useState(false)
  const { settings } = useSettingsStore()
  const { registerRendering, unregisterRendering } = useChartLoadingStore()
  const { error: recoveryError, recover, reportError } = useChartErrorRecovery()
  
  // Use new performance optimization hooks
  const { state: interactionState, actions: interactionActions, isInteracting } = useChartInteractionState()
  
  // Try to use ChartScalesContext if available
  const scalesContext = React.useContext(ChartScalesContext)
  const updateScalesContext = scalesContext?.updateScales || null
  
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
      // Axes visibility controls both axis and labels
      showXAxis: chartSettings.showXAxis !== undefined ? chartSettings.showXAxis : baseChart.showXAxis,
      showYAxis: chartSettings.showYAxis !== undefined ? chartSettings.showYAxis : baseChart.showYAxis,
      // Label visibility (separate from axis visibility)
      showXLabel: chartSettings.showXLabel !== undefined ? chartSettings.showXLabel : baseChart.showXLabel,
      showYLabel: chartSettings.showYLabel !== undefined ? chartSettings.showYLabel : baseChart.showYLabel,
      showGrid: chartSettings.showGrid !== undefined ? chartSettings.showGrid : baseChart.showGrid,
      // Data display options
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
  // Use deferred value for dimension updates to prevent blocking renders
  const deferredDimensions = useDeferredValue(dimensions)
  
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
  
  // Scales actually used for rendering (to ensure ReferenceLines uses same scales)
  const renderScalesRef = useRef<{
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
    gridLayout?: string
  }>({})
  
  // Store reset zoom function ref to use in effect
  const resetZoomRef = useRef<(() => void) | null>(null)
  
  // Track data version to detect actual data changes
  const dataVersionRef = useRef<string>('')
  const isWaitingForNewDataRef = useRef(false)
  
  // Track previous dimensions to detect size changes
  const prevDimensionsRef = useRef<{ width: number; height: number } | null>(null)
  
  // Track previous axis settings to detect changes
  const prevAxisSettingsRef = useRef<{
    xAxisTicks?: number
    yAxisTicks?: number
    xAxisTickPrecision?: number
    yAxisTickPrecision?: number
    showGrid?: boolean
  }>({})
  
  // Clear scales when axis settings change
  // Note: This may not be necessary anymore since renderChart is now triggered on axis settings changes
  useEffect(() => {
    const currentSettings = {
      xAxisTicks: mergedChart.xAxisTicks,
      yAxisTicks: mergedChart.yAxisTicks,
      xAxisTickPrecision: mergedChart.xAxisTickPrecision,
      yAxisTickPrecision: mergedChart.yAxisTickPrecision,
      showGrid: mergedChart.showGrid
    }
    
    const prevSettings = prevAxisSettingsRef.current
    
    // Check if any axis settings changed
    if (
      prevSettings.xAxisTicks !== currentSettings.xAxisTicks ||
      prevSettings.yAxisTicks !== currentSettings.yAxisTicks ||
      prevSettings.xAxisTickPrecision !== currentSettings.xAxisTickPrecision ||
      prevSettings.yAxisTickPrecision !== currentSettings.yAxisTickPrecision ||
      prevSettings.showGrid !== currentSettings.showGrid
    ) {
      
      // Clear scales to force recreation with new settings
      baseScalesRef.current = { xScale: null, yScale: null }
      currentScalesRef.current = { xScale: null, yScale: null }
      renderScalesRef.current = { xScale: null, yScale: null } // Reset render scales too
      isInitialRenderComplete.current = false
      
      // Update previous settings
      prevAxisSettingsRef.current = currentSettings
    }
  }, [
    mergedChart.xAxisTicks,
    mergedChart.yAxisTicks,
    mergedChart.xAxisTickPrecision,
    mergedChart.yAxisTickPrecision,
    mergedChart.showGrid,
    mergedChart.id
  ])
  
  // Use the new chart render config hook for stable configuration
  const renderConfig = useChartRenderConfig(mergedChart, {
    maxDataPoints: maxDataPoints ?? defaultMaxDataPoints,
    enableSampling,
    isCompactLayout,
    gridLayout,
    enableZoom,
    enablePan,
    zoomMode,
    showZoomControls
  })
  
  // Extract render-critical properties from mergedChart to optimize re-renders
  const chartRenderProps = useMemo(() => ({
    id: renderConfig.chartId,
    type: renderConfig.chartType,
    showMarkers: renderConfig.showMarkers,
    showLines: mergedChart.showLines,
    plotStyles: mergedChart.plotStyles,
    // Add display settings that affect rendering
    title: mergedChart.title,
    showTitle: renderConfig.showTitle,
    showGrid: renderConfig.showGrid,
    showXLabel: mergedChart.showXLabel,
    showYLabel: mergedChart.showYLabel,
    // Add axis tick settings
    xAxisTicks: renderConfig.xAxisTicks,
    yAxisTicks: renderConfig.yAxisTicks,
    xAxisTickPrecision: renderConfig.xAxisTickPrecision,
    yAxisTickPrecision: renderConfig.yAxisTickPrecision,
  }), [
    renderConfig.chartId,
    renderConfig.chartType,
    renderConfig.showMarkers,
    mergedChart.showLines,
    mergedChart.plotStyles,
    mergedChart.title,
    renderConfig.showTitle,
    renderConfig.showGrid,
    mergedChart.showXLabel,
    mergedChart.showYLabel,
    renderConfig.xAxisTicks,
    renderConfig.yAxisTicks,
    renderConfig.xAxisTickPrecision,
    renderConfig.yAxisTickPrecision
  ])
  

  // Handle zoom transformation with throttling to prevent race conditions
  const handleZoomTransformBase = useCallback((transform: d3.ZoomTransform) => {
    if (!baseScalesRef.current.xScale || !baseScalesRef.current.yScale) {
      pendingZoomTransform.current = transform;
      return;
    }

    // Update interaction state
    interactionActions.setZoom(transform)

    // Determine zoom mode based on chart type
    const effectiveZoomMode = renderConfig.zoomMode === 'auto' 
      ? (renderConfig.chartType === 'scatter' ? 'xy' : 'x')
      : renderConfig.zoomMode

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
      
      // Notify parent of scale updates (only when domains change)
      const xDomain = newXScale.domain()
      const yDomain = newYScale.domain()
      const xDomainStr = JSON.stringify(xDomain)
      const yDomainStr = JSON.stringify(yDomain)
      
      if (prevScaleDomainsRef.current.xDomain !== xDomainStr || 
          prevScaleDomainsRef.current.yDomain !== yDomainStr) {
        prevScaleDomainsRef.current.xDomain = xDomainStr
        prevScaleDomainsRef.current.yDomain = yDomainStr
        
        const scaleData = {
          xDomain: xDomain as [any, any],
          yDomain: yDomain as [number, number],
          xAxisType: renderConfig.xAxisType
        }
        
        if (onScalesUpdate) {
          onScalesUpdate(scaleData)
        }
        
        // Also update context if available
        if (updateScalesContext) {
          updateScalesContext(scaleData)
        }
      }
    }
  }, [renderConfig.zoomMode, renderConfig.chartType, renderConfig.xAxisType, onScalesUpdate, updateScalesContext, interactionActions])
  
  // Throttle zoom transform to 60fps to prevent race conditions during rapid movements
  const handleZoomTransform = useThrottle(handleZoomTransformBase, 16)

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
  
  // Track zoom level for data optimization
  const [currentZoomLevel, setCurrentZoomLevel] = React.useState(1)
  
  // Use optimized data loading hook
  const { data: chartData, isLoading: isLoadingData, error: dataError, progress } = useOptimizedChart({
    editingChart: mergedChart,
    selectedDataSourceItems,
    maxDataPoints: effectiveMaxDataPoints,
    zoomLevel: currentZoomLevel
  })
  
  // Combine errors
  const error = dataError || recoveryError
  
  // Report data errors to recovery hook
  useEffect(() => {
    if (dataError) {
      reportError(dataError)
    }
  }, [dataError, reportError])
  
  
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
  
  // Store previous scale domains to detect changes
  const prevScaleDomainsRef = useRef<{
    xDomain: string | null
    yDomain: string | null
  }>({ xDomain: null, yDomain: null })
  
  // Use the new stable margins hook
  const stableMargins = useStableMargins({
    showXAxis: renderConfig.showXAxis,
    showYAxis: renderConfig.showYAxis,
    showTitle: renderConfig.showTitle,
    showLegend: renderConfig.showLegend,
    showXLabel: mergedChart.showXLabel ?? true,
    showYLabel: mergedChart.showYLabel ?? true,
    xAxisTicks: renderConfig.xAxisTicks,
    yAxisTicks: renderConfig.yAxisTicks,
    xAxisTickPrecision: renderConfig.xAxisTickPrecision,
    yAxisTickPrecision: renderConfig.yAxisTickPrecision,
    isCompactLayout: renderConfig.isCompactLayout,
    marginMode: chartSettings?.marginMode || renderConfig.marginMode,
    margins: chartSettings?.margins || mergedChart.margins,
    debounceMs: 150
  })
  
  // Update margins when dimensions change
  useEffect(() => {
    stableMargins.updateMargins(deferredDimensions.width, deferredDimensions.height)
  }, [deferredDimensions.width, deferredDimensions.height, stableMargins.updateMargins])
  
  const computedMargins = stableMargins.margin
  
  // Initialize zoom functionality
  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    selectionState,
  } = useChartZoom({
    svgRef,
    width: deferredDimensions.width,
    height: deferredDimensions.height,
    minZoom: 0.5,
    maxZoom: 10,
    enablePan: renderConfig.enablePan,
    enableZoom: renderConfig.enableZoom,
    onZoom: handleZoomTransform,
    onZoomStart: () => {
      interactionActions.startZoom()
      startInteraction()
    },
    onZoomEnd: () => {
      interactionActions.endZoom()
      endInteraction()
    },
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
  
  // Update zoom level for data optimization
  useEffect(() => {
    setCurrentZoomLevel(zoomLevel)
  }, [zoomLevel])
  
  // Reset scales when parameters or layout changes
  useEffect(() => {
    const currentParams = {
      xParameter: mergedChart.xParameter,
      yAxisParams: JSON.stringify(mergedChart.yAxisParams),
      xAxisType: mergedChart.xAxisType,
      gridLayout: JSON.stringify(gridLayout) // Add grid layout to track changes
    }
    
    // Check if any parameter has changed
    const hasParamsChanged = 
      prevParamsRef.current.xParameter !== currentParams.xParameter ||
      prevParamsRef.current.yAxisParams !== currentParams.yAxisParams ||
      prevParamsRef.current.xAxisType !== currentParams.xAxisType ||
      prevParamsRef.current.gridLayout !== currentParams.gridLayout // Check layout changes
    
    if (hasParamsChanged && prevParamsRef.current.xParameter !== undefined) {
      
      // Reset all scale-related state
      isInitialRenderComplete.current = false
      baseScalesRef.current = { xScale: null, yScale: null }
      currentScalesRef.current = { xScale: null, yScale: null }
      renderScalesRef.current = { xScale: null, yScale: null } // Reset render scales too
      pendingZoomTransform.current = null
      isWaitingForNewDataRef.current = true // Mark that we're waiting for new data
      
      // Don't immediately set scalesReady to false, wait for actual scale clearing
      setTimeout(() => {
        if (!baseScalesRef.current.xScale && !currentScalesRef.current.xScale && !renderScalesRef.current.xScale) {
          setScalesReady(false)
        }
      }, 0)
      
      // Reset zoom if available
      if (resetZoomRef.current) {
        resetZoomRef.current()
      }
      
      // Force re-render
      setZoomVersion(v => v + 1)
    }
    
    // Update previous params
    prevParamsRef.current = currentParams
  }, [mergedChart.xParameter, mergedChart.yAxisParams, mergedChart.xAxisType, gridLayout])
  
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
      renderScalesRef.current = { xScale: null, yScale: null } // Reset render scales too
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
      
      // Force a re-render to update scale ranges
      setZoomVersion(v => v + 1)
    }
    
    prevDimensionsRef.current = dimensions
  }, [dimensions, chartRenderProps.id])


  // Calculate minimum height based on layout - maintaining aspect ratio with Chart Grid
  const calculateAspectRatio = useCallback((containerHeight: number, currentGridLayout?: { columns: number; rows: number }) => {
    // Default minimum heights
    const defaultMinHeight = 200
    
    if (!currentGridLayout) {
      return defaultMinHeight
    }
    
    const isCompactLayout = currentGridLayout.rows >= 3 || currentGridLayout.columns >= 3
    
    // For Chart Preview, we want to maintain aspect ratio but not compress too much
    // Use a percentage of container height based on grid layout
    if (containerHeight > 0) {
      // Calculate what percentage of height each row should take
      // This maintains the visual aspect ratio of Chart Grid
      let heightPercentage: number
      
      if (currentGridLayout.rows === 1) {
        heightPercentage = 0.8 // Single row can use most of the height
      } else if (currentGridLayout.rows === 2) {
        heightPercentage = 0.4 // Two rows, each takes ~40%
      } else if (currentGridLayout.rows === 3) {
        heightPercentage = 0.3 // Three rows, each takes ~30%
      } else {
        heightPercentage = 0.25 // Four or more rows
      }
      
      const calculatedHeight = containerHeight * heightPercentage
      
      // Apply minimum constraints to ensure readability
      const minConstraint = isCompactLayout ? 150 : 200
      return Math.max(calculatedHeight, minConstraint)
    }
    
    // Fallback to static minimums
    return isCompactLayout ? 150 : defaultMinHeight
  }, [])

  // Throttled resize handler for better performance
  const handleResize = useThrottle((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      // Only update if we have valid dimensions
      if (width > 0 && height > 0) {
        // Calculate height based on aspect ratio, but use full container height as maximum
        const aspectHeight = calculateAspectRatio(height, gridLayout)
        
        setDimensions({ 
          width: Math.max(400, width), 
          height: Math.max(aspectHeight, Math.min(height, 600)) // Cap at 600px to avoid excessive height
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
          // For rotated Y-label (-90 degrees), the element's x,y are in rotated space
          // After -90 rotation: element at (x,y) appears at screen position (y, -x)
          startX = groupX + currentY  // Screen X = rotated Y
          startY = groupY - currentX  // Screen Y = -rotated X
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
            // For rotated label, calculate new screen position
            newX = startX + deltaX
            newY = startY + deltaY
            
            // Convert screen position to rotated coordinate system
            // For -90 rotation: to move right on screen (deltaX), increase Y in rotated space
            // For -90 rotation: to move down on screen (deltaY), decrease X in rotated space
            const rotatedX = currentX - deltaY  // Screen Y movement -> rotated -X
            const rotatedY = currentY + deltaX  // Screen X movement -> rotated Y
            
            element.setAttribute('x', String(rotatedX))
            element.setAttribute('y', String(rotatedY))
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

    // Set initial dimensions based on container
    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      const aspectHeight = calculateAspectRatio(rect.height, gridLayout)
      setDimensions({
        width: Math.max(400, rect.width),
        height: Math.max(aspectHeight, Math.min(rect.height, 600))
      })
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [handleResize, gridLayout, calculateAspectRatio])

  // Function to render no data display
  const renderNoDataDisplay = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    chart: ChartComponent,
    dataSources: EventInfo[]
  ) => {
    // Check configuration status
    const hasDataSources = dataSources.length > 0
    const hasXParameter = !!chart.xParameter || chart.xAxisType === "datetime" || chart.xAxisType === "time"
    const yAxisParams = chart.yAxisParams || []
    const hasYParameters = yAxisParams.length > 0 && yAxisParams.some(p => p.parameter)
    const validYParams = yAxisParams.filter(p => p.parameter)

    const centerX = width / 2
    const centerY = height / 2
    
    // Use ALL available space
    const isCompact = width < 400 || height < 300
    const margin = 2 // Ultra minimal margin
    const boxWidth = width - (margin * 2)
    const boxHeight = height - (margin * 2)
    const startX = margin
    const startY = margin

    // Background box - very subtle
    g.append("rect")
      .attr("x", startX)
      .attr("y", startY)
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("rx", 2)
      .attr("fill", "#fcfcfc")
      .attr("stroke", "#f0f0f0")
      .attr("stroke-width", 0.5)

    // Calculate dynamic font sizes - MUCH larger to fill space
    const baseFontSize = Math.max(16, Math.min(32, height / 8))
    const titleFontSize = Math.min(baseFontSize + 4, height / 6)
    const statusFontSize = baseFontSize
    const iconFontSize = baseFontSize + 4

    let currentY = startY + titleFontSize * 0.8

    // Chart title (if exists)
    if (chart.title) {
      const maxTitleWidth = boxWidth - 10
      const titleText = g.append("text")
        .attr("x", centerX)
        .attr("y", currentY)
        .attr("text-anchor", "middle")
        .attr("font-size", `${titleFontSize}px`)
        .attr("font-weight", "700")
        .style("fill", "#1f2937")
        .text(chart.title)
      
      // Truncate if too long
      let titleNode = titleText.node()
      if (titleNode && titleNode.getComputedTextLength() > maxTitleWidth) {
        let truncatedTitle = chart.title
        while (titleNode.getComputedTextLength() > maxTitleWidth && truncatedTitle.length > 0) {
          truncatedTitle = truncatedTitle.slice(0, -1)
          titleText.text(truncatedTitle + "...")
        }
      }
      currentY += titleFontSize * 1.2
    }

    // Configuration status
    const statusItems: Array<{
      label: string
      status: boolean
      text: string
      tooltip?: string | null
    }> = [
      {
        label: "Data",
        status: hasDataSources,
        text: hasDataSources 
          ? `${dataSources.length} selected`
          : "None selected"
      },
      {
        label: "X-axis",
        status: hasXParameter,
        text: hasXParameter
          ? chart.xAxisType === "datetime" 
            ? "Datetime"
            : chart.xAxisType === "time"
            ? "Time"
            : chart.xParameter || "Selected"
          : "Not configured"
      },
      {
        label: "Y-axis",
        status: hasYParameters,
        text: hasYParameters
          ? validYParams[0].parameter + (validYParams.length > 1 ? ` +${validYParams.length - 1} more` : "")
          : "Not configured",
        tooltip: validYParams.length > 1 
          ? validYParams.map(p => p.parameter).join(", ")
          : null
      }
    ]

    // Calculate optimal spacing to fill ALL available height
    const remainingHeight = boxHeight - (currentY - startY) - 10 // Tiny bottom margin
    const itemSpacing = remainingHeight / statusItems.length
    
    // Use full width for horizontal spacing
    const iconX = startX + 15
    const labelX = iconX + iconFontSize + 10
    const statusX = Math.max(labelX + 80, width * 0.35)
    
    statusItems.forEach((item, index) => {
      const yPos = currentY + (index + 0.5) * itemSpacing
      
      // Status icon - LARGE
      g.append("text")
        .attr("x", iconX)
        .attr("y", yPos)
        .attr("font-size", `${iconFontSize}px`)
        .attr("font-weight", "bold")
        .style("fill", item.status ? "#10b981" : "#ef4444")
        .text(item.status ? "✓" : "✗")
      
      // Label
      g.append("text")
        .attr("x", labelX)
        .attr("y", yPos)
        .attr("font-size", `${statusFontSize}px`)
        .attr("font-weight", "500")
        .style("fill", "#6b7280")
        .text(`${item.label}:`)
      
      // Status text group (for tooltip support)
      const textGroup = g.append("g")
      
      // Calculate available width for status text
      const maxStatusWidth = boxWidth - statusX + startX - 10
      
      const statusText = textGroup.append("text")
        .attr("x", statusX)
        .attr("y", yPos)
        .attr("font-size", `${statusFontSize}px`)
        .attr("font-weight", "500")
        .style("fill", "#374151")
        .text(item.text)
      
      // Check if text needs truncation
      const statusNode = statusText.node()
      if (statusNode && statusNode.getComputedTextLength() > maxStatusWidth) {
        let truncatedText = item.text
        while (statusNode.getComputedTextLength() > maxStatusWidth && truncatedText.length > 0) {
          truncatedText = truncatedText.slice(0, -1)
          statusText.text(truncatedText + "...")
        }
        
        // Add hover tooltip for full text
        const fullTextTooltip = g.append("g")
          .style("visibility", "hidden")
          .attr("class", "full-text-tooltip")
        
        const tooltipBg = fullTextTooltip.append("rect")
          .attr("fill", "rgba(0, 0, 0, 0.85)")
          .attr("rx", 3)
          .attr("stroke", "none")
        
        const tooltipText = fullTextTooltip.append("text")
          .attr("x", 0)
          .attr("y", 0)
          .attr("fill", "white")
          .attr("font-size", `${Math.max(12, baseFontSize - 2)}px`)
          .attr("dominant-baseline", "middle")
          .attr("text-anchor", "start")
          .text(item.text)
        
        const bbox = tooltipText.node()?.getBBox()
        if (bbox) {
          const padding = 8
          tooltipBg
            .attr("x", -padding)
            .attr("y", bbox.y - padding)
            .attr("width", bbox.width + padding * 2)
            .attr("height", bbox.height + padding * 2)
          
          // Position tooltip - ensure it stays within bounds
          const tooltipWidth = bbox.width + padding * 2
          // Ensure tooltip doesn't go past left or right edges
          let tooltipX = statusX
          if (tooltipX + tooltipWidth > boxWidth - 5) {
            tooltipX = boxWidth - tooltipWidth - 5
          }
          if (tooltipX < startX + 5) {
            tooltipX = startX + 5
          }
          const tooltipY = yPos - bbox.height - padding * 2 - 5
          
          fullTextTooltip.attr("transform", `translate(${tooltipX}, ${tooltipY})`)
        }
        
        statusText.style("cursor", "pointer")
        textGroup
          .on("mouseenter", () => fullTextTooltip.style("visibility", "visible"))
          .on("mouseleave", () => fullTextTooltip.style("visibility", "hidden"))
      }
      
      // Add tooltip for "+N more" parameters (only if not already truncated)
      if (item.tooltip && statusNode && statusNode.getComputedTextLength() <= maxStatusWidth) {
        // Create tooltip rect
        const tooltipGroup = g.append("g")
          .style("visibility", "hidden")
          .attr("class", "tooltip-group")
        
        const tooltipText = item.tooltip
        const tooltipPadding = 8
        const tooltipFontSize = Math.max(12, baseFontSize - 2)
        
        // Background rect for tooltip
        const tooltipBg = tooltipGroup.append("rect")
          .attr("fill", "rgba(0, 0, 0, 0.8)")
          .attr("rx", 3)
          .attr("stroke", "none")
        
        // Tooltip text - split parameters into separate lines
        const parameters = tooltipText.split(", ")
        const lineHeight = tooltipFontSize * 1.2
        
        // Create text element for multiline text
        const tooltipTextGroup = tooltipGroup.append("g")
        
        parameters.forEach((param, idx) => {
          tooltipTextGroup.append("text")
            .attr("x", 0)
            .attr("y", idx * lineHeight)
            .attr("fill", "white")
            .attr("font-size", `${tooltipFontSize}px`)
            .attr("dominant-baseline", "text-before-edge")
            .attr("text-anchor", "start")
            .text(param)
        })
        
        // Position tooltip after text is rendered
        const bbox = tooltipTextGroup.node()?.getBBox()
        if (bbox) {
          tooltipBg
            .attr("x", -tooltipPadding)
            .attr("y", -tooltipPadding)
            .attr("width", bbox.width + tooltipPadding * 2)
            .attr("height", bbox.height + tooltipPadding * 2)
          
          // Position tooltip - ensure it stays within bounds
          const tooltipWidth = bbox.width + tooltipPadding * 2
          // Ensure tooltip doesn't go past left or right edges
          let tooltipX = statusX
          if (tooltipX + tooltipWidth > boxWidth - 5) {
            tooltipX = boxWidth - tooltipWidth - 5
          }
          if (tooltipX < startX + 5) {
            tooltipX = startX + 5
          }
          const tooltipY = yPos - bbox.height - tooltipPadding * 2 - 5
          
          tooltipGroup.attr("transform", `translate(${tooltipX}, ${tooltipY})`)
        }
        
        // Underline the "+N more" part
        const moreMatch = item.text.match(/(\+\d+ more)/)
        if (moreMatch) {
          statusText.style("text-decoration", "underline")
            .style("text-decoration-style", "dotted")
            .style("cursor", "pointer")
        }
        
        // Show/hide tooltip on hover
        textGroup
          .on("mouseenter", () => tooltipGroup.style("visibility", "visible"))
          .on("mouseleave", () => tooltipGroup.style("visibility", "hidden"))
      }
    })

    // Skip hint text to save space
  }

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
      
      // Use idle callback for non-critical rendering
      const renderTask = () => {
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
              
              // Keep defs (for clipPaths), reference-lines-layer, and reference-labels-top-layer
              if (tagName === 'defs' || 
                  elem.classed('reference-lines-layer') || 
                  elem.classed('reference-labels-top-layer')) {
                return; // Keep these elements
              }
              
              // Remove everything else
              child.remove();
            });
          }

          // Use the pre-computed margins
          const margin = computedMargins
          
          // Debug logging
          
          const width = dimensions.width - margin.left - margin.right
          const height = dimensions.height - margin.top - margin.bottom
          
          // Set viewBox to ensure content stays within bounds
          svg.attr("viewBox", `0 0 ${deferredDimensions.width} ${deferredDimensions.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")

          // Main group with margin transform
          const mainGroup = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)

          
          if (memoizedChartData && memoizedChartData.length > 0) {
            // Use baseScalesRef for initial render, currentScalesRef for zoomed state
            // Check if we have valid current scales (they would be set after zoom)
            const hasValidCurrentScales = currentScalesRef.current.xScale !== null && currentScalesRef.current.yScale !== null
            const scalesToUse = isInitialRenderComplete.current && hasValidCurrentScales ? currentScalesRef : baseScalesRef
            
            // Store the scales we're using for rendering to ensure ReferenceLines uses the same
            // Always update renderScalesRef with the current scales being used
            if (scalesToUse.current.xScale && scalesToUse.current.yScale) {
              renderScalesRef.current = {
                xScale: scalesToUse.current.xScale,
                yScale: scalesToUse.current.yScale
              }
            }
            
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
              enableSampling: renderConfig.enableSampling,
              disableTooltips: selectionState.isSelecting || isShiftPressed || isInteracting,
              labelPositions: Object.keys(labelPositions).length > 0 ? labelPositions : undefined
            })

            // On first render, copy base scales to current scales
            if (!isInitialRenderComplete.current && baseScalesRef.current.xScale) {
              currentScalesRef.current.xScale = baseScalesRef.current.xScale
              currentScalesRef.current.yScale = baseScalesRef.current.yScale
              isInitialRenderComplete.current = true
            }
            
            // Mark scales as ready for ReferenceLines as soon as we have valid scales
            if (baseScalesRef.current.xScale && baseScalesRef.current.yScale) {
              setScalesReady(true)
              
              // Also update renderScalesRef if it's not set yet
              if (!renderScalesRef.current.xScale || !renderScalesRef.current.yScale) {
                renderScalesRef.current = {
                  xScale: baseScalesRef.current.xScale,
                  yScale: baseScalesRef.current.yScale
                }
              }
              
              // Apply pending zoom transform if any
              if (pendingZoomTransform.current) {
                // Apply pending zoom transform
                handleZoomTransform(pendingZoomTransform.current);
              }
              
              // Notify parent and context of scale updates (only when scales change)
              const xDomain = baseScalesRef.current.xScale.domain()
              const yDomain = baseScalesRef.current.yScale.domain()
              const xDomainStr = JSON.stringify(xDomain)
              const yDomainStr = JSON.stringify(yDomain)
              
              if (prevScaleDomainsRef.current.xDomain !== xDomainStr || 
                  prevScaleDomainsRef.current.yDomain !== yDomainStr) {
                prevScaleDomainsRef.current.xDomain = xDomainStr
                prevScaleDomainsRef.current.yDomain = yDomainStr
                
                const scaleData = {
                  xDomain: xDomain as [any, any],
                  yDomain: yDomain as [number, number],
                  xAxisType: mergedChart.xAxisType || "datetime"
                }
                
                if (onScalesUpdate) {
                  onScalesUpdate(scaleData)
                }
                
                if (updateScalesContext) {
                  updateScalesContext(scaleData)
                }
              }
            }
            
            // Add selection overlay if selecting or shift is pressed or in range selection mode
            if (selectionState.isSelecting || isShiftPressed || isRangeSelectionMode) {
              // Create an invisible overlay that captures all mouse events during selection
              svg.append("rect")
                .attr("class", "selection-overlay")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", deferredDimensions.width)
                .attr("height", deferredDimensions.height)
                .attr("fill", "transparent")
                .style("cursor", "crosshair")
                .style("pointer-events", "all");
              
              // Draw selection rectangle within the plot area (only if actively selecting)
              if (selectionState.isSelecting) {
                
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
              // Create a React component mounting point
              const foreignObject = mainGroup.append("foreignObject")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
              
              // Use D3 to render the NoDataDisplay component
              const container = foreignObject.append("xhtml:div")
              
              // Create SVG element for NoDataDisplay
              const noDataSvg = container.append("svg")
                .attr("width", width)
                .attr("height", height)
              
              // Render NoDataDisplay manually as SVG elements
              const noDataG = noDataSvg.append("g")
              
              // Import and render NoDataDisplay content directly
              // Since we can't use React components directly in D3, we'll recreate the display
              renderNoDataDisplay(noDataG, width, height, mergedChart, selectedDataSourceItems)
            }
            // If loading, the loading indicator in the parent component will show
          }
          
          // Store cleanup function
          cleanupRef.current = () => {
            hideAllTooltips()
            cleanupWebGLRenderer()
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
              
            })
          })
        } catch (error) {
          console.error('Error rendering chart:', error)
          renderingRef.current = false
          animationFrameRef.current = null
          unregisterRendering(editingChart.id)  // Unregister on error
        }
      }
      
      // Schedule render task with priority based on data size and interaction state
      const priority = isInteracting 
        ? IdleTaskPriority.HIGH  // High priority during interaction
        : memoizedChartData && memoizedChartData.length > 10000 
        ? IdleTaskPriority.LOW 
        : memoizedChartData && memoizedChartData.length > 1000
        ? IdleTaskPriority.NORMAL
        : IdleTaskPriority.HIGH
        
      globalIdleTaskQueue.addTask(renderTask, priority)
    }

  // Initial render and updates
  useEffect(() => {
    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && memoizedChartData?.length > 0) {
      const currentDeps = {
        chartData: memoizedChartData,
        dimensions: deferredDimensions,
        isLoadingData,
        enableSampling: renderConfig.enableSampling,
        zoomVersion,
        samplingRate: qualityRenderOptions.samplingRate,
        enableMarkers: qualityRenderOptions.enableMarkers,
        chartId: chartRenderProps.id,
        chartType: chartRenderProps.type || 'scatter',
        showMarkers: chartRenderProps.showMarkers || false,
        showLines: chartRenderProps.showLines || false,
        plotStyles: chartRenderProps.plotStyles,
        computedMargins,
        xAxisTicks: chartRenderProps.xAxisTicks,
        yAxisTicks: chartRenderProps.yAxisTicks,
        xAxisTickPrecision: chartRenderProps.xAxisTickPrecision,
        yAxisTickPrecision: chartRenderProps.yAxisTickPrecision,
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
        if (prevRenderDeps.current.xAxisTicks !== currentDeps.xAxisTicks) changes.push('xAxisTicks')
        if (prevRenderDeps.current.yAxisTicks !== currentDeps.yAxisTicks) changes.push('yAxisTicks')
        if (prevRenderDeps.current.xAxisTickPrecision !== currentDeps.xAxisTickPrecision) changes.push('xAxisTickPrecision')
        if (prevRenderDeps.current.yAxisTickPrecision !== currentDeps.yAxisTickPrecision) changes.push('yAxisTickPrecision')
        
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
    deferredDimensions, 
    isLoadingData, 
    renderConfig.enableSampling, 
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
    // Axis tick settings
    chartRenderProps.xAxisTicks,
    chartRenderProps.yAxisTicks,
    chartRenderProps.xAxisTickPrecision,
    chartRenderProps.yAxisTickPrecision,
    // margins are accessed directly from mergedChart in render function
    selectionState.isSelecting,
    selectionState.startX,
    selectionState.startY,
    selectionState.endX,
    selectionState.endY,
    isShiftPressed,
    computedMargins,
    isInteracting,
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
    xAxisTicks?: number,
    yAxisTicks?: number,
    xAxisTickPrecision?: number,
    yAxisTickPrecision?: number,
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
      // Clear any pending idle tasks for this chart
      globalIdleTaskQueue.clear()
      // Clean up WebGL renderer
      cleanupWebGLRenderer()
    }
  }, [cleanupQuality, editingChart.id, unregisterRendering])

  return (
    <ChartErrorBoundary onReset={() => recover()}>
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
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-muted-foreground">Loading data...</div>
            {chartData && chartData.length > 10000 && progress > 0 && progress < 100 && (
              <div className="w-64">
                <ProgressIndicator 
                  progress={progress} 
                  size="md" 
                  variant="gradient"
                  showPercentage={true}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Processing {chartData.length.toLocaleString()} data points
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center space-y-3">
            <div className="text-sm text-destructive">
              {error.message || 'Error loading data'}
            </div>
            <button
              onClick={() => recover()}
              className="text-sm text-primary hover:underline cursor-pointer"
            >
              再試行
            </button>
          </div>
        </div>
      )}
      <div className="relative w-full h-full overflow-hidden">
        <svg 
          ref={svgRef} 
          width={deferredDimensions.width} 
          height={deferredDimensions.height} 
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
      {!isLoadingData && scalesReady && (() => {
        // Use any available scales for reference lines
        const availableScalesRef = 
          (renderScalesRef.current.xScale && renderScalesRef.current.yScale) ? renderScalesRef :
          (currentScalesRef.current.xScale && currentScalesRef.current.yScale) ? currentScalesRef :
          (baseScalesRef.current.xScale && baseScalesRef.current.yScale) ? baseScalesRef :
          null;
        
        if (availableScalesRef) {
          return (
            <ReferenceLines
              svgRef={svgRef}
              editingChart={mergedChart}
              setEditingChart={setEditingChart}
              scalesRef={availableScalesRef}
              dimensions={deferredDimensions}
              margins={computedMargins}
              zoomVersion={zoomVersion}
            />
          );
        }
        return null;
      })()}
      {enableZoom && showZoomControls && (
        <>
          {/* Check if this is being used in ChartCard (has chartSettings) */}
          {chartSettings ? (
            // Compact mode for ChartCard - show on hover
            <div 
              className={`absolute z-10 transition-opacity duration-200 ${isMouseOver ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{ 
                bottom: '4px', 
                right: '8px' 
              }}
            >
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
                variant={renderConfig.isCompactLayout ? "ultra-compact" : "default"}
                position="static"
                orientation="horizontal"
              />
            </div>
          ) : (
            // Default mode for ChartEditModal - position above x-axis
            <div 
              className="absolute z-10"
              style={{ 
                bottom: '8px', 
                right: '16px' 
              }}
            >
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
          {(qualityState.isTransitioning && qualityState.level !== 'high' && !chartSettings) || (isInteracting && !chartSettings) && (
            <div className="absolute bottom-20 right-4 bg-yellow-500/90 text-white px-2 py-1 rounded text-xs font-medium shadow-sm backdrop-blur-sm">
              Performance mode
            </div>
          )}
        </>
      )}
      {!isLoadingData && progress > 0 && progress < 100 && memoizedChartData && memoizedChartData.length > 10000 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-white/95 p-6 rounded-lg shadow-lg backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm font-medium text-gray-700">
              Processing {memoizedChartData.length.toLocaleString()} data points
            </div>
            <div className="w-64">
              <ProgressIndicator 
                progress={progress} 
                size="md" 
                variant="gradient"
                showPercentage={true}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Using Web Worker for optimal performance
            </div>
          </div>
        </div>
      )}
    </div>
    </ChartErrorBoundary>
  )
}, chartPreviewGraphPropsAreEqual)