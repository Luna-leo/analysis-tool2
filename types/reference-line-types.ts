import { ReferenceLine } from "@/types"

// D3 drag event types for reference lines
export interface ReferenceLineDragEvent {
  x: number
  y: number
  dx: number
  dy: number
  identifier: string | number
  active: number
  sourceEvent: MouseEvent | TouchEvent
  subject: ReferenceLine
}

// Error states for reference lines
export interface ReferenceLineError {
  type: 'invalid_scale' | 'invalid_value' | 'empty_value' | 'parse_error'
  message: string
  lineId: string
  value?: any
}

// Scale validation result
export interface ScaleValidationResult {
  isValid: boolean
  error?: ReferenceLineError
}

// Drag state
export interface DragState {
  id: string
  type: 'vertical' | 'horizontal'
  startPosition: number
  currentPosition: number
  startValue: string | number
}

// Drag behavior types
export type LineDragBehavior = d3.DragBehavior<SVGLineElement, ReferenceLine, ReferenceLine>
export type LabelDragBehavior = d3.DragBehavior<SVGGElement, ReferenceLine, ReferenceLine>

// Common props for reference line components
export interface BaseReferenceLineProps {
  line: ReferenceLine
  group: d3.Selection<SVGGElement, unknown, null, undefined>
  labelGroup: d3.Selection<SVGGElement, unknown, null, undefined>
  width: number
  height: number
  isInteractive: boolean
  isDragging: boolean
  dragPosition?: number
  onDragStart: () => void
  onDrag: (position: number) => void
  isLabelDragging: boolean
  labelDragPosition?: { x: number; y: number }
  onLabelDragStart: () => void
  onLabelDrag: (x: number, y: number) => void
  onLabelDragEnd: (offsetX: number, offsetY: number) => void
}