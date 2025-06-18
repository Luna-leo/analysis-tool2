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
  '3x3': { bottom: 45, left: 55 },
  '3x4': { bottom: 50, left: 55 },
  '4x1': { bottom: 77, left: 60 },
  '4x2': { bottom: 77, left: 55 },
  '4x3': { bottom: 77, left: 50 },
  '4x4': { bottom: 77, left: 65 },
  // Default for larger grids
  'default': { bottom: 77, left: 65 }
}

/**
 * Get margins based on grid layout
 */
export const getLayoutMargins = (
  columns: number,
  rows: number
) => {
  // Get preset margins based on grid size
  const layoutKey = getLayoutKey(columns, rows)
  const preset = GRID_MARGIN_PRESETS[layoutKey] || GRID_MARGIN_PRESETS['default']
  const offsetPreset = GRID_LABEL_OFFSET_PRESETS[layoutKey] || GRID_LABEL_OFFSET_PRESETS['default']

  return {
    top: 20,
    right: 30,
    bottom: Math.max(preset.bottom, offsetPreset.xOffset + 10),
    left: Math.max(preset.left, offsetPreset.yOffset + 25)
  }
}

/**
 * Grid size specific label offset presets
 */
const GRID_LABEL_OFFSET_PRESETS: Record<string, { xOffset: number; yOffset: number }> = {
  '1x1': { xOffset: 35, yOffset: 40 },
  '1x2': { xOffset: 35, yOffset: 40 },
  '1x3': { xOffset: 35, yOffset: 40 },
  '1x4': { xOffset: 40, yOffset: 40 },
  '2x1': { xOffset: 35, yOffset: 40 },
  '2x2': { xOffset: 35, yOffset: 40 },
  '2x3': { xOffset: 30, yOffset: 40 },
  '2x4': { xOffset: 40, yOffset: 40 },
  '3x1': { xOffset: 35, yOffset: 40 },
  '3x2': { xOffset: 30, yOffset: 40 },
  '3x3': { xOffset: 35, yOffset: 40 },
  '3x4': { xOffset: 35, yOffset: 40 },
  '4x1': { xOffset: 40, yOffset: 40 },
  '4x2': { xOffset: 40, yOffset: 40 },
  '4x3': { xOffset: 40, yOffset: 40 },
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
 * Get layout key for storing/retrieving overrides
 */
export const getLayoutKey = (columns: number, rows: number): string => {
  return `${columns}x${rows}`
}
