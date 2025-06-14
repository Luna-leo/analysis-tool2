/**
 * Chart-related constants
 */

// Default chart dimensions
export const DEFAULT_CHART_MARGINS = {
  top: 20,
  right: 40,
  bottom: 60,
  left: 60
} as const

// Chart rendering thresholds
export const CHART_RENDER_THRESHOLDS = {
  CANVAS_MIN_POINTS: 300,  // Minimum points to use canvas rendering
  LOD_HIGH_POINTS: 1000,   // Points threshold for high LOD
  LOD_MEDIUM_POINTS: 500,  // Points threshold for medium LOD
  MAX_SVG_POINTS: 5000     // Maximum points for SVG rendering
} as const

// Default marker configuration
export const DEFAULT_MARKER_CONFIG = {
  size: 6,
  opacity: 0.7,
  strokeWidth: 1
} as const

// Line styles mapping
export const LINE_STYLES = {
  solid: "none",
  dashed: "5,5",
  dotted: "2,2",
  dashdot: "5,2,2,2"
} as const

// Default axis configuration
export const DEFAULT_AXIS_CONFIG = {
  tickSize: 5,
  tickPadding: 5,
  fontSize: "12px"
} as const

// Animation durations
export const CHART_ANIMATIONS = {
  TOOLTIP_DELAY: 200,
  TRANSITION_DURATION: 300,
  RESIZE_DEBOUNCE: 150
} as const