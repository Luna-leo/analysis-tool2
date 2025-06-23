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
    // Extend line beyond chart area if auto range is enabled
    const x1 = line.xRange?.auto ? -1000 : 0
    const x2 = line.xRange?.auto ? width + 1000 : width
    
    mainLine
      .attr("x1", x1)
      .attr("x2", x2)
      .attr("y1", yPos)
      .attr("y2", yPos)
      .attr("stroke", color)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", strokeDasharray)
    
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
          const currentLabelGroup = currentGroup.select(".line-label-group")
          if (!currentLabelGroup.empty()) {
            const currentLabel = currentLabelGroup.select(".line-label")
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
          const currentLabelGroup = currentGroup.select(".line-label-group")
          if (!currentLabelGroup.empty() && labelOffsetY !== null) {
            // Update label and background position maintaining the offset
            const currentLabel = currentLabelGroup.select(".line-label")
            currentLabel.attr("y", clampedY + labelOffsetY)
            
            // Update background position
            const textBBox = (currentLabel.node() as SVGTextElement).getBBox()
            currentLabelGroup.select(".line-label-background")
              .attr("x", textBBox.x - 4)
              .attr("y", textBBox.y - 2)
              .attr("width", textBBox.width + 8)
              .attr("height", textBBox.height + 4)
          }
        })
        .on("end", function(event) {
          const clampedY = Math.max(0, Math.min(height, event.y))
          const numValue = yScale.invert(clampedY)
          // Keep decimal precision
          const newValue = Math.round(numValue * 1000) / 1000 // 3 decimal places
          onDragEnd(newValue)
        })
      
      if (interactiveLine.empty()) {
        interactiveLine = group.append("line")
          .attr("class", "interactive-line")
          .attr("stroke", "transparent")
          .attr("stroke-width", 10)
          .style("cursor", "ns-resize")
          .style("pointer-events", "stroke")
      }
      
      // Re-apply drag behavior (D3 will automatically replace existing drag)
      interactiveLine.call(drag)
      
      interactiveLine
        .attr("x1", x1)
        .attr("x2", x2)
        .attr("y1", yPos)
        .attr("y2", yPos)
    }
    
    // Update or create label
    if (line.label) {
      let labelGroup = group.select<SVGGElement>(".line-label-group")
      if (labelGroup.empty()) {
        labelGroup = group.append("g")
          .attr("class", "line-label-group")
      }
      
      let labelBackground = labelGroup.select<SVGRectElement>(".line-label-background")
      let labelText = labelGroup.select<SVGTextElement>(".line-label")
      
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
      
      if (labelBackground.empty()) {
        labelBackground = labelGroup.append("rect")
          .attr("class", "line-label-background")
          .attr("fill", "white")
          .attr("stroke", color)
          .attr("stroke-width", 0.5)
          .attr("rx", 2)
          .attr("ry", 2)
      }
      
      if (labelText.empty()) {
        labelText = labelGroup.append("text")
          .attr("class", "line-label")
          .style("font-size", "12px")
          .style("cursor", "move")
      }
      
      // Create label drag behavior
      if (isInteractive) {
        const labelDrag = d3.drag<SVGGElement, any>()
          .on("start", function() {
            onLabelDragStart()
          })
          .on("drag", function(event) {
            onLabelDrag(event.x, event.y)
            
            const g = d3.select(this)
            g.select(".line-label")
              .attr("x", event.x)
              .attr("y", event.y)
            
            // Update background position based on text
            const textBBox = (g.select(".line-label").node() as SVGTextElement).getBBox()
            g.select(".line-label-background")
              .attr("x", textBBox.x - 4)
              .attr("y", textBBox.y - 2)
              .attr("width", textBBox.width + 8)
              .attr("height", textBBox.height + 4)
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
          
        labelGroup.call(labelDrag)
      }
      
      labelText
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("fill", color)
        .style("font-weight", "normal")
        .text(line.label)
      
      // Update background to match text size
      const textBBox = (labelText.node() as SVGTextElement).getBBox()
      labelBackground
        .attr("x", textBBox.x - 4)
        .attr("y", textBBox.y - 2)
        .attr("width", textBBox.width + 8)
        .attr("height", textBBox.height + 4)
      
      // Ensure label group is on top
      labelGroup.raise()
    } else {
      group.select(".line-label-group").remove()
    }
    
    // Remove any existing handle (no handle for horizontal lines)
    group.select(".line-handle").remove()
  }
  
  return null
}