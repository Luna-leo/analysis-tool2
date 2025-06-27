"use client"

import * as d3 from "d3"
import { ChartComponent, ReferenceLine } from "@/types"
import { formatDateToISOWithoutMillis } from "@/utils/dateUtils"
import { getCachedBBox, getCachedBBoxDimensions } from "@/utils/performance/bboxCache"
import { 
  REFERENCE_LINE_VISIBILITY_THRESHOLD, 
  REFERENCE_LINE_CURSORS, 
  REFERENCE_LINE_INTERACTIVE_AREA, 
  REFERENCE_LINE_LABEL, 
  REFERENCE_LINE_STYLES
} from "@/constants/referenceLine"

interface VerticalReferenceLineProps {
  line: ReferenceLine
  group: d3.Selection<SVGGElement, unknown, null, undefined>
  labelGroup: d3.Selection<SVGGElement, unknown, null, undefined>
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  width: number
  height: number
  xAxisType: ChartComponent['xAxisType']
  isInteractive: boolean
  isDragging: boolean
  dragPosition?: number
  onDragStart: () => void
  onDrag: (x: number) => void
  onDragEnd: (newValue: string | number) => void
  isLabelDragging: boolean
  labelDragPosition?: { x: number; y: number }
  onLabelDragStart: () => void
  onLabelDrag: (x: number, y: number) => void
  onLabelDragEnd: (offsetX: number, offsetY: number) => void
}

export function VerticalReferenceLine({
  line,
  group,
  labelGroup,
  xScale,
  width,
  height,
  xAxisType,
  isInteractive,
  isDragging,
  dragPosition,
  onDragStart,
  onDrag,
  onDragEnd,
  isLabelDragging,
  labelDragPosition,
  onLabelDragStart,
  onLabelDrag,
  onLabelDragEnd
}: VerticalReferenceLineProps) {
  const color = line.color || REFERENCE_LINE_STYLES.DEFAULT_COLOR
  const strokeDasharray = REFERENCE_LINE_STYLES.STYLES[line.style || "solid"]
  
  // Validate scale
  const isScaleValid = (() => {
    if (!xScale || typeof xScale !== 'function') return false
    const domain = xScale.domain()
    const range = xScale.range()
    return domain?.length === 2 && range?.length === 2
  })()
  
  if (!isScaleValid) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Invalid xScale provided to VerticalReferenceLine')
    }
    return null
  }
  
  let xPos: number
  
  // Use drag position only if this specific line is currently being dragged
  if (isDragging && dragPosition !== undefined) {
    xPos = dragPosition
  } else {
    if ((xAxisType || "datetime") === "datetime") {
      // Skip empty string values
      if (!line.value || line.value === "") {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Empty date value for vertical reference line')
        }
        return null
      }
      const date = new Date(line.value)
      if (!isNaN(date.getTime())) {
        xPos = xScale(date)
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid date for vertical reference line:', line.value)
        }
        return null
      }
    } else if ((xAxisType || "datetime") === "time") {
      // For time axis, value should be in minutes
      const minutes = typeof line.value === 'number' ? line.value : parseFloat(line.value)
      if (isNaN(minutes)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid time value for vertical reference line:', line.value)
        }
        return null
      }
      xPos = (xScale as d3.ScaleLinear<number, number>)(minutes)
    } else {
      // For parameter axis, value should be 0-100
      const paramValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
      if (isNaN(paramValue)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid parameter value for vertical reference line:', line.value)
        }
        return null
      }
      xPos = (xScale as d3.ScaleLinear<number, number>)(paramValue)
    }
    
  }
  
  // Always render the line, even if it's outside the visible area
  if (!isNaN(xPos)) {
    // Update or create main line
    let mainLine = group.select<SVGLineElement>(".main-line")
    if (mainLine.empty()) {
      mainLine = group.append("line")
        .attr("class", "main-line")
    }
    
    // Draw line within plot area only
    const y1 = 0
    const y2 = height
    
    // Check if line is completely outside plot area
    const isLineVisible = xPos >= -REFERENCE_LINE_VISIBILITY_THRESHOLD && xPos <= width + REFERENCE_LINE_VISIBILITY_THRESHOLD
    
    mainLine
      .attr("x1", xPos)
      .attr("x2", xPos)
      .attr("y1", y1)
      .attr("y2", y2)
      .attr("stroke", color)
      .attr("stroke-width", REFERENCE_LINE_STYLES.STROKE_WIDTH)
      .attr("stroke-dasharray", strokeDasharray)
      .style("display", isLineVisible ? "block" : "none")
    
    // Update or create interactive area
    if (isInteractive) {
      let interactiveLine = group.select<SVGLineElement>(".interactive-line")
      
      // Create drag behavior
      let labelOffsetX: number | null = null
      const dragBehavior = d3.drag<SVGLineElement, unknown>()
        .on("start", function() {
          onDragStart()
          // Store the current label offset at drag start
          const currentGroup = d3.select(this.parentNode as SVGGElement)
          const currentLabelGroup = currentGroup.select(".line-label-group")
          if (!currentLabelGroup.empty()) {
            const currentLabel = currentLabelGroup.select(".line-label")
            const labelX = parseFloat(currentLabel.attr("x"))
            const lineX = parseFloat(currentGroup.select(".main-line").attr("x1"))
            labelOffsetX = labelX - lineX
          }
        })
        .on("drag", function(event) {
          // Use d3.pointer to get accurate coordinates relative to the parent group
          const [x, _] = d3.pointer(event, this.parentNode as SVGGElement)
          const clampedX = Math.max(0, Math.min(width, x))
          
          onDrag(clampedX)
          
          // Update visual elements directly without re-render
          const currentGroup = d3.select(this.parentNode as SVGGElement)
          currentGroup.selectAll(".main-line, .interactive-line")
            .attr("x1", clampedX)
            .attr("x2", clampedX)
          
          const currentLabelGroup = currentGroup.select(".line-label-group")
          if (!currentLabelGroup.empty() && labelOffsetX !== null) {
            // Update label and background position maintaining the offset
            const currentLabel = currentLabelGroup.select(".line-label")
            const newLabelX = clampedX + labelOffsetX
            currentLabel.attr("x", newLabelX)
            
            // Get current Y position
            const labelY = parseFloat(currentLabel.attr("y"))
            
            // Update background position
            const labelNode = currentLabel.node() as SVGTextElement
            if (labelNode) {
              const dimensions = getCachedBBoxDimensions(labelNode)
              currentLabelGroup.select(".line-label-background")
                .attr("x", newLabelX - REFERENCE_LINE_LABEL.PADDING.HORIZONTAL)
                .attr("y", labelY - dimensions.height + REFERENCE_LINE_LABEL.PADDING.VERTICAL)
                .attr("width", dimensions.width + REFERENCE_LINE_LABEL.PADDING.HORIZONTAL * 2)
                .attr("height", dimensions.height + REFERENCE_LINE_LABEL.PADDING.VERTICAL * 2)
            }
          }
        })
        .on("end", function(event) {
          // Use d3.pointer to get accurate coordinates relative to the parent group
          const [x, _] = d3.pointer(event, this.parentNode as SVGGElement)
          const clampedX = Math.max(0, Math.min(width, x))
          
          let newValue: string | number
          if ((xAxisType || "datetime") === "datetime") {
            const newDate = (xScale as d3.ScaleTime<number, number>).invert(clampedX)
            
            // Format date in local timezone to match the data
            const localISOString = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 19)
            
            newValue = localISOString
          } else {
            // For time or parameter axis
            const numValue = (xScale as d3.ScaleLinear<number, number>).invert(clampedX)
            // Keep decimal precision
            newValue = Math.round(numValue * 1000) / 1000 // 3 decimal places
          }
          
          onDragEnd(newValue)
        })
      
      if (interactiveLine.empty()) {
        interactiveLine = group.append("line")
          .attr("class", "interactive-line")
          .attr("stroke", REFERENCE_LINE_INTERACTIVE_AREA.STROKE_COLOR)
          .attr("stroke-width", REFERENCE_LINE_INTERACTIVE_AREA.STROKE_WIDTH)
          .style("cursor", REFERENCE_LINE_CURSORS.VERTICAL)
          .style("pointer-events", "stroke")
      }
      
      // Apply drag behavior if available
      if (dragBehavior) {
        interactiveLine.call(dragBehavior)
      }
      
      interactiveLine
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", y1)
        .attr("y2", y2)
        .style("display", isLineVisible ? "block" : "none")
    }
    
    // Update or create label - in the separate label group
    if (line.label && isLineVisible) {
      let labelGroupElement = labelGroup.select<SVGGElement>(".line-label-group")
      if (labelGroupElement.empty()) {
        labelGroupElement = labelGroup.append("g")
          .attr("class", "line-label-group")
      }
      
      let labelBackground = labelGroupElement.select<SVGRectElement>(".line-label-background")
      let labelText = labelGroupElement.select<SVGTextElement>(".line-label")
      
      // Calculate label position
      let labelX = xPos + REFERENCE_LINE_LABEL.OFFSET.VERTICAL.x
      let labelY = REFERENCE_LINE_LABEL.OFFSET.VERTICAL.y
      
      // Use drag position if label is being dragged
      if (isLabelDragging && labelDragPosition) {
        labelX = labelDragPosition.x
        labelY = labelDragPosition.y
      } else if (line.labelOffset) {
        // Use saved offset
        labelX = xPos + (line.labelOffset.x || REFERENCE_LINE_LABEL.OFFSET.VERTICAL.x)
        labelY = line.labelOffset.y || REFERENCE_LINE_LABEL.OFFSET.VERTICAL.y
      }
      
      if (labelBackground.empty()) {
        labelBackground = labelGroupElement.append("rect")
          .attr("class", "line-label-background")
          .attr("fill", REFERENCE_LINE_LABEL.BACKGROUND.FILL)
          .attr("fill-opacity", REFERENCE_LINE_LABEL.BACKGROUND.FILL_OPACITY)
          .attr("stroke", color)
          .attr("stroke-width", REFERENCE_LINE_LABEL.BACKGROUND.STROKE_WIDTH)
          .attr("rx", REFERENCE_LINE_LABEL.BACKGROUND.BORDER_RADIUS)
          .attr("ry", REFERENCE_LINE_LABEL.BACKGROUND.BORDER_RADIUS)
          .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.2))")
      }
      
      if (labelText.empty()) {
        labelText = labelGroupElement.append("text")
          .attr("class", "line-label")
          .style("font-size", REFERENCE_LINE_LABEL.FONT_SIZE)
          .style("cursor", REFERENCE_LINE_CURSORS.LABEL)
      }
      
      // Create label drag behavior
      const labelDragBehavior = isInteractive ? d3.drag<SVGGElement, unknown>()
        .on("start", function() {
          onLabelDragStart()
        })
        .on("drag", function(event) {
          // Use d3.pointer for label drag as well
          const [x, y] = d3.pointer(event, this)
          onLabelDrag(x, y)
          
          const g = d3.select(this)
          g.select(".line-label")
            .attr("x", x)
            .attr("y", y)
          
          // Update background position based on label position
          const labelNode = g.select(".line-label").node() as SVGTextElement
          if (labelNode) {
            const dimensions = getCachedBBoxDimensions(labelNode)
            g.select(".line-label-background")
              .attr("x", x - REFERENCE_LINE_LABEL.PADDING.HORIZONTAL)
              .attr("y", y - dimensions.height + REFERENCE_LINE_LABEL.PADDING.VERTICAL)
              .attr("width", dimensions.width + REFERENCE_LINE_LABEL.PADDING.HORIZONTAL * 2)
              .attr("height", dimensions.height + REFERENCE_LINE_LABEL.PADDING.VERTICAL * 2)
          }
        })
        .on("end", function(event) {
          // Use d3.pointer for accurate coordinates
          const [x, y] = d3.pointer(event, this)
          
          // Get the current line position from DOM
          // Line is in the group (clip area), need to find it
          const mainLine = group.select(".main-line")
          const lineX = parseFloat(mainLine.attr("x1"))
          
          // Calculate offset from actual line position
          const offsetX = x - lineX
          const offsetY = y
          
          onLabelDragEnd(offsetX, offsetY)
        }) : null
      
      if (labelDragBehavior) {
        labelGroupElement.call(labelDragBehavior)
      }
      
      labelText
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("fill", color)
        .style("font-weight", "normal")
        .text(line.label)
      
      // Update background to match text size
      const labelNode = labelText.node() as SVGTextElement
      if (labelNode) {
        const dimensions = getCachedBBoxDimensions(labelNode)
        // Position background relative to label position
        // Text baseline is at labelY, so we need to adjust for text height
        labelBackground
          .attr("x", labelX - REFERENCE_LINE_LABEL.PADDING.HORIZONTAL)
          .attr("y", labelY - dimensions.height + REFERENCE_LINE_LABEL.PADDING.VERTICAL)
          .attr("width", dimensions.width + REFERENCE_LINE_LABEL.PADDING.HORIZONTAL * 2)
          .attr("height", dimensions.height + REFERENCE_LINE_LABEL.PADDING.VERTICAL * 2)
      }
      
      // Label z-index is managed at the layer level in index.tsx
    } else if (!isLineVisible && line.label) {
      // Remove label if line is not visible
      labelGroup.select(".line-label-group").remove()
    }
    
    // Remove any existing handle (no handle for vertical lines)
    group.select(".line-handle").remove()
  }
}