// Default colors for data sources - used consistently across badge and chart
export const defaultChartColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
] as const

export type ChartColorIndex = number

/**
 * Get default color for a data source based on its index
 * @param index - The index of the data source
 * @returns The color string
 */
export const getDefaultColor = (index: ChartColorIndex): string => {
  return defaultChartColors[index % defaultChartColors.length]
}

/**
 * Get default color by data source ID (for backward compatibility)
 * @deprecated Use getDefaultColor(index) instead
 * @param dataSourceId - The ID of the data source (unused)
 * @param index - The index of the data source
 * @returns The color string
 */
export const getDefaultColorById = (_dataSourceId: string, index: ChartColorIndex): string => {
  return getDefaultColor(index)
}

/**
 * Create a color scale function for charts
 * @returns A function that maps index to color
 */
export const createColorScale = () => {
  return (index: ChartColorIndex) => getDefaultColor(index)
}