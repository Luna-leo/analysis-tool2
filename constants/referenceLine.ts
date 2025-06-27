/**
 * Reference line related constants
 */

// Re-export types from the main types file
export type { ReferenceLineDragEvent, DragState } from "@/types/reference-line-types"

// Label drag data interface
export interface ReferenceLineLabelDragData {
  offsetX: number
  offsetY: number
}

// Visibility threshold for reference lines
export const REFERENCE_LINE_VISIBILITY_THRESHOLD = 5 // pixels

// Drag cursor styles
export const REFERENCE_LINE_CURSORS = {
  VERTICAL: "ew-resize",
  HORIZONTAL: "ns-resize",
  LABEL: "move"
} as const

// Interactive area configuration
export const REFERENCE_LINE_INTERACTIVE_AREA = {
  STROKE_WIDTH: 10,
  STROKE_COLOR: "transparent"
} as const

// Label styling
export const REFERENCE_LINE_LABEL = {
  FONT_SIZE: "12px",
  PADDING: {
    HORIZONTAL: 4,
    VERTICAL: 2
  },
  OFFSET: {
    VERTICAL: { x: 3 as number, y: 15 as number },
    HORIZONTAL: { x: 5 as number, y: -3 as number }
  },
  BACKGROUND: {
    FILL: "white",
    FILL_OPACITY: 0.95,
    STROKE_WIDTH: 1,
    BORDER_RADIUS: 2
  }
} as const

// Line styling
export const REFERENCE_LINE_STYLES = {
  DEFAULT_COLOR: "#ff0000",
  STROKE_WIDTH: 1,
  STYLES: {
    solid: "none",
    dashed: "5,5",
    dotted: "2,2"
  }
} as const