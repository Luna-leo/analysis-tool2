"use client"

import * as d3 from "d3"
import { ReferenceLine } from "@/types"
import { getCachedBBox, getCachedBBoxDimensions } from "@/utils/performance/bboxCache"
import { 
  REFERENCE_LINE_VISIBILITY_THRESHOLD, 
  REFERENCE_LINE_CURSORS, 
  REFERENCE_LINE_INTERACTIVE_AREA, 
  REFERENCE_LINE_LABEL, 
  REFERENCE_LINE_STYLES,
  REFERENCE_LINE_DEFAULTS
} from "@/constants/referenceLine"

interface HorizontalReferenceLineProps {
  line: ReferenceLine
  group: d3.Selection<SVGGElement, unknown, null, undefined>
  labelGroup: d3.Selection<SVGGElement, unknown, null, undefined>
  yScale: d3.ScaleLinear<number, number>
  width: number
  height: number
  isInteractive: boolean
  isDragging: boolean
  dragPosition?: number
  onDragStart: () => void
  onDrag: (y: number) => void
  onDragEnd: (newValue: number) => void
  isLabelDragging: boolean
  labelDragPosition?: { x: number; y: number }
  onLabelDragStart: () => void
  onLabelDrag: (x: number, y: number) => void
  onLabelDragEnd: (offsetX: number, offsetY: number) => void
}

export function HorizontalReferenceLine({
  line,
  group,
  labelGroup,
  yScale,
  width,
  height,
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
}: HorizontalReferenceLineProps) {
  const color = line.color || REFERENCE_LINE_STYLES.DEFAULT_COLOR
  const strokeDasharray = REFERENCE_LINE_STYLES.STYLES[line.style || "solid"]
  
  // Validate scale
  const isScaleValid = (() => {
    if (!yScale || typeof yScale !== 'function') return false
    const domain = yScale.domain()
    const range = yScale.range()
    return domain?.length === 2 && range?.length === 2
  })()
  
  if (!isScaleValid) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Invalid yScale provided to HorizontalReferenceLine')
    }
    return null
  }
  
  let yPos: number
  
  // Use drag position only if this specific line is currently being dragged
  if (isDragging && dragPosition !== undefined) {
    yPos = dragPosition
  } else {
    const yValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
    if (isNaN(yValue)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid y value for horizontal reference line:', line.value)
      }
      return null
    }
    yPos = yScale(yValue)
  }
  
  if (!isNaN(yPos)) {
    // Update or create main line
    let mainLine = group.select<SVGLineElement>(".main-line")
    if (mainLine.empty()) {
      mainLine = group.append("line")
        .attr("class", "main-line")
    }
    // Draw line within plot area only
    const x1 = 0
    const x2 = width
    
    // Check if line is completely outside plot area
    const isLineVisible = yPos >= -REFERENCE_LINE_VISIBILITY_THRESHOLD && yPos <= height + REFERENCE_LINE_VISIBILITY_THRESHOLD
    
    mainLine
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", yPos)
      .attr("y2", yPos)
      .attr("stroke", color)
      .attr("stroke-width", line.strokeWidth || REFERENCE_LINE_DEFAULTS.STROKE_WIDTH)
      .attr("stroke-dasharray", strokeDasharray)
      .style("display", isLineVisible ? "block" : "none")
    
    // Update or create interactive area
    if (isInteractive) {
      let interactiveLine = group.select<SVGLineElement>(".interactive-line")
      
      // Create drag behavior
      let labelOffsetY: number | null = null
      const dragBehavior = d3.drag<SVGLineElement, unknown>()
          .on("start", function() {
            onDragStart()
            // Store the current label offset at drag start
            const currentGroup = d3.select(this.parentNode as SVGGElement)
            
            // Find label group in the separate labels layer using data-line-id
            const lineId = currentGroup.attr("data-line-id")
            const svg = d3.select(this.closest("svg") as SVGSVGElement)
            const currentLabelGroup = svg.select(`.reference-label-group[data-line-id="${lineId}"]`)
            
            if (!currentLabelGroup.empty()) {
              const currentLabel = currentLabelGroup.select(".line-label")
              const labelY = parseFloat(currentLabel.attr("y"))
              const lineY = parseFloat(currentGroup.select(".main-line").attr("y1"))
              labelOffsetY = labelY - lineY
            }
          })
          .on("drag", function(event) {
            // Use d3.pointer to get accurate coordinates relative to the parent group
            const [_, y] = d3.pointer(event, this.parentNode as SVGGElement)
            const clampedY = Math.max(0, Math.min(height, y))
            onDrag(clampedY)
            
            // Update visual elements directly without re-render
            const currentGroup = d3.select(this.parentNode as SVGGElement)
            currentGroup.selectAll(".main-line, .interactive-line")
              .attr("y1", clampedY)
              .attr("y2", clampedY)
            
            // Find label group in the separate labels layer using data-line-id
            const lineId = currentGroup.attr("data-line-id")
            const svg = d3.select(this.closest("svg") as SVGSVGElement)
            const currentLabelGroup = svg.select(`.reference-label-group[data-line-id="${lineId}"]`)
            
            if (!currentLabelGroup.empty() && labelOffsetY !== null) {
              // Update label and background position maintaining the offset
              const currentLabel = currentLabelGroup.select(".line-label")
              const newLabelY = clampedY + labelOffsetY
              currentLabel.attr("y", newLabelY)
              
              // Get current X position
              const labelX = parseFloat(currentLabel.attr("x"))
              
              // Update background position
              const labelNode = currentLabel.node() as SVGTextElement
              if (labelNode) {
                const dimensions = getCachedBBoxDimensions(labelNode)
                currentLabelGroup.select(".line-label-background")
                  .attr("x", labelX - REFERENCE_LINE_LABEL.PADDING.HORIZONTAL)
                  .attr("y", newLabelY - dimensions.height + REFERENCE_LINE_LABEL.PADDING.VERTICAL)
                  .attr("width", dimensions.width + REFERENCE_LINE_LABEL.PADDING.HORIZONTAL * 2)
                  .attr("height", dimensions.height + REFERENCE_LINE_LABEL.PADDING.VERTICAL * 2)
              }
            }
          })
          .on("end", function(event) {
            // Use d3.pointer to get accurate coordinates relative to the parent group
            const [_, y] = d3.pointer(event, this.parentNode as SVGGElement)
            const clampedY = Math.max(0, Math.min(height, y))
            const numValue = yScale.invert(clampedY)
            // Keep decimal precision
            const newValue = Math.round(numValue * 1000) / 1000 // 3 decimal places
            onDragEnd(newValue)
          })
      
      if (interactiveLine.empty()) {
        interactiveLine = group.append("line")
          .attr("class", "interactive-line")
          .attr("stroke", REFERENCE_LINE_INTERACTIVE_AREA.STROKE_COLOR)
          .attr("stroke-width", REFERENCE_LINE_INTERACTIVE_AREA.STROKE_WIDTH)
          .style("cursor", REFERENCE_LINE_CURSORS.HORIZONTAL)
          .style("pointer-events", "stroke")
      }
      
      // Apply drag behavior if available
      if (dragBehavior) {
        interactiveLine.call(dragBehavior)
      }
      
      interactiveLine
        .attr("x1", x1)
        .attr("x2", x2)
        .attr("y1", yPos)
        .attr("y2", yPos)
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
      let labelX = REFERENCE_LINE_LABEL.OFFSET.HORIZONTAL.x
      let labelY = yPos + REFERENCE_LINE_LABEL.OFFSET.HORIZONTAL.y
      
      // Use drag position if label is being dragged
      if (isLabelDragging && labelDragPosition) {
        labelX = labelDragPosition.x
        labelY = labelDragPosition.y
      } else if (line.labelOffset) {
        // Use saved offset
        labelX = line.labelOffset.x || REFERENCE_LINE_LABEL.OFFSET.HORIZONTAL.x
        labelY = yPos + (line.labelOffset.y || REFERENCE_LINE_LABEL.OFFSET.HORIZONTAL.y)
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
      
      // Update stroke color every time (not just on creation)
      labelBackground.attr("stroke", color)
      
      if (labelText.empty()) {
        labelText = labelGroupElement.append("text")
          .attr("class", "line-label")
          .style("font-size", `${line.labelStyle?.fontSize || REFERENCE_LINE_DEFAULTS.LABEL_STYLE.FONT_SIZE}px`)
          .style("cursor", REFERENCE_LINE_CURSORS.LABEL)
      }
      
      // Create label drag behavior
      const labelDragBehavior = isInteractive ? d3.drag<SVGGElement, unknown>()
          .on("start", function() {
            onLabelDragStart()
          })
          .on("drag", function(event) {
            // Use d3.pointer for consistent coordinate handling
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
            // Use d3.pointer for consistent coordinate handling
            const [x, y] = d3.pointer(event, this)
            
            // Get the current line position from DOM
            // Line is in the group (clip area), need to find it
            const mainLine = group.select(".main-line")
            const lineY = parseFloat(mainLine.attr("y1"))
            
            // Calculate offset from actual line position
            const offsetX = x
            const offsetY = y - lineY
            
            onLabelDragEnd(offsetX, offsetY)
          }) : null
      
      if (labelDragBehavior) {
        labelGroupElement.call(labelDragBehavior)
      }
      
      labelText
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("fill", color)
        .style("font-size", `${line.labelStyle?.fontSize || REFERENCE_LINE_DEFAULTS.LABEL_STYLE.FONT_SIZE}px`)
        .text(line.label)
      
      // Update background to match text size
      const labelNode = labelText.node() as SVGTextElement
      if (labelNode) {
        // Ensure font size is applied before calculating bbox
        // The updated bboxCache will handle font size changes automatically
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
    
    // Remove any existing handle (no handle for horizontal lines)
    group.select(".line-handle").remove()
  }
  
}