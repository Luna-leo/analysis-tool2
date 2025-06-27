// Unified reference line type definitions

import { LineStyle, ReferenceLineType } from './index'

// Base interface for UI representation of reference lines
export interface ReferenceLineConfig {
  id: string
  type: "vertical" | "horizontal"
  label: string
  xValue?: string  // String representation for vertical lines (supports datetime)
  yValue?: string  // String representation for horizontal lines
  axisNo?: number  // Axis number (for future multi-axis support)
  color?: string
  style?: LineStyle
  labelOffset?: {
    x: number
    y: number
  }
}

// Conversion utilities
export function configToReferenceLine(
  config: ReferenceLineConfig,
  xAxisType: string = "datetime"
): {
  id: string
  type: ReferenceLineType
  value: number | string
  label: string
  color: string
  style: LineStyle
  labelOffset?: { x: number; y: number }
} {
  let value: number | string = ""
  
  if (config.type === "vertical" && config.xValue) {
    // For vertical lines, preserve string value for datetime axis
    if (xAxisType === "datetime") {
      value = config.xValue
    } else {
      // For numeric axes, convert to number
      const numValue = parseFloat(config.xValue)
      value = isNaN(numValue) ? 0 : numValue
    }
  } else if (config.type === "horizontal" && config.yValue) {
    // Horizontal lines are always numeric
    const numValue = parseFloat(config.yValue)
    value = isNaN(numValue) ? 0 : numValue
  }

  return {
    id: config.id,
    type: config.type,
    value,
    label: config.label,
    color: config.color || "#FF0000",
    style: config.style || "solid",
    labelOffset: config.labelOffset
  }
}

export function referenceLineToConfig(
  line: {
    id: string
    type: ReferenceLineType
    value: number | string
    label: string
    color?: string
    style?: LineStyle
    labelOffset?: { x: number; y: number }
  }
): ReferenceLineConfig {
  return {
    id: line.id,
    type: line.type === "vertical" ? "vertical" : "horizontal",
    label: line.label,
    xValue: line.type === "vertical" 
      ? (typeof line.value === 'string' ? line.value : line.value?.toString()) 
      : undefined,
    yValue: line.type === "horizontal" 
      ? line.value?.toString() 
      : undefined,
    axisNo: 1,
    color: line.color,
    style: line.style,
    labelOffset: line.labelOffset
  }
}