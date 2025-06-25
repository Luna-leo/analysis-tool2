import { useRef, useCallback, useEffect } from 'react'
import * as d3 from 'd3'

interface ScaleRefs {
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
  yScale: d3.ScaleLinear<number, number> | null
}

interface UseChartScalesProps {
  zoomMode?: 'x' | 'xy' | 'auto'
  chartType?: string
}

export const useChartScales = ({ zoomMode = 'auto', chartType = 'line' }: UseChartScalesProps) => {
  // Base scales (never modified)
  const baseScalesRef = useRef<ScaleRefs>({ xScale: null, yScale: null })
  
  // Current scales (with zoom applied)
  const currentScalesRef = useRef<ScaleRefs>({ xScale: null, yScale: null })
  
  // Scales actually used for rendering (to ensure ReferenceLines uses same scales)
  const renderScalesRef = useRef<ScaleRefs>({ xScale: null, yScale: null })
  
  // Track if initial render is complete
  const isInitialRenderComplete = useRef(false)
  
  // Track pending zoom transform
  const pendingZoomTransform = useRef<d3.ZoomTransform | null>(null)
  
  // Reset all scales
  const resetScales = useCallback(() => {
    baseScalesRef.current = { xScale: null, yScale: null }
    currentScalesRef.current = { xScale: null, yScale: null }
    renderScalesRef.current = { xScale: null, yScale: null }
    isInitialRenderComplete.current = false
    pendingZoomTransform.current = null
  }, [])
  
  // Handle zoom transformation
  const applyZoomTransform = useCallback((transform: d3.ZoomTransform) => {
    if (!baseScalesRef.current.xScale || !baseScalesRef.current.yScale) {
      pendingZoomTransform.current = transform
      return false
    }
    
    // Determine effective zoom mode
    const effectiveZoomMode = zoomMode === 'auto' 
      ? (chartType === 'scatter' ? 'xy' : 'x')
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
      pendingZoomTransform.current = null
      
      return true // Indicates scales were updated
    }
    
    return false
  }, [zoomMode, chartType])
  
  // Initialize scales after first render
  const initializeScales = useCallback(() => {
    if (!isInitialRenderComplete.current && baseScalesRef.current.xScale) {
      currentScalesRef.current.xScale = baseScalesRef.current.xScale
      currentScalesRef.current.yScale = baseScalesRef.current.yScale
      isInitialRenderComplete.current = true
      
      // Apply pending zoom transform if any
      if (pendingZoomTransform.current) {
        applyZoomTransform(pendingZoomTransform.current)
      }
      
      return true
    }
    return false
  }, [applyZoomTransform])
  
  // Get scales for rendering
  const getScalesForRendering = useCallback(() => {
    // Use baseScalesRef for initial render, currentScalesRef for zoomed state
    const hasValidCurrentScales = currentScalesRef.current.xScale !== null && currentScalesRef.current.yScale !== null
    const scalesToUse = isInitialRenderComplete.current && hasValidCurrentScales ? currentScalesRef : baseScalesRef
    
    // Store the scales we're using for rendering
    renderScalesRef.current = {
      xScale: scalesToUse.current.xScale,
      yScale: scalesToUse.current.yScale
    }
    
    return scalesToUse
  }, [])
  
  // Check if scales are ready
  const areScalesReady = useCallback(() => {
    return baseScalesRef.current.xScale !== null && baseScalesRef.current.yScale !== null
  }, [])
  
  return {
    baseScalesRef,
    currentScalesRef,
    renderScalesRef,
    resetScales,
    applyZoomTransform,
    initializeScales,
    getScalesForRendering,
    areScalesReady,
    isInitialRenderComplete: () => isInitialRenderComplete.current,
  }
}