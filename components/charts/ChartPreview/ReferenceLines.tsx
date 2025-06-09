"use client"

import React, { useEffect, useRef, useCallback } from "react"
import * as d3 from "d3"
import { ChartComponent } from "@/types"

interface ReferenceLinesProps {
  svgRef: React.RefObject<SVGSVGElement | null>
  editingChart: ChartComponent
  setEditingChart?: (chart: ChartComponent) => void
  scalesRef: React.MutableRefObject<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
    yScale: d3.ScaleLinear<number, number> | null
  }>
}

export function ReferenceLines({ svgRef, editingChart, setEditingChart, scalesRef }: ReferenceLinesProps) {
  const [draggingLine, setDraggingLine] = React.useState<{ id: string; type: 'vertical' | 'horizontal' } | null>(null)
  const [hoveredLine, setHoveredLine] = React.useState<string | null>(null)
  const isUpdatingRef = useRef(false)
  const dragPositionRef = useRef<{ [key: string]: number }>({})

  const updateReferenceLine = useCallback((lineId: string, newValue: number | string) => {
    if (!setEditingChart) return
    
    const updatedChart: ChartComponent = {
      ...editingChart,
      referenceLines: (editingChart.referenceLines || []).map((line) => 
        line.id === lineId ? { ...line, value: newValue } : line
      )
    }
    setEditingChart(updatedChart)
  }, [setEditingChart, editingChart])

  useEffect(() => {
    if (!svgRef.current || !scalesRef.current.xScale || !scalesRef.current.yScale) return

    const svg = d3.select(svgRef.current)
    const margin = { top: 20, right: 80, bottom: 40, left: 60 }
    const width = 400 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    // Ensure reference lines layer exists at the SVG level, not inside main chart group
    let refLinesLayer = svg.select<SVGGElement>(".reference-lines-layer")
    if (refLinesLayer.empty()) {
      refLinesLayer = svg
        .append<SVGGElement>("g")
        .attr("class", "reference-lines-layer")
        .attr("transform", `translate(${margin.left},${margin.top})`)
    }
    
    // Always bring reference lines layer to front
    refLinesLayer.raise()

    // Skip drawing if we're in the middle of updating
    if (!isUpdatingRef.current) {
      drawReferenceLines(
        refLinesLayer,
        scalesRef.current.xScale,
        scalesRef.current.yScale,
        width,
        height
      )
    }
  }, [
    // Use JSON.stringify to ensure stable dependency
    JSON.stringify(editingChart.referenceLines || []),
    hoveredLine,
    draggingLine,
    svgRef,
    scalesRef
  ])

  const drawReferenceLines = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    width: number, 
    height: number
  ) => {
    const referenceLines = editingChart.referenceLines || []
    const isInteractive = !!setEditingChart
    
    // Data join with existing elements
    const lineGroups = g.selectAll<SVGGElement, typeof referenceLines[0]>(".reference-line-group")
      .data(referenceLines, d => d.id)
    
    // Remove exit selection
    lineGroups.exit().remove()
    
    // Enter selection - create new groups
    const lineGroupsEnter = lineGroups.enter()
      .append("g")
      .attr("class", "reference-line-group")
      .attr("data-line-id", d => d.id)
    
    // Merge enter and update selections
    const allLineGroups = lineGroupsEnter.merge(lineGroups)
    
    // Update each line group
    allLineGroups.each(function(line) {
      const group = d3.select(this)
      const color = line.color || "#ff0000"
      const strokeDasharray = line.style === "dashed" ? "5,5" : line.style === "dotted" ? "2,2" : "none"
      const isHovered = hoveredLine === line.id
      const isDragging = draggingLine?.id === line.id
      
      if (line.type === "vertical") {
        // Vertical reference line
        let xPos: number
        
        // Use drag position if we're dragging this line
        if (isDragging && dragPositionRef.current[line.id] !== undefined) {
          xPos = dragPositionRef.current[line.id]
        } else {
          if ((editingChart.xAxisType || "datetime") === "datetime") {
            const date = new Date(line.value)
            if (!isNaN(date.getTime())) {
              xPos = xScale(date)
            } else {
              console.warn('Invalid date for vertical reference line:', line.value)
              return
            }
          } else if ((editingChart.xAxisType || "datetime") === "time") {
            // For time axis, value should be in minutes
            const minutes = typeof line.value === 'number' ? line.value : parseFloat(line.value)
            xPos = (xScale as d3.ScaleLinear<number, number>)(minutes)
          } else {
            // For parameter axis, value should be 0-100
            const paramValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
            xPos = (xScale as d3.ScaleLinear<number, number>)(paramValue)
          }
        }
        
        if (xPos >= 0 && xPos <= width) {
          // Update or create main line
          let mainLine = group.select<SVGLineElement>(".main-line")
          if (mainLine.empty()) {
            mainLine = group.append("line")
              .attr("class", "main-line")
          }
          mainLine
            .attr("x1", xPos)
            .attr("x2", xPos)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", color)
            .attr("stroke-width", isHovered || isDragging ? 2 : 1)
            .attr("stroke-dasharray", strokeDasharray)
            .attr("opacity", isHovered || isDragging ? 1 : 0.7)
            .style("transition", isDragging ? "none" : "all 0.2s ease")
          
          // Update or create interactive area
          if (isInteractive) {
            let interactiveLine = group.select<SVGLineElement>(".interactive-line")
            if (interactiveLine.empty()) {
              // Create drag behavior
              const drag = d3.drag<SVGLineElement, unknown>()
                .on("start", () => {
                  setHoveredLine(line.id)
                  setDraggingLine({ id: line.id, type: "vertical" })
                })
                .on("drag", (event) => {
                  const clampedX = Math.max(0, Math.min(width, event.x))
                  
                  // Store drag position
                  dragPositionRef.current[line.id] = clampedX
                  
                  // Update all elements in the group visually
                  const parent = d3.select(event.sourceEvent.target.parentNode as SVGGElement)
                  parent.select(".main-line")
                    .attr("x1", clampedX)
                    .attr("x2", clampedX)
                  
                  parent.select(".interactive-line")
                    .attr("x1", clampedX)
                    .attr("x2", clampedX)
                  
                  parent.select(".line-label")
                    .attr("x", clampedX + 3)
                  
                  parent.select(".line-handle")
                    .attr("cx", clampedX)
                })
                .on("end", (event) => {
                  const clampedX = Math.max(0, Math.min(width, event.x))
                  
                  let newValue: string | number
                  if ((editingChart.xAxisType || "datetime") === "datetime") {
                    const newDate = (xScale as d3.ScaleTime<number, number>).invert(clampedX)
                    newValue = newDate.toISOString().slice(0, 19)
                  } else {
                    // For time or parameter axis
                    const numValue = (xScale as d3.ScaleLinear<number, number>).invert(clampedX)
                    newValue = Math.round(numValue)
                  }
                  
                  // Keep visual position at dragged location
                  const parent = d3.select(event.sourceEvent.target.parentNode as SVGGElement)
                  parent.select(".main-line")
                    .attr("x1", clampedX)
                    .attr("x2", clampedX)
                  parent.select(".interactive-line")
                    .attr("x1", clampedX)
                    .attr("x2", clampedX)
                  parent.select(".line-label")
                    .attr("x", clampedX + 3)
                  parent.select(".line-handle")
                    .attr("cx", clampedX)
                  
                  // Clear dragging state
                  setDraggingLine(null)
                  setHoveredLine(null)
                  
                  // Clear drag position
                  delete dragPositionRef.current[line.id]
                  
                  // Update the data model after a frame to allow visual update to settle
                  requestAnimationFrame(() => {
                    isUpdatingRef.current = true
                    updateReferenceLine(line.id, newValue)
                    
                    // Reset flag after state update completes
                    requestAnimationFrame(() => {
                      isUpdatingRef.current = false
                    })
                  })
                })

              interactiveLine = group.append("line")
                .attr("class", "interactive-line")
                .attr("stroke", "transparent")
                .attr("stroke-width", 10)
                .style("cursor", "ew-resize")
                .on("mouseenter", () => setHoveredLine(line.id))
                .on("mouseleave", () => setHoveredLine(null))
                .call(drag)
            }
            
            interactiveLine
              .attr("x1", xPos)
              .attr("x2", xPos)
              .attr("y1", 0)
              .attr("y2", height)
          }
          
          // Update or create label - ensure it's always on top
          if (line.label && !isDragging) {
            let labelText = group.select<SVGTextElement>(".line-label")
            if (labelText.empty()) {
              labelText = group.append("text")
                .attr("class", "line-label")
                .style("font-size", "10px")
                .style("pointer-events", "none") // Ensure label doesn't interfere with dragging
            }
            labelText
              .attr("x", xPos + 3)
              .attr("y", 15)
              .attr("fill", color)
              .style("font-weight", isHovered ? "bold" : "normal")
              .text(line.label)
              .raise() // Bring to front
          } else if (!line.label) {
            group.select(".line-label").remove()
          }
          
          // Update or create handle
          if (isInteractive && (isHovered || isDragging)) {
            let handle = group.select<SVGCircleElement>(".line-handle")
            if (handle.empty()) {
              handle = group.append("circle")
                .attr("class", "line-handle")
                .attr("r", 4)
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("cursor", "ew-resize")
            }
            handle
              .attr("cx", xPos)
              .attr("cy", height / 2)
              .attr("fill", color)
              .raise() // Bring to front
          } else {
            group.select(".line-handle").remove()
          }
        }
      } else if (line.type === "horizontal") {
        // Horizontal reference line
        let yPos: number
        
        // Use drag position if we're dragging this line
        if (isDragging && dragPositionRef.current[line.id] !== undefined) {
          yPos = dragPositionRef.current[line.id]
        } else {
          const yValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
          yPos = yScale(yValue)
        }
        
        if (yPos >= 0 && yPos <= height) {
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
            .attr("stroke-width", isHovered || isDragging ? 2 : 1)
            .attr("stroke-dasharray", strokeDasharray)
            .attr("opacity", isHovered || isDragging ? 1 : 0.7)
            .style("transition", isDragging ? "none" : "all 0.2s ease")
          
          // Update or create interactive area
          if (isInteractive) {
            let interactiveLine = group.select<SVGLineElement>(".interactive-line")
            if (interactiveLine.empty()) {
              // Create drag behavior for horizontal lines
              const drag = d3.drag<SVGLineElement, unknown>()
                .on("start", () => {
                  setHoveredLine(line.id)
                  setDraggingLine({ id: line.id, type: "horizontal" })
                })
                .on("drag", (event) => {
                  const clampedY = Math.max(0, Math.min(height, event.y))
                  
                  // Store drag position
                  dragPositionRef.current[line.id] = clampedY
                  
                  // Update all elements in the group visually
                  const parent = d3.select(event.sourceEvent.target.parentNode as SVGGElement)
                  parent.select(".main-line")
                    .attr("y1", clampedY)
                    .attr("y2", clampedY)
                  
                  parent.select(".interactive-line")
                    .attr("y1", clampedY)
                    .attr("y2", clampedY)
                  
                  parent.select(".line-label")
                    .attr("y", clampedY - 3)
                  
                  parent.select(".line-handle")
                    .attr("cy", clampedY)
                })
                .on("end", (event) => {
                  const clampedY = Math.max(0, Math.min(height, event.y))
                  const newValue = Math.round(yScale.invert(clampedY))
                  
                  // Keep visual position at dragged location
                  const parent = d3.select(event.sourceEvent.target.parentNode as SVGGElement)
                  parent.select(".main-line")
                    .attr("y1", clampedY)
                    .attr("y2", clampedY)
                  parent.select(".interactive-line")
                    .attr("y1", clampedY)
                    .attr("y2", clampedY)
                  parent.select(".line-label")
                    .attr("y", clampedY - 3)
                  parent.select(".line-handle")
                    .attr("cy", clampedY)
                  
                  // Clear dragging state
                  setDraggingLine(null)
                  setHoveredLine(null)
                  
                  // Clear drag position
                  delete dragPositionRef.current[line.id]
                  
                  // Update the data model after a frame to allow visual update to settle
                  requestAnimationFrame(() => {
                    isUpdatingRef.current = true
                    updateReferenceLine(line.id, newValue)
                    
                    // Reset flag after state update completes
                    requestAnimationFrame(() => {
                      isUpdatingRef.current = false
                    })
                  })
                })

              interactiveLine = group.append("line")
                .attr("class", "interactive-line")
                .attr("stroke", "transparent")
                .attr("stroke-width", 10)
                .style("cursor", "ns-resize")
                .on("mouseenter", () => setHoveredLine(line.id))
                .on("mouseleave", () => setHoveredLine(null))
                .call(drag)
            }
            
            interactiveLine
              .attr("x1", 0)
              .attr("x2", width)
              .attr("y1", yPos)
              .attr("y2", yPos)
          }
          
          // Update or create label
          if (line.label && !isDragging) {
            let labelText = group.select<SVGTextElement>(".line-label")
            if (labelText.empty()) {
              labelText = group.append("text")
                .attr("class", "line-label")
                .style("font-size", "10px")
                .style("pointer-events", "none")
            }
            labelText
              .attr("x", 5)
              .attr("y", yPos - 3)
              .attr("fill", color)
              .style("font-weight", isHovered ? "bold" : "normal")
              .text(line.label)
              .raise()
          } else if (!line.label) {
            group.select(".line-label").remove()
          }
          
          // Update or create handle
          if (isInteractive && (isHovered || isDragging)) {
            let handle = group.select<SVGCircleElement>(".line-handle")
            if (handle.empty()) {
              handle = group.append("circle")
                .attr("class", "line-handle")
                .attr("r", 4)
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .style("cursor", "ns-resize")
            }
            handle
              .attr("cx", width / 2)
              .attr("cy", yPos)
              .attr("fill", color)
              .raise()
          } else {
            group.select(".line-handle").remove()
          }
        }
      }
    })
  }

  return null // This component doesn't render anything directly
}