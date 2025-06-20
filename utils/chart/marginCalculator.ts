/**
 * Grid size specific margin presets
 */
const GRID_MARGIN_PRESETS: Record<string, { bottom: number; left: number }> = {
  '1x1': { bottom: 70, left: 75 },
  '1x2': { bottom: 70, left: 75 },
  '1x3': { bottom: 60, left: 72 },
  '1x4': { bottom: 80, left: 72 },
  '2x1': { bottom: 70, left: 75 },
  '2x2': { bottom: 60, left: 72 },
  '2x3': { bottom: 60, left: 70 },
  '2x4': { bottom: 80, left: 70 },
  '3x1': { bottom: 60, left: 72 },
  '3x2': { bottom: 60, left: 70 },
  '3x3': { bottom: 50, left: 68 }, // Optimized for 3x3 layout
  '3x4': { bottom: 55, left: 68 },
  '4x1': { bottom: 80, left: 72 },
  '4x2': { bottom: 80, left: 70 },
  '4x3': { bottom: 80, left: 68 },
  '4x4': { bottom: 80, left: 72 },
  // Default for larger grids
  'default': { bottom: 80, left: 75 }
}


/**
 * Grid size specific label offset presets
 */
const GRID_LABEL_OFFSET_PRESETS: Record<string, { xOffset: number; yOffset: number }> = {
  '1x1': { xOffset: 35, yOffset: 50 },
  '1x2': { xOffset: 35, yOffset: 50 },
  '1x3': { xOffset: 35, yOffset: 48 },
  '1x4': { xOffset: 40, yOffset: 48 },
  '2x1': { xOffset: 35, yOffset: 50 },
  '2x2': { xOffset: 35, yOffset: 48 },
  '2x3': { xOffset: 30, yOffset: 45 },
  '2x4': { xOffset: 40, yOffset: 45 },
  '3x1': { xOffset: 35, yOffset: 48 },
  '3x2': { xOffset: 30, yOffset: 45 },
  '3x3': { xOffset: 30, yOffset: 42 },
  '3x4': { xOffset: 30, yOffset: 42 },
  '4x1': { xOffset: 40, yOffset: 48 },
  '4x2': { xOffset: 40, yOffset: 45 },
  '4x3': { xOffset: 40, yOffset: 42 },
  '4x4': { xOffset: 40, yOffset: 50 },
  // Default for larger grids
  'default': { xOffset: 40, yOffset: 50 }
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

  // Add extra safety margins to prevent overflow
  const safetyMargin = 10
  
  return {
    top: 30, // Increased for title with safety margin
    right: 40, // Increased for edge markers with safety margin
    bottom: Math.max(preset.bottom, offsets.xLabelOffset + 25) + safetyMargin,
    left: Math.max(preset.left, offsets.yLabelOffset + 25) + safetyMargin
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
  
  return {
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    showLegend: true,
    showChartTitle: true,
    margins,
    xLabelOffset: labelOffsets.xLabelOffset,
    yLabelOffset: labelOffsets.yLabelOffset,
    marginMode: 'auto' as const,
    autoMarginScale: 1.0,
    marginOverrides: {}
  }
}
