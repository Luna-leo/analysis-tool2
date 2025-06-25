import { useMemo } from 'react'
import { ChartComponent } from '@/types'
import { 
  calculateMarginInPixels, 
  calculateUnifiedMargins,
  DEFAULT_UNIFIED_MARGIN_CONFIG,
  MarginValue
} from '@/utils/chart/marginCalculator'

interface UseChartLayoutProps {
  chart: ChartComponent
  dimensions: { width: number; height: number }
  gridLayout?: { columns: number; rows: number }
  chartSettings?: {
    margins?: {
      top: string | number
      right: string | number
      bottom: string | number
      left: string | number
    }
    marginMode?: 'auto' | 'manual' | 'percentage' | 'fixed' | 'adaptive' | 'unified'
  }
}

export const useChartLayout = ({
  chart,
  dimensions,
  gridLayout,
  chartSettings
}: UseChartLayoutProps) => {
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
        console.log('[useChartLayout] Using grid-wide margins from chartSettings:', margin)
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
        console.log('[useChartLayout] Computed 4x4 margins:', {
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
      const hasPercentageMargins = chart.margins && 
        typeof chart.margins.top === 'string' && 
        (chart.margins.top as string).endsWith('%')
      
      if ((chartSettings?.marginMode === 'unified' || chartSettings?.marginMode === 'percentage' || hasPercentageMargins) && gridLayout) {
        // Use the new unified margin calculation with grid layout info
        margin = calculateUnifiedMargins(dimensions.width, dimensions.height, DEFAULT_UNIFIED_MARGIN_CONFIG, gridLayout)
      } else if (hasPercentageMargins && chart.margins) {
        // Convert percentage margins to pixels (for cases without gridLayout)
        margin = {
          top: calculateMarginInPixels(chart.margins.top as MarginValue, dimensions.height),
          right: calculateMarginInPixels(chart.margins.right as MarginValue, dimensions.width),
          bottom: calculateMarginInPixels(chart.margins.bottom as MarginValue, dimensions.height),
          left: calculateMarginInPixels(chart.margins.left as MarginValue, dimensions.width)
        }
      } else if (chart.margins) {
        // Fall back to existing margins if not using unified mode
        margin = chart.margins as { top: number; right: number; bottom: number; left: number }
      }
    }
    
    return margin
  }, [dimensions, gridLayout, chart.margins, chartSettings?.marginMode, chartSettings?.margins])
  
  // Calculate chart area dimensions
  const chartArea = useMemo(() => {
    return {
      width: dimensions.width - computedMargins.left - computedMargins.right,
      height: dimensions.height - computedMargins.top - computedMargins.bottom
    }
  }, [dimensions, computedMargins])
  
  // Calculate aspect ratio for layout
  const calculateAspectRatio = (containerHeight: number, currentGridLayout?: { columns: number; rows: number }) => {
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
  }
  
  return {
    computedMargins,
    chartArea,
    calculateAspectRatio
  }
}