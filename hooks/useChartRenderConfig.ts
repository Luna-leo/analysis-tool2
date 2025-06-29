import { useMemo, useRef } from 'react'
import { ChartComponent } from '@/types'

interface RenderConfig {
  // Chart properties
  chartId: string
  chartType: string
  xAxisType: string
  xParameter?: string
  yAxisParams: any[]
  
  // Display settings
  showLegend: boolean
  showTitle: boolean
  showXAxis: boolean
  showYAxis: boolean
  showGrid: boolean
  showMarkers: boolean
  
  // Axis labels
  xLabel?: string
  yLabel?: string
  
  // Tick settings
  xAxisTicks?: number
  yAxisTicks?: number
  xAxisTickPrecision?: number
  yAxisTickPrecision?: number
  
  // Layout settings
  marginMode: string
  margins?: any
  isCompactLayout: boolean
  gridLayout?: any
  
  // Reference lines
  referenceLines?: any[]
  
  // Data processing
  maxDataPoints: number
  enableSampling: boolean
  
  // Rendering options
  enableAnimation: boolean
  enableZoom: boolean
  enablePan: boolean
  zoomMode: string
  showZoomControls: boolean
}

/**
 * Custom hook to consolidate chart render configuration
 * This helps prevent unnecessary re-renders by creating stable references
 */
export function useChartRenderConfig(
  chart: ChartComponent,
  options: {
    maxDataPoints?: number
    enableSampling?: boolean
    isCompactLayout?: boolean
    gridLayout?: any
    enableZoom?: boolean
    enablePan?: boolean
    zoomMode?: string
    showZoomControls?: boolean
  } = {}
): RenderConfig {
  // Use ref to track previous values and detect actual changes
  const prevConfigRef = useRef<RenderConfig | null>(null)
  
  // Create configuration object
  const config = useMemo(() => {
    const newConfig: RenderConfig = {
      // Chart properties
      chartId: chart.id,
      chartType: chart.type || 'scatter',
      xAxisType: chart.xAxisType || 'datetime',
      xParameter: chart.xParameter,
      yAxisParams: chart.yAxisParams || [],
      
      // Display settings
      showLegend: chart.showLegend ?? true,
      showTitle: chart.showTitle ?? true,
      showXAxis: chart.showXAxis ?? true,
      showYAxis: chart.showYAxis ?? true,
      showGrid: chart.showGrid ?? true,
      showMarkers: chart.showMarkers ?? false,
      
      // Axis labels
      xLabel: chart.xLabel,
      yLabel: chart.yLabel,
      
      // Tick settings
      xAxisTicks: chart.xAxisTicks,
      yAxisTicks: chart.yAxisTicks,
      xAxisTickPrecision: chart.xAxisTickPrecision,
      yAxisTickPrecision: chart.yAxisTickPrecision,
      
      // Layout settings
      marginMode: 'auto',  // Default margin mode since it's not on ChartComponent
      margins: chart.margins,
      isCompactLayout: options.isCompactLayout ?? false,
      gridLayout: options.gridLayout,
      
      // Reference lines
      referenceLines: chart.referenceLines,
      
      // Data processing
      maxDataPoints: options.maxDataPoints ?? 300,
      enableSampling: options.enableSampling ?? true,
      
      // Rendering options
      enableAnimation: false,  // Default to false since it's not on ChartComponent
      enableZoom: options.enableZoom ?? true,
      enablePan: options.enablePan ?? true,
      zoomMode: options.zoomMode ?? 'auto',
      showZoomControls: options.showZoomControls ?? true
    }
    
    // Check if config actually changed by comparing values
    if (prevConfigRef.current) {
      const hasChanged = !areConfigsEqual(prevConfigRef.current, newConfig)
      if (!hasChanged) {
        return prevConfigRef.current
      }
    }
    
    prevConfigRef.current = newConfig
    return newConfig
  }, [
    chart.id,
    chart.type,
    chart.xAxisType,
    chart.xParameter,
    chart.yAxisParams,
    chart.showLegend,
    chart.showTitle,
    chart.showXAxis,
    chart.showYAxis,
    chart.showGrid,
    chart.showMarkers,
    chart.xLabel,
    chart.yLabel,
    chart.xAxisTicks,
    chart.yAxisTicks,
    chart.xAxisTickPrecision,
    chart.yAxisTickPrecision,
    chart.margins,
    chart.referenceLines,
    options.maxDataPoints,
    options.enableSampling,
    options.isCompactLayout,
    options.gridLayout,
    options.enableZoom,
    options.enablePan,
    options.zoomMode,
    options.showZoomControls
  ])
  
  return config
}

/**
 * Deep equality check for render configs
 */
function areConfigsEqual(a: RenderConfig, b: RenderConfig): boolean {
  // Check primitive values
  if (
    a.chartId !== b.chartId ||
    a.chartType !== b.chartType ||
    a.xAxisType !== b.xAxisType ||
    a.xParameter !== b.xParameter ||
    a.showLegend !== b.showLegend ||
    a.showTitle !== b.showTitle ||
    a.showXAxis !== b.showXAxis ||
    a.showYAxis !== b.showYAxis ||
    a.showGrid !== b.showGrid ||
    a.showMarkers !== b.showMarkers ||
    a.xLabel !== b.xLabel ||
    a.yLabel !== b.yLabel ||
    a.xAxisTicks !== b.xAxisTicks ||
    a.yAxisTicks !== b.yAxisTicks ||
    a.xAxisTickPrecision !== b.xAxisTickPrecision ||
    a.yAxisTickPrecision !== b.yAxisTickPrecision ||
    a.marginMode !== b.marginMode ||
    a.maxDataPoints !== b.maxDataPoints ||
    a.enableSampling !== b.enableSampling ||
    a.enableAnimation !== b.enableAnimation ||
    a.isCompactLayout !== b.isCompactLayout ||
    a.enableZoom !== b.enableZoom ||
    a.enablePan !== b.enablePan ||
    a.zoomMode !== b.zoomMode ||
    a.showZoomControls !== b.showZoomControls
  ) {
    return false
  }
  
  // Check array lengths
  if (a.yAxisParams?.length !== b.yAxisParams?.length) {
    return false
  }
  
  // Check yAxisParams content
  if (a.yAxisParams && b.yAxisParams) {
    for (let i = 0; i < a.yAxisParams.length; i++) {
      if (
        a.yAxisParams[i].parameter !== b.yAxisParams[i].parameter ||
        a.yAxisParams[i].parameterType !== b.yAxisParams[i].parameterType
      ) {
        return false
      }
    }
  }
  
  // Check reference lines
  if (a.referenceLines?.length !== b.referenceLines?.length) {
    return false
  }
  
  // For complex objects, use JSON comparison as fallback
  if (JSON.stringify(a.margins) !== JSON.stringify(b.margins)) {
    return false
  }
  
  if (JSON.stringify(a.gridLayout) !== JSON.stringify(b.gridLayout)) {
    return false
  }
  
  return true
}