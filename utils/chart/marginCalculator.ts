/**
 * Get layout size category
 */
const getLayoutCategory = (columns: number, rows: number): 'small' | 'medium' | 'large' => {
  const totalCells = columns * rows
  if (totalCells >= 9) return 'small'   // 3x3, 3x4, 4x3, 4x4, etc.
  if (totalCells >= 4) return 'medium'  // 2x2, 2x3, 3x2, etc.
  return 'large'                         // 1x1, 1x2, 2x1, 1x3, 3x1
}

/**
 * Grid size specific margin presets
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
  
  // Small layouts - compact margins
  '3x3': { bottom: 35, left: 40, top: 20, right: 20 },
  '3x4': { bottom: 32, left: 38, top: 18, right: 18 },
  '4x1': { bottom: 40, left: 50, top: 22, right: 25 },
  '4x2': { bottom: 36, left: 45, top: 20, right: 22 },
  '4x3': { bottom: 32, left: 38, top: 18, right: 18 },
  '4x4': { bottom: 30, left: 35, top: 15, right: 15 },
  
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
 * Get margins based on grid layout and ensure enough space for axis labels
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
 * Get default chart settings based on grid layout
 * This ensures consistent settings between ChartGrid and ChartPreview
 */
export const getDefaultChartSettings = (columns: number, rows: number) => {
  const margins = getLayoutMargins(columns, rows)
  const labelOffsets = getLayoutLabelOffsets(columns, rows)
  const category = getLayoutCategory(columns, rows)
  
  // Conditionally show elements based on layout size
  const showChartTitle = category !== 'small' // Hide title for 3x3 and smaller
  const showLegend = true // Always show legend but position will be optimized
  const showGrid = category !== 'small' || (columns <= 3 && rows <= 3) // Show grid for 3x3 but not 4x4
  
  return {
    showXAxis: true,
    showYAxis: true,
    showGrid,
    showLegend,
    showChartTitle,
    margins,
    xLabelOffset: labelOffsets.xLabelOffset,
    yLabelOffset: labelOffsets.yLabelOffset,
    marginMode: 'auto' as const,
    autoMarginScale: 1.0,
    marginOverrides: {}
  }
}
