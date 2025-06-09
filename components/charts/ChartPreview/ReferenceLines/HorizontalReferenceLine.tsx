"use client"

import React from "react"
import * as d3 from "d3"
import { ReferenceLine } from "@/types"

interface HorizontalReferenceLineProps {
  line: ReferenceLine
  group: d3.Selection<SVGGElement, unknown, null, undefined>
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
  const color = line.color || "#ff0000"
  const strokeDasharray = line.style === "dashed" ? "5,5" : line.style === "dotted" ? "2,2" : "none"
  
  let yPos: number
  
  // Use drag position only if this specific line is currently being dragged
  if (isDragging && dragPosition !== undefined) {
    yPos = dragPosition
  } else {
    const yValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
    if (isNaN(yValue)) {
      console.warn('Invalid y value for horizontal reference line:', line.value)
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
    mainLine
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", yPos)
      .attr("y2", yPos)
      .attr("stroke", color)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", strokeDasharray)
      .attr("opacity", 0.8)
    
    // Update or create interactive area
    if (isInteractive) {
      let interactiveLine = group.select<SVGLineElement>(".interactive-line")
      
      // Create drag behavior
      let labelOffsetY: number | null = null
      const drag = d3.drag<SVGLineElement, any>()
        .on("start", function() {
          onDragStart()
          // Store the current label offset at drag start
          const currentGroup = d3.select(this.parentNode as SVGGElement)
          const currentLabel = currentGroup.select(".line-label")
          if (!currentLabel.empty()) {
            const labelY = parseFloat(currentLabel.attr("y"))
            const lineY = parseFloat(currentGroup.select(".main-line").attr("y1"))
            labelOffsetY = labelY - lineY
          }
        })
        .on("drag", function(event) {
          const clampedY = Math.max(0, Math.min(height, event.y))
          onDrag(clampedY)
          
          // Update visual elements directly without re-render
          const currentGroup = d3.select(this.parentNode as SVGGElement)
          currentGroup.select(".main-line")
            .attr("y1", clampedY)
            .attr("y2", clampedY)
          currentGroup.select(".interactive-line")
            .attr("y1", clampedY)
            .attr("y2", clampedY)
          const currentLabel = currentGroup.select(".line-label")
          if (!currentLabel.empty() && labelOffsetY !== null) {
            // Update label position maintaining the offset
            currentLabel
              .attr("y", clampedY + labelOffsetY)
          }
        })
        .on("end", function(event) {
          const clampedY = Math.max(0, Math.min(height, event.y))
          const newValue = Math.round(yScale.invert(clampedY))
          onDragEnd(newValue)
        })
      
      if (interactiveLine.empty()) {
        interactiveLine = group.append("line")
          .attr("class", "interactive-line")
          .attr("stroke", "transparent")
          .attr("stroke-width", 10)
          .style("cursor", "ns-resize")
      }
      
      // Re-apply drag behavior (D3 will automatically replace existing drag)
      interactiveLine.call(drag)
      
      interactiveLine
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yPos)
        .attr("y2", yPos)
    }
    
    // Update or create label
    if (line.label) {
      let labelText = group.select<SVGTextElement>(".line-label")
      
      // Calculate label position
      let labelX = 5
      let labelY = yPos - 3
      
      // Use drag position if label is being dragged
      if (isLabelDragging && labelDragPosition) {
        labelX = labelDragPosition.x
        labelY = labelDragPosition.y
      } else if (line.labelOffset) {
        // Use saved offset
        labelX = line.labelOffset.x || 5
        labelY = yPos + (line.labelOffset.y || -3)
      }
      
      if (labelText.empty()) {
        labelText = group.append("text")
          .attr("class", "line-label")
          .style("font-size", "12px")
          .style("cursor", "move")
      }
      
      // Create label drag behavior
      if (isInteractive) {
        const labelDrag = d3.drag<SVGTextElement, any>()
          .on("start", function() {
            onLabelDragStart()
          })
          .on("drag", function(event) {
            onLabelDrag(event.x, event.y)
            
            d3.select(this)
              .attr("x", event.x)
              .attr("y", event.y)
          })
          .on("end", function(event) {
            // Get the current line position from DOM
            const parentGroup = d3.select(this.parentNode as SVGGElement)
            const mainLine = parentGroup.select(".main-line")
            const lineY = parseFloat(mainLine.attr("y1"))
            
            // Calculate offset from actual line position
            const offsetX = event.x
            const offsetY = event.y - lineY
            
            onLabelDragEnd(offsetX, offsetY)
          })
          
        labelText.call(labelDrag)
      }
      
      labelText
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("fill", color)
        .style("font-weight", "normal")
        .text(line.label)
        .raise()
    } else {
      group.select(".line-label").remove()
    }
    
    // Remove any existing handle (no handle for horizontal lines)
    group.select(".line-handle").remove()
  }
  
  return null
}