/**
 * Grid size specific margin presets
 */
const GRID_MARGIN_PRESETS: Record<string, { bottom: number; left: number }> = {
  '1x1': { bottom: 60, left: 60 },
  '1x2': { bottom: 60, left: 60 },
  '1x3': { bottom: 50, left: 55 },
  '1x4': { bottom: 77, left: 60 },
  '2x1': { bottom: 60, left: 60 },
  '2x2': { bottom: 50, left: 55 },
  '2x3': { bottom: 50, left: 55 },
  '2x4': { bottom: 77, left: 55 },
  '3x1': { bottom: 50, left: 55 },
  '3x2': { bottom: 50, left: 55 },
  '3x3': { bottom: 35, left: 55 }, // Optimized for 3x3 layout
  '3x4': { bottom: 40, left: 55 },
  '4x1': { bottom: 77, left: 60 },
  '4x2': { bottom: 77, left: 55 },
  '4x3': { bottom: 77, left: 50 },
  '4x4': { bottom: 77, left: 65 },
  // Default for larger grids
  'default': { bottom: 77, left: 65 }
}


/**
 * Grid size specific label offset presets
 */
const GRID_LABEL_OFFSET_PRESETS: Record<string, { xOffset: number; yOffset: number }> = {
  '1x1': { xOffset: 35, yOffset: 35 },
  '1x2': { xOffset: 35, yOffset: 35 },
  '1x3': { xOffset: 35, yOffset: 35 },
  '1x4': { xOffset: 40, yOffset: 35 },
  '2x1': { xOffset: 35, yOffset: 35 },
  '2x2': { xOffset: 35, yOffset: 35 },
  '2x3': { xOffset: 30, yOffset: 30 },
  '2x4': { xOffset: 40, yOffset: 30 },
  '3x1': { xOffset: 35, yOffset: 35 },
  '3x2': { xOffset: 30, yOffset: 30 },
  '3x3': { xOffset: 30, yOffset: 30 },
  '3x4': { xOffset: 30, yOffset: 30 },
  '4x1': { xOffset: 40, yOffset: 35 },
  '4x2': { xOffset: 40, yOffset: 30 },
  '4x3': { xOffset: 40, yOffset: 30 },
  '4x4': { xOffset: 40, yOffset: 40 },
  // Default for larger grids
  'default': { xOffset: 40, yOffset: 40 }
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

  return {
    top: 20,
    right: 30,
    bottom: Math.max(preset.bottom, offsets.xLabelOffset + 20),
    left: Math.max(preset.left, offsets.yLabelOffset + 20)
  }
}

/**
 * Get layout key for storing/retrieving overrides
 */
export const getLayoutKey = (columns: number, rows: number): string => {
  return `${columns}x${rows}`
}
