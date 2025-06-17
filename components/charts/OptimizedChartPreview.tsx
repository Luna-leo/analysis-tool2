"use client"

import React, { useEffect, useRef, useMemo, useCallback } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo } from "@/types"
import { renderScatterPlot, ReferenceLines } from "./ChartPreview/index"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { hideAllTooltips } from "@/utils/chartTooltip"
import { useFrameBudget } from "@/utils/performanceOptimizations"
import { useSettingsStore } from "@/stores/useSettingsStore"

interface OptimizedChartPreviewProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
  maxDataPoints?: number
  priority?: 'high' | 'low'
}

export const OptimizedChartPreview = React.memo(({ 
  editingChart, 
  selectedDataSourceItems, 
  setEditingChart, 
  maxDataPoints,
  priority = 'low'
}: OptimizedChartPreviewProps) => {
  const { settings } = useSettingsStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderingRef = useRef<boolean>(false)
  const [dimensions, setDimensions] = React.useState({ width: 400, height: 300 })
  const { canRender, checkFrameBudget } = useFrameBudget(priority === 'high' ? 60 : 30)
  
  const effectiveMaxDataPoints = maxDataPoints ?? (
    settings.performanceSettings.dataProcessing.enableSampling 
      ? settings.performanceSettings.dataProcessing.defaultSamplingPoints
      : Number.MAX_SAFE_INTEGER
  )
  
  // Store scales in refs to avoid recreation during drag
  const scalesRef = useRef<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null,
    yScale: d3.ScaleLinear<number, number> | null
  }>({ xScale: null, yScale: null })
  
  // Use optimized data loading hook
  const { data: chartData, isLoading: isLoadingData, error } = useOptimizedChart({
    editingChart,
    selectedDataSourceItems,
    maxDataPoints: effectiveMaxDataPoints
  })

  // Intersection observer for lazy rendering
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasBeenVisible, setHasBeenVisible] = React.useState(false)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting
        setIsVisible(isIntersecting)
        if (isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true)
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    )
    
    observer.observe(containerRef.current)
    
    return () => {
      observer.disconnect()
    }
  }, [hasBeenVisible])

  // Optimized resize handler
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!checkFrameBudget()) return
      
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ 
          width: Math.max(300, width), 
          height: Math.max(250, height - 20)
        })
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [checkFrameBudget])

  // Render chart with optimizations
  const renderChart = useCallback(() => {
    if (!svgRef.current || !hasBeenVisible || isLoadingData || renderingRef.current || !canRender) return
    
    renderingRef.current = true
    
    // Use requestIdleCallback for low priority charts
    const renderFunc = () => {
      if (!svgRef.current) {
        renderingRef.current = false
        return
      }

      const svg = d3.select(svgRef.current)
      
      // Clear previous content
      svg.selectAll(".main-chart-group").remove()

      const margin = { top: 20, right: 40, bottom: 60, left: 60 }
      const width = dimensions.width - margin.left - margin.right
      const height = dimensions.height - margin.top - margin.bottom

      const g = svg.append("g")
        .attr("class", "main-chart-group")
        .attr("transform", `translate(${margin.left},${margin.top})`)
      
      if (chartData.length > 0) {
        // Use canvas for large datasets
        if (chartData.length > settings.performanceSettings.rendering.canvasThreshold && containerRef.current) {
          // Create or reuse canvas
          if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas')
            canvasRef.current.style.position = 'absolute'
            canvasRef.current.style.pointerEvents = 'none'
            containerRef.current.appendChild(canvasRef.current)
          }
          
          // Position canvas
          canvasRef.current.style.left = `${margin.left}px`
          canvasRef.current.style.top = `${margin.top}px`
          canvasRef.current.width = width
          canvasRef.current.height = height
        }
        
        renderScatterPlot({ 
          g, 
          data: chartData, 
          width, 
          height, 
          editingChart, 
          scalesRef,
          enableSampling: settings.performanceSettings.dataProcessing.enableSampling
        })
      }
      
      renderingRef.current = false
    }
    
    if (priority === 'high' || !('requestIdleCallback' in window)) {
      requestAnimationFrame(renderFunc)
    } else {
      requestIdleCallback(renderFunc, { timeout: 100 })
    }
  }, [chartData, dimensions, isLoadingData, hasBeenVisible, editingChart, canRender, priority])

  useEffect(() => {
    renderChart()
  }, [renderChart])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      hideAllTooltips()
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current)
      }
    }
  }, [])

  // Memoize loading state
  const loadingContent = useMemo(() => (
    isLoadingData ? (
      <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
        <div className="text-sm text-muted-foreground">Loading data...</div>
      </div>
    ) : null
  ), [isLoadingData])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative overflow-hidden chart-container"
    >
      {loadingContent}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-sm text-destructive">Error loading data</div>
        </div>
      )}
      <svg 
        ref={svgRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        className="w-full h-full" 
        style={{ 
          visibility: isLoadingData ? 'hidden' : 'visible',
          opacity: isVisible ? 1 : 0.1 
        }} 
      />
      {!isLoadingData && hasBeenVisible && (
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
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  const { settings: prevSettings } = useSettingsStore.getState()
  const { settings: nextSettings } = useSettingsStore.getState()
  
  const prevEffectiveMaxDataPoints = prevProps.maxDataPoints ?? (
    prevSettings.performanceSettings.dataProcessing.enableSampling 
      ? prevSettings.performanceSettings.dataProcessing.defaultSamplingPoints
      : Number.MAX_SAFE_INTEGER
  )
  const nextEffectiveMaxDataPoints = nextProps.maxDataPoints ?? (
    nextSettings.performanceSettings.dataProcessing.enableSampling 
      ? nextSettings.performanceSettings.dataProcessing.defaultSamplingPoints
      : Number.MAX_SAFE_INTEGER
  )
  
  return (
    prevProps.editingChart.id === nextProps.editingChart.id &&
    prevProps.editingChart.title === nextProps.editingChart.title &&
    prevProps.editingChart.xParameter === nextProps.editingChart.xParameter &&
    prevProps.editingChart.yAxisParams === nextProps.editingChart.yAxisParams &&
    prevProps.selectedDataSourceItems.length === nextProps.selectedDataSourceItems.length &&
    prevEffectiveMaxDataPoints === nextEffectiveMaxDataPoints
  )
})