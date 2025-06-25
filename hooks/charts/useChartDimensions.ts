import { useState, useEffect, useRef, RefObject } from 'react'
import { useThrottle } from '@/hooks/useDebounce'

interface Dimensions {
  width: number
  height: number
}

interface UseChartDimensionsProps {
  containerRef: RefObject<HTMLDivElement>
  gridLayout?: { columns: number; rows: number }
  calculateAspectRatio: (containerHeight: number, gridLayout?: { columns: number; rows: number }) => number
}

export const useChartDimensions = ({
  containerRef,
  gridLayout,
  calculateAspectRatio
}: UseChartDimensionsProps) => {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 600, height: 400 })
  const prevDimensionsRef = useRef<Dimensions | null>(null)
  
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
  }, [handleResize, gridLayout, calculateAspectRatio, containerRef])
  
  // Track dimension changes
  const hasDimensionsChanged = () => {
    if (!prevDimensionsRef.current) {
      prevDimensionsRef.current = dimensions
      return false
    }
    
    const prevDims = prevDimensionsRef.current
    const changed = prevDims.width !== dimensions.width || prevDims.height !== dimensions.height
    
    if (changed) {
      prevDimensionsRef.current = dimensions
    }
    
    return changed
  }
  
  return {
    dimensions,
    prevDimensionsRef,
    hasDimensionsChanged
  }
}