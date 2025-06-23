"use client"

import React from "react"
import * as d3 from "d3"
import { ChartComponent, ReferenceLine } from "@/types"
import { formatDateToISOWithoutMillis } from "@/utils/dateUtils"

interface VerticalReferenceLineProps {
  line: ReferenceLine
  group: d3.Selection<SVGGElement, unknown, null, undefined>
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
  const color = line.color || "#ff0000"
  const strokeDasharray = line.style === "dashed" ? "5,5" : line.style === "dotted" ? "2,2" : "none"
  
  let xPos: number
  
  // Use drag position only if this specific line is currently being dragged
  if (isDragging && dragPosition !== undefined) {
    xPos = dragPosition
  } else {
    if ((xAxisType || "datetime") === "datetime") {
      // Skip empty string values
      if (!line.value || line.value === "") {
        console.warn('Empty date value for vertical reference line')
        return null
      }
      const date = new Date(line.value)
      if (!isNaN(date.getTime())) {
        xPos = xScale(date)
      } else {
        console.warn('Invalid date for vertical reference line:', line.value)
        return null
      }
    } else if ((xAxisType || "datetime") === "time") {
      // For time axis, value should be in minutes
      const minutes = typeof line.value === 'number' ? line.value : parseFloat(line.value)
      if (isNaN(minutes)) {
        console.warn('Invalid time value for vertical reference line:', line.value)
        return null
      }
      xPos = (xScale as d3.ScaleLinear<number, number>)(minutes)
    } else {
      // For parameter axis, value should be 0-100
      const paramValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
      if (isNaN(paramValue)) {
        console.warn('Invalid parameter value for vertical reference line:', line.value)
        return null
      }
      xPos = (xScale as d3.ScaleLinear<number, number>)(paramValue)
    }
  }
  
  if (!isNaN(xPos) && xPos >= 0 && xPos <= width) {
    // Update or create main line
    let mainLine = group.select<SVGLineElement>(".main-line")
    if (mainLine.empty()) {
      mainLine = group.append("line")
        .attr("class", "main-line")
    }
    
    // Draw line within plot area only
    const y1 = 0
    const y2 = height
    
    mainLine
      .attr("x1", xPos)
      .attr("x2", xPos)
      .attr("y1", y1)
      .attr("y2", y2)
      .attr("stroke", color)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", strokeDasharray)
    
    // Update or create interactive area
    if (isInteractive) {
      let interactiveLine = group.select<SVGLineElement>(".interactive-line")
      
      // Create drag behavior
      let labelOffsetX: number | null = null
      const drag = d3.drag<SVGLineElement, any>()
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
          const clampedX = Math.max(0, Math.min(width, event.x))
          onDrag(clampedX)
          
          // Update visual elements directly without re-render
          const currentGroup = d3.select(this.parentNode as SVGGElement)
          currentGroup.select(".main-line")
            .attr("x1", clampedX)
            .attr("x2", clampedX)
          currentGroup.select(".interactive-line")
            .attr("x1", clampedX)
            .attr("x2", clampedX)
          const currentLabelGroup = currentGroup.select(".line-label-group")
          if (!currentLabelGroup.empty() && labelOffsetX !== null) {
            // Update label and background position maintaining the offset
            const currentLabel = currentLabelGroup.select(".line-label")
            currentLabel.attr("x", clampedX + labelOffsetX)
            
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
          const clampedX = Math.max(0, Math.min(width, event.x))
          
          let newValue: string | number
          if ((xAxisType || "datetime") === "datetime") {
            const newDate = (xScale as d3.ScaleTime<number, number>).invert(clampedX)
            newValue = formatDateToISOWithoutMillis(newDate)
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
          .attr("stroke", "transparent")
          .attr("stroke-width", 10)
          .style("cursor", "ew-resize")
          .style("pointer-events", "stroke")
      }
      
      // Re-apply drag behavior (D3 will automatically replace existing drag)
      interactiveLine.call(drag)
      
      interactiveLine
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", y1)
        .attr("y2", y2)
    }
    
    // Update or create label - ensure it's always on top
    if (line.label) {
      let labelGroup = group.select<SVGGElement>(".line-label-group")
      if (labelGroup.empty()) {
        labelGroup = group.append("g")
          .attr("class", "line-label-group")
      }
      
      let labelBackground = labelGroup.select<SVGRectElement>(".line-label-background")
      let labelText = labelGroup.select<SVGTextElement>(".line-label")
      
      // Calculate label position
      let labelX = xPos + 3
      let labelY = 15
      
      // Use drag position if label is being dragged
      if (isLabelDragging && labelDragPosition) {
        labelX = labelDragPosition.x
        labelY = labelDragPosition.y
      } else if (line.labelOffset) {
        // Use saved offset
        labelX = xPos + (line.labelOffset.x || 3)
        labelY = line.labelOffset.y || 15
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
            const lineX = parseFloat(mainLine.attr("x1"))
            
            // Calculate offset from actual line position
            const offsetX = event.x - lineX
            const offsetY = event.y
            
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
    
    // Remove any existing handle (no handle for vertical lines)
    group.select(".line-handle").remove()
  }
  
  return null
}