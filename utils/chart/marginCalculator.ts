import { LayoutContext, LayoutCategory } from '@/types/chart-types'

/**
 * Margin value type - can be number (px) or string (percentage)
 */
export type MarginValue = number | string

/**
 * Margin configuration with support for px and percentage values
 */
export interface MarginConfig {
  top: MarginValue
  right: MarginValue
  bottom: MarginValue
  left: MarginValue
}

/**
 * Unified margin configuration for consistent layout across all grid sizes
 */
export interface UnifiedMarginConfig {
  // Base ratios (percentage of container dimensions)
  baseRatios: {
    top: number    // 0.08 (8%)
    right: number  // 0.05 (5%)
    bottom: number // 0.12 (12%)
    left: number   // 0.10 (10%)
  }
  
  // Content-based minimums (pixels)
  contentMinimums: {
    top: number    // For title: 20px
    right: number  // Right padding: 15px
    bottom: number // For X-axis label: 35px
    left: number   // For Y-axis label: 45px
  }
  
  // Absolute maximums (pixels)
  absoluteMaximums: {
    top: number    // 60px
    right: number  // 60px
    bottom: number // 80px
    left: number   // 80px
  }
}

/**
 * Default unified margin configuration
 */
export const DEFAULT_UNIFIED_MARGIN_CONFIG: UnifiedMarginConfig = {
  baseRatios: {
    top: 0.08,
    right: 0.05,
    bottom: 0.12,
    left: 0.10      // Default for large layouts (will be adjusted per layout category)
  },
  contentMinimums: {
    top: 20,
    right: 15,
    bottom: 35,
    left: 45        // Default minimum (will be adjusted per layout category)
  },
  absoluteMaximums: {
    top: 60,
    right: 60,
    bottom: 80,
    left: 80        // Default maximum (will be adjusted per layout category)
  }
}

/**
 * Unified label offsets for consistent positioning
 */
export const UNIFIED_LABEL_OFFSETS = {
  x: 30,  // X-axis label offset from axis
  y: 40,  // Y-axis label offset from axis - increased from 35 for better spacing
  // Dynamic X offset based on layout
  getXOffset: (gridLayout?: { columns: number; rows: number }) => {
    if (gridLayout && gridLayout.columns >= 4 && gridLayout.rows >= 4) {
      return 25; // Reduced for 4x4 layouts
    }
    if (gridLayout && (gridLayout.columns >= 3 || gridLayout.rows >= 3)) {
      return 28; // Slightly reduced for 3x3
    }
    return 30; // Default
  }
}

/**
 * Get layout density category for margin adjustments
 */
function getLayoutDensityCategory(columns: number, rows: number): 'large' | 'medium' | 'small' | 'ultra-small' {
  const totalCells = columns * rows;
  
  if (totalCells <= 4) return 'large';      // 1x1, 1x2, 2x1, 2x2
  if (totalCells <= 6) return 'medium';     // 2x3, 3x2
  if (totalCells <= 9) return 'small';      // 3x3
  return 'ultra-small';                      // 3x4, 4x3, 4x4+
}

/**
 * Layout-specific margin configurations
 */
const LAYOUT_MARGIN_CONFIGS: Record<string, { baseRatios?: Partial<UnifiedMarginConfig['baseRatios']>, contentMinimums?: Partial<UnifiedMarginConfig['contentMinimums']>, absoluteMaximums?: Partial<UnifiedMarginConfig['absoluteMaximums']> }> = {
  'large': {
    baseRatios: { left: 0.10 },           // Reduced for larger layouts
    contentMinimums: { left: 45 },        // Standard minimum
    absoluteMaximums: { left: 80 }        // Standard maximum
  },
  'medium': {
    baseRatios: { left: 0.11 },           // Slightly increased
    contentMinimums: { left: 50 },        // Increased minimum
    absoluteMaximums: { left: 90 }        // Increased maximum
  },
  'small': {
    baseRatios: { left: 0.12 },           // More space for 3x3
    contentMinimums: { left: 55 },        // Higher minimum for Y-axis labels
    absoluteMaximums: { left: 100 }       // Higher maximum
  },
  'ultra-small': {
    baseRatios: { left: 0.10 },           // Balanced for space constraints
    contentMinimums: { left: 45 },        // Moderate minimum
    absoluteMaximums: { left: 70 }        // Limited maximum
  }
}

/**
 * Calculate unified margins based on container dimensions
 * This is the main function for the new margin system
 */
export const calculateUnifiedMargins = (
  containerWidth: number,
  containerHeight: number,
  config: UnifiedMarginConfig = DEFAULT_UNIFIED_MARGIN_CONFIG,
  gridLayout?: { columns: number; rows: number }
): { top: number; right: number; bottom: number; left: number } => {
  // Start with base config
  let adjustedConfig = config
  
  // Apply layout-specific adjustments
  if (gridLayout) {
    const category = getLayoutDensityCategory(gridLayout.columns, gridLayout.rows);
    const layoutConfig = LAYOUT_MARGIN_CONFIGS[category];
    
    // Merge layout-specific config with base config
    adjustedConfig = {
      baseRatios: {
        ...config.baseRatios,
        ...(layoutConfig.baseRatios || {})
      },
      contentMinimums: {
        ...config.contentMinimums,
        ...(layoutConfig.contentMinimums || {})
      },
      absoluteMaximums: {
        ...config.absoluteMaximums,
        ...(layoutConfig.absoluteMaximums || {})
      }
    };
    
    // Additional adjustments for specific layouts
    if (category === 'ultra-small') {
      // Further reduce other margins for ultra-small layouts
      adjustedConfig.baseRatios.top = 0.06;
      adjustedConfig.baseRatios.right = 0.04;
      adjustedConfig.baseRatios.bottom = 0.08;    // Reduced from 0.10 to minimize bottom margin
      adjustedConfig.contentMinimums.top = 15;
      adjustedConfig.contentMinimums.right = 10;
      adjustedConfig.contentMinimums.bottom = 20;  // Reduced from 25 for tighter spacing
      adjustedConfig.absoluteMaximums.top = 40;
      adjustedConfig.absoluteMaximums.right = 40;
      adjustedConfig.absoluteMaximums.bottom = 50; // Reduced from 60 for less bottom space
    }
    
    // Special handling for 4-column layouts to prevent Y-axis label overlap
    if (gridLayout.columns >= 4) {
      // Override left margin for 4+ column layouts
      if (gridLayout.rows === 1) {
        // 1x4: Moderate increase
        adjustedConfig.baseRatios.left = 0.12;
        adjustedConfig.contentMinimums.left = 55;
        adjustedConfig.absoluteMaximums.left = 95;
      } else {
        // 2x4, 3x4, 4x4: Larger increase for denser layouts
        adjustedConfig.baseRatios.left = 0.13;
        adjustedConfig.contentMinimums.left = 60;
        adjustedConfig.absoluteMaximums.left = 110;
      }
    }
  }
  
  return {
    top: Math.min(
      adjustedConfig.absoluteMaximums.top,
      Math.max(
        adjustedConfig.contentMinimums.top,
        Math.round(containerHeight * adjustedConfig.baseRatios.top)
      )
    ),
    right: Math.min(
      adjustedConfig.absoluteMaximums.right,
      Math.max(
        adjustedConfig.contentMinimums.right,
        Math.round(containerWidth * adjustedConfig.baseRatios.right)
      )
    ),
    bottom: Math.min(
      adjustedConfig.absoluteMaximums.bottom,
      Math.max(
        adjustedConfig.contentMinimums.bottom,
        Math.round(containerHeight * adjustedConfig.baseRatios.bottom)
      )
    ),
    left: Math.min(
      adjustedConfig.absoluteMaximums.left,
      Math.max(
        adjustedConfig.contentMinimums.left,
        Math.round(containerWidth * adjustedConfig.baseRatios.left)
      )
    )
  }
}

/**
 * Get layout size category (legacy - kept for backward compatibility)
 * @deprecated Use calculateUnifiedMargins instead
 */
const getLayoutCategory = (columns: number, rows: number): 'small' | 'medium' | 'large' => {
  const totalCells = columns * rows
  if (totalCells >= 9) return 'small'   // 3x3, 3x4, 4x3, 4x4, etc.
  if (totalCells >= 4) return 'medium'  // 2x2, 2x3, 3x2, etc.
  return 'large'                         // 1x1, 1x2, 2x1, 1x3, 3x1
}

/**
 * Unified layout category determination
 * Considers both grid size and container dimensions for accurate categorization
 */
export const getUnifiedLayoutCategory = (context: LayoutContext): LayoutCategory => {
  const { gridSize, containerSize } = context
  const cellCount = gridSize.columns * gridSize.rows
  
  // Calculate average cell size
  const avgCellWidth = containerSize.width / gridSize.columns
  const avgCellHeight = containerSize.height / gridSize.rows
  const avgCellSize = Math.min(avgCellWidth, avgCellHeight)
  
  // Hybrid determination: consider both cell count and size
  // Small: high density layouts or small cells
  if (cellCount >= 9 || avgCellSize < 150) {
    return 'small'
  }
  
  // Medium: moderate density or medium cells
  if (cellCount >= 4 || avgCellSize < 250) {
    return 'medium'
  }
  
  // Large: low density layouts with large cells
  return 'large'
}

/**
 * Create layout context from grid and container information
 */
export const createLayoutContext = (
  columns: number,
  rows: number,
  containerWidth: number,
  containerHeight: number
): LayoutContext => {
  return {
    gridSize: { columns, rows },
    containerSize: { width: containerWidth, height: containerHeight }
  }
}

/**
 * Grid size specific margin presets (percentage based)
 */
const GRID_MARGIN_PERCENTAGE_PRESETS: Record<string, MarginConfig> = {
  // Large layouts - generous margins
  '1x1': { bottom: '20%', left: '20%', top: '10%', right: '10%' },
  '1x2': { bottom: '18%', left: '18%', top: '9%', right: '9%' },
  '1x3': { bottom: '16%', left: '16%', top: '8%', right: '8%' },
  '1x4': { bottom: '15%', left: '15%', top: '8%', right: '8%' },
  '2x1': { bottom: '18%', left: '18%', top: '9%', right: '9%' },
  
  // Medium layouts - balanced margins
  '2x2': { bottom: '15%', left: '15%', top: '8%', right: '8%' },
  '2x3': { bottom: '14%', left: '14%', top: '7%', right: '7%' },
  '2x4': { bottom: '13%', left: '13%', top: '7%', right: '7%' },
  '3x1': { bottom: '15%', left: '15%', top: '8%', right: '8%' },
  '3x2': { bottom: '14%', left: '14%', top: '7%', right: '7%' },
  
  // Small layouts - progressive reduction for better space utilization
  '3x3': { bottom: '10%', left: '8%', top: '5%', right: '4%' },
  '3x4': { bottom: '9%', left: '7%', top: '4%', right: '3%' },
  '4x1': { bottom: '10%', left: '8%', top: '5%', right: '4%' },
  '4x2': { bottom: '8%', left: '7%', top: '4%', right: '3%' },
  '4x3': { bottom: '7%', left: '6%', top: '4%', right: '3%' },
  '4x4': { bottom: '9%', left: '6%', top: '6%', right: '3%' },  // Balanced margins for all sides
  
  // Default for larger grids
  'default': { bottom: '10%', left: '10%', top: '5%', right: '5%' }
}

/**
 * Grid size specific margin presets (legacy px based)
 */
const GRID_MARGIN_PRESETS: Record<string, { bottom: number; left: number; top: number; right: number }> = {
  // Large layouts - generous margins
  '1x1': { bottom: 70, left: 75, top: 30, right: 40 },
  '1x2': { bottom: 65, left: 72, top: 28, right: 38 },
  '1x3': { bottom: 60, left: 70, top: 25, right: 35 },
  '1x4': { bottom: 55, left: 68, top: 25, right: 35 },
  '2x1': { bottom: 65, left: 72, top: 28, right: 38 },
  
  // Medium layouts - balanced margins
  '2x2': { bottom: 40, left: 55, top: 25, right: 30 },
  '2x3': { bottom: 38, left: 52, top: 23, right: 28 },
  '2x4': { bottom: 36, left: 50, top: 22, right: 27 },
  '3x1': { bottom: 45, left: 58, top: 25, right: 35 },
  '3x2': { bottom: 38, left: 52, top: 23, right: 28 },
  
  // Small layouts - compact margins (increased left margin for Y-axis labels)
  '3x3': { bottom: 35, left: 45, top: 20, right: 20 },
  '3x4': { bottom: 32, left: 42, top: 18, right: 18 },
  '4x1': { bottom: 40, left: 50, top: 22, right: 25 },
  '4x2': { bottom: 36, left: 48, top: 20, right: 22 },
  '4x3': { bottom: 32, left: 42, top: 18, right: 18 },
  '4x4': { bottom: 30, left: 40, top: 15, right: 15 },
  
  // Default for larger grids
  'default': { bottom: 40, left: 50, top: 15, right: 20 }
}


/**
 * Grid size specific label offset presets
 */
const GRID_LABEL_OFFSET_PRESETS: Record<string, { xOffset: number; yOffset: number }> = {
  // Large layouts
  '1x1': { xOffset: 40, yOffset: 50 },
  '1x2': { xOffset: 38, yOffset: 48 },
  '1x3': { xOffset: 35, yOffset: 45 },
  '1x4': { xOffset: 35, yOffset: 45 },
  '2x1': { xOffset: 38, yOffset: 48 },
  
  // Medium layouts
  '2x2': { xOffset: 32, yOffset: 42 },
  '2x3': { xOffset: 30, yOffset: 40 },
  '2x4': { xOffset: 28, yOffset: 38 },
  '3x1': { xOffset: 35, yOffset: 45 },
  '3x2': { xOffset: 30, yOffset: 40 },
  
  // Small layouts
  '3x3': { xOffset: 25, yOffset: 35 },
  '3x4': { xOffset: 22, yOffset: 32 },
  '4x1': { xOffset: 30, yOffset: 42 },
  '4x2': { xOffset: 28, yOffset: 38 },
  '4x3': { xOffset: 22, yOffset: 32 },
  '4x4': { xOffset: 20, yOffset: 30 },
  
  // Default for larger grids
  'default': { xOffset: 20, yOffset: 30 }
}

/**
 * Get label offsets based on grid layout
 */
export const getLayoutLabelOffsets = (
  columns: number,
  rows: number
) => {
  // Get preset offsets based on grid size
  const layoutKey = getLayoutKey(columns, rows)
  const preset = GRID_LABEL_OFFSET_PRESETS[layoutKey] || GRID_LABEL_OFFSET_PRESETS['default']
  
  return {
    xLabelOffset: preset.xOffset,
    yLabelOffset: preset.yOffset
  }
}

/**
 * Get percentage-based margins for layout
 */
export const getLayoutMarginsPercentage = (
  columns: number,
  rows: number
): MarginConfig => {
  const layoutKey = getLayoutKey(columns, rows)
  const preset = GRID_MARGIN_PERCENTAGE_PRESETS[layoutKey] || GRID_MARGIN_PERCENTAGE_PRESETS['default']
  return preset
}

/**
 * Get margins based on grid layout and ensure enough space for axis labels
 * @deprecated Use getLayoutMarginsPercentage for new implementations
 */
export const getLayoutMargins = (
  columns: number,
  rows: number
) => {
  const layoutKey = getLayoutKey(columns, rows)
  const preset = GRID_MARGIN_PRESETS[layoutKey] || GRID_MARGIN_PRESETS['default']
  const offsets = getLayoutLabelOffsets(columns, rows)
  const category = getLayoutCategory(columns, rows)

  // Dynamic safety margin based on layout size
  const safetyMargin = category === 'small' ? 3 : category === 'medium' ? 5 : 8
  
  // Dynamic label padding based on layout size
  const labelPadding = category === 'small' ? 5 : category === 'medium' ? 10 : 15
  
  return {
    top: preset.top + safetyMargin,
    right: preset.right + safetyMargin,
    bottom: Math.max(preset.bottom, offsets.xLabelOffset + labelPadding) + safetyMargin,
    left: Math.max(preset.left, offsets.yLabelOffset + labelPadding) + safetyMargin
  }
}

/**
 * Get layout key for storing/retrieving overrides
 */
export const getLayoutKey = (columns: number, rows: number): string => {
  return `${columns}x${rows}`
}

/**
 * Convert margin value to pixels
 */
export const calculateMarginInPixels = (
  margin: MarginValue,
  dimension: number,
  minMargin?: number,
  maxMargin?: number
): number => {
  if (typeof margin === 'number') {
    return margin
  }
  
  if (typeof margin === 'string' && margin.endsWith('%')) {
    const percentage = parseFloat(margin) / 100
    const calculated = Math.round(dimension * percentage)
    
    // Apply min/max constraints
    if (minMargin !== undefined && calculated < minMargin) {
      return minMargin
    }
    if (maxMargin !== undefined && calculated > maxMargin) {
      return maxMargin
    }
    
    return calculated
  }
  
  // Default fallback
  return 0
}

/**
 * Get minimum margins to ensure labels are visible (legacy)
 * @deprecated Use getUnifiedMinimumMargins instead
 */
const getMinimumMargins = (category: 'small' | 'medium' | 'large') => {
  return {
    top: category === 'small' ? 15 : category === 'medium' ? 20 : 25,
    right: category === 'small' ? 15 : category === 'medium' ? 20 : 30,
    bottom: category === 'small' ? 25 : category === 'medium' ? 40 : 50,  // Reduced for small layouts
    left: category === 'small' ? 35 : category === 'medium' ? 45 : 55  // Reduced for small layouts
  }
}

/**
 * Get maximum margins to prevent excessive spacing (legacy)
 * @deprecated Use getUnifiedMaximumMargins instead
 */
const getMaximumMargins = (category: 'small' | 'medium' | 'large') => {
  return {
    top: category === 'small' ? 40 : category === 'medium' ? 60 : 80,
    right: category === 'small' ? 40 : category === 'medium' ? 60 : 80,
    bottom: category === 'small' ? 60 : category === 'medium' ? 80 : 120,
    left: category === 'small' ? 60 : category === 'medium' ? 80 : 120
  }
}

/**
 * Get unified minimum margins based on layout context
 * Considers content metrics if available
 */
export const getUnifiedMinimumMargins = (context: LayoutContext) => {
  const category = getUnifiedLayoutCategory(context)
  const baseMinimums = getMinimumMargins(category)
  
  // If content metrics are available, adjust minimums
  if (context.contentMetrics) {
    const { maxTickLabelWidth, maxTickLabelHeight, titleHeight } = context.contentMetrics
    return {
      top: Math.max(baseMinimums.top, titleHeight + 10),
      right: baseMinimums.right,
      bottom: Math.max(baseMinimums.bottom, maxTickLabelHeight + 20),
      left: Math.max(baseMinimums.left, maxTickLabelWidth + 15)
    }
  }
  
  return baseMinimums
}

/**
 * Get unified maximum margins based on layout context
 */
export const getUnifiedMaximumMargins = (context: LayoutContext) => {
  const category = getUnifiedLayoutCategory(context)
  const baseMaximums = getMaximumMargins(category)
  
  // Adjust maximums based on container size to prevent excessive margins
  const { width, height } = context.containerSize
  const aspectRatio = width / height
  
  // For wide screens, apply stricter limits on horizontal margins
  const isWideScreen = aspectRatio > 1.5
  const horizontalLimit = isWideScreen ? 0.08 : 0.15  // 8% for wide screens, 15% for normal
  
  // For small layouts, apply stricter pixel-based limits based on grid density
  const isSmallLayout = context.gridSize.columns >= 3 && context.gridSize.rows >= 3
  const is4x4Layout = context.gridSize.columns === 4 && context.gridSize.rows === 4
  
  // Even stricter limits for 4x4
  const maxLeftPixels = is4x4Layout ? 40 : (isSmallLayout ? 60 : baseMaximums.left)
  const maxRightPixels = is4x4Layout ? 20 : (isSmallLayout ? 40 : baseMaximums.right)
  
  return {
    top: Math.min(baseMaximums.top, height * 0.15),
    right: Math.min(maxRightPixels, width * horizontalLimit),
    bottom: Math.min(baseMaximums.bottom, height * 0.2),
    left: Math.min(maxLeftPixels, width * horizontalLimit)
  }
}

/**
 * Get default chart settings based on grid layout
 * This ensures consistent settings between ChartGrid and ChartPreview
 */
export const getDefaultChartSettings = (
  columns: number, 
  rows: number, 
  usePercentageMargins = true,
  containerWidth?: number,
  containerHeight?: number
) => {
  // For the new unified system, we always return percentage-based margins
  // that will be calculated at render time based on actual container size
  const margins = {
    top: '8%',
    right: '5%',
    bottom: '12%',
    left: '10%'
  }
  
  // Use unified label offsets with dynamic X offset
  const labelOffsets = {
    x: UNIFIED_LABEL_OFFSETS.getXOffset({ columns, rows }),
    y: UNIFIED_LABEL_OFFSETS.y
  }
  
  // Simplified display settings - no special cases for different grid sizes
  const showChartTitle = true
  const showLegend = true
  const showGrid = true
  
  return {
    showXAxis: true,
    showYAxis: true,
    showGrid,
    showLegend,
    showChartTitle,
    margins,
    xLabelOffset: labelOffsets.x,
    yLabelOffset: labelOffsets.y,
    marginMode: 'unified' as any, // New margin mode
    autoMarginScale: 1.0,
    marginOverrides: {}
  }
}
