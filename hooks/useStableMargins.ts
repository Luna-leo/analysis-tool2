import { useRef, useMemo, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { 
  calculateUnifiedMargins,
  DEFAULT_UNIFIED_MARGIN_CONFIG,
  MarginValue
} from '@/utils/chart/marginCalculator'

interface UseStableMarginsOptions {
  showXAxis: boolean
  showYAxis: boolean
  showTitle: boolean
  showLegend: boolean
  showXLabel: boolean
  showYLabel: boolean
  xAxisTicks?: number
  yAxisTicks?: number
  xAxisTickPrecision?: number
  yAxisTickPrecision?: number
  isCompactLayout?: boolean
  marginMode?: string
  margins?: {
    top: MarginValue
    right: MarginValue
    bottom: MarginValue
    left: MarginValue
  }
  debounceMs?: number
}

interface StableMargins {
  margin: {
    top: number
    right: number
    bottom: number
    left: number
  }
  updateMargins: (width: number, height: number) => void
  isCalculating: boolean
}

/**
 * Hook for stable margin calculations with debouncing
 * Prevents jerky margin updates during rapid dimension changes
 */
export function useStableMargins(options: UseStableMarginsOptions): StableMargins {
  const {
    showXAxis,
    showYAxis,
    showTitle,
    showLegend,
    showXLabel,
    showYLabel,
    xAxisTicks,
    yAxisTicks,
    xAxisTickPrecision,
    yAxisTickPrecision,
    isCompactLayout = false,
    marginMode = 'unified',
    margins,
    debounceMs = 150
  } = options
  
  // Use refs to store current values without triggering re-renders
  const currentMarginsRef = useRef({
    top: 20,   // Default values
    right: 40,
    bottom: 60,
    left: 60
  })
  
  const isCalculatingRef = useRef(false)
  const dimensionsRef = useRef({ width: 0, height: 0 })
  
  // Create stable reference for margin calculation inputs
  const marginInputs = useMemo(() => ({
    showXAxis,
    showYAxis,
    showTitle,
    showLegend,
    showXLabel,
    showYLabel,
    xAxisTicks,
    yAxisTicks,
    xAxisTickPrecision,
    yAxisTickPrecision,
    isCompactLayout,
    marginMode,
    margins
  }), [
    showXAxis,
    showYAxis,
    showTitle,
    showLegend,
    showXLabel,
    showYLabel,
    xAxisTicks,
    yAxisTicks,
    xAxisTickPrecision,
    yAxisTickPrecision,
    isCompactLayout,
    marginMode,
    margins
  ])
  
  // Calculate margins with dimension info
  const calculateMargins = useCallback((width: number, height: number) => {
    if (marginMode === 'unified') {
      return calculateUnifiedMargins(
        width,
        height,
        DEFAULT_UNIFIED_MARGIN_CONFIG,
        marginInputs.isCompactLayout ? { columns: 2, rows: 2 } : undefined
      )
    } else if (marginInputs.margins) {
      // Convert margin values to pixels
      return {
        top: convertToPixels(marginInputs.margins.top, height),
        right: convertToPixels(marginInputs.margins.right, width),
        bottom: convertToPixels(marginInputs.margins.bottom, height),
        left: convertToPixels(marginInputs.margins.left, width)
      }
    } else {
      return currentMarginsRef.current
    }
  }, [marginMode, marginInputs])
  
  // Debounced margin update function
  const debouncedUpdateMargins = useDebouncedCallback(
    (width: number, height: number) => {
      const newMargins = calculateMargins(width, height)
      
      // Only update if margins actually changed significantly
      if (
        Math.abs(newMargins.top - currentMarginsRef.current.top) > 1 ||
        Math.abs(newMargins.right - currentMarginsRef.current.right) > 1 ||
        Math.abs(newMargins.bottom - currentMarginsRef.current.bottom) > 1 ||
        Math.abs(newMargins.left - currentMarginsRef.current.left) > 1
      ) {
        currentMarginsRef.current = newMargins
      }
      
      isCalculatingRef.current = false
    },
    debounceMs
  )
  
  // Update margins callback
  const updateMargins = useCallback((width: number, height: number) => {
    // Skip if dimensions haven't changed significantly
    if (
      Math.abs(width - dimensionsRef.current.width) < 1 &&
      Math.abs(height - dimensionsRef.current.height) < 1
    ) {
      return
    }
    
    dimensionsRef.current = { width, height }
    isCalculatingRef.current = true
    debouncedUpdateMargins(width, height)
  }, [debouncedUpdateMargins])
  
  // Return stable margin object
  return {
    margin: currentMarginsRef.current,
    updateMargins,
    isCalculating: isCalculatingRef.current
  }
}

/**
 * Convert margin value to pixels
 */
function convertToPixels(value: MarginValue, dimension: number): number {
  if (typeof value === 'number') {
    return value
  }
  
  if (typeof value === 'string' && value.endsWith('%')) {
    const percentage = parseFloat(value) / 100
    return dimension * percentage
  }
  
  return 0
}