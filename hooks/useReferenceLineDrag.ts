"use client"

import { useCallback, useRef } from 'react'
import * as d3 from 'd3'
import { ReferenceLine } from '@/types'

interface DragHandlers {
  onDragStart?: (line: ReferenceLine) => void
  onDrag?: (line: ReferenceLine, newValue: number | string) => void
  onDragEnd?: (line: ReferenceLine, newValue: number | string) => void
}

interface UseReferenceLineDragOptions {
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
  yScale: d3.ScaleLinear<number, number> | null
  width: number
  height: number
  onUpdateReferenceLine: (lineId: string, newValue: number | string) => void
  handlers?: DragHandlers
}

export function useReferenceLineDrag({
  xScale,
  yScale,
  width,
  height,
  onUpdateReferenceLine,
  handlers = {}
}: UseReferenceLineDragOptions) {
  const draggedLineRef = useRef<ReferenceLine | null>(null)
  const initialValueRef = useRef<number | string | null>(null)

  const createDragBehavior = useCallback(() => {
    return d3.drag<SVGGElement, ReferenceLine>()
      .on("start", function(event, d) {
        // Store the initial value for potential cancellation
        draggedLineRef.current = d
        initialValueRef.current = d.value
        
        // Add dragging class for visual feedback
        d3.select(this).classed("dragging", true)
        
        // Call custom handler if provided
        handlers.onDragStart?.(d)
      })
      .on("drag", function(event, d) {
        if (!xScale || !yScale) return

        let newValue: number | string
        
        if (d.type === "vertical") {
          // Constrain to chart bounds
          const constrainedX = Math.max(0, Math.min(width, event.x))
          
          // Convert pixel position to data value
          const xDomain = xScale.domain()
          if (xDomain[0] instanceof Date) {
            // Time scale
            newValue = (xScale as d3.ScaleTime<number, number>).invert(constrainedX).toISOString()
          } else {
            // Linear scale
            newValue = (xScale as d3.ScaleLinear<number, number>).invert(constrainedX)
          }
          
          // Update line position
          d3.select(this)
            .select("line")
            .attr("x1", constrainedX)
            .attr("x2", constrainedX)
            
          // Update label position
          d3.select(this)
            .select("text")
            .attr("x", constrainedX)
        } else {
          // Horizontal line
          const constrainedY = Math.max(0, Math.min(height, event.y))
          newValue = yScale.invert(constrainedY)
          
          // Update line position
          d3.select(this)
            .select("line")
            .attr("y1", constrainedY)
            .attr("y2", constrainedY)
            
          // Update label position
          d3.select(this)
            .select("text")
            .attr("y", constrainedY)
        }
        
        // Call custom handler if provided
        handlers.onDrag?.(d, newValue)
      })
      .on("end", function(event, d) {
        if (!xScale || !yScale || !draggedLineRef.current) return

        let finalValue: number | string
        
        if (d.type === "vertical") {
          const constrainedX = Math.max(0, Math.min(width, event.x))
          const xDomain = xScale.domain()
          
          if (xDomain[0] instanceof Date) {
            finalValue = (xScale as d3.ScaleTime<number, number>).invert(constrainedX).toISOString()
          } else {
            finalValue = (xScale as d3.ScaleLinear<number, number>).invert(constrainedX)
          }
        } else {
          const constrainedY = Math.max(0, Math.min(height, event.y))
          finalValue = yScale.invert(constrainedY)
        }
        
        // Remove dragging class
        d3.select(this).classed("dragging", false)
        
        // Update the reference line value
        onUpdateReferenceLine(d.id, finalValue)
        
        // Call custom handler if provided
        handlers.onDragEnd?.(d, finalValue)
        
        // Clear refs
        draggedLineRef.current = null
        initialValueRef.current = null
      })
  }, [xScale, yScale, width, height, onUpdateReferenceLine, handlers])

  return {
    createDragBehavior,
    draggedLine: draggedLineRef.current,
    initialValue: initialValueRef.current
  }
}