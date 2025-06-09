"use client"

import React, { useEffect, useRef } from "react"
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
  const dragPositionRef = useRef<{ [key: string]: number }>({})
  const isDraggingRef = useRef<boolean>(false)
  
  // Keep a ref to the current editingChart to avoid closure issues
  const editingChartRef = useRef<ChartComponent>(editingChart)
  
  useEffect(() => {
    editingChartRef.current = editingChart
  }, [editingChart])


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

    // Always draw reference lines
    drawReferenceLines(
      refLinesLayer,
      scalesRef.current.xScale,
      scalesRef.current.yScale,
      width,
      height
    )
  }, [
    // Use specific properties to avoid unnecessary re-renders
    editingChart.referenceLines,
    editingChart.xAxisType,
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
    const referenceLines = editingChartRef.current.referenceLines || []
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
        
        // Use drag position only if this specific line is currently being dragged
        if (draggingLine?.id === line.id && dragPositionRef.current[line.id] !== undefined) {
          xPos = dragPositionRef.current[line.id]
        } else {
          if ((editingChartRef.current.xAxisType || "datetime") === "datetime") {
            // Skip empty string values
            if (!line.value || line.value === "") {
              console.warn('Empty date value for vertical reference line')
              return
            }
            const date = new Date(line.value)
            if (!isNaN(date.getTime())) {
              xPos = xScale(date)
            } else {
              console.warn('Invalid date for vertical reference line:', line.value)
              return
            }
          } else if ((editingChartRef.current.xAxisType || "datetime") === "time") {
            // For time axis, value should be in minutes
            const minutes = typeof line.value === 'number' ? line.value : parseFloat(line.value)
            if (isNaN(minutes)) {
              console.warn('Invalid time value for vertical reference line:', line.value)
              return
            }
            xPos = (xScale as d3.ScaleLinear<number, number>)(minutes)
          } else {
            // For parameter axis, value should be 0-100
            const paramValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
            if (isNaN(paramValue)) {
              console.warn('Invalid parameter value for vertical reference line:', line.value)
              return
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
            
            // Create drag behavior with proper context
            const currentLineId = line.id
            const drag = d3.drag<SVGLineElement, any>()
              .on("start", function() {
                setHoveredLine(currentLineId)
                setDraggingLine({ id: currentLineId, type: "vertical" })
                isDraggingRef.current = true
              })
              .on("drag", function(event) {
                const clampedX = Math.max(0, Math.min(width, event.x))
                
                // Store drag position
                dragPositionRef.current[currentLineId] = clampedX
                
                // Update visual elements directly without re-render
                const currentGroup = d3.select(this.parentNode as SVGGElement)
                currentGroup.select(".main-line")
                  .attr("x1", clampedX)
                  .attr("x2", clampedX)
                currentGroup.select(".interactive-line")
                  .attr("x1", clampedX)
                  .attr("x2", clampedX)
                currentGroup.select(".line-label")
                  .attr("x", clampedX + 3)
              })
              .on("end", function(event) {
                const clampedX = Math.max(0, Math.min(width, event.x))
                
                let newValue: string | number
                if ((editingChartRef.current.xAxisType || "datetime") === "datetime") {
                  const newDate = (xScale as d3.ScaleTime<number, number>).invert(clampedX)
                  newValue = newDate.toISOString().slice(0, 19)
                } else {
                  // For time or parameter axis
                  const numValue = (xScale as d3.ScaleLinear<number, number>).invert(clampedX)
                  newValue = Math.round(numValue)
                }
                
                // Clear dragging state
                setDraggingLine(null)
                setHoveredLine(null)
                isDraggingRef.current = false
                
                // Update the data model with the current chart state
                if (setEditingChart) {
                  // Get the current reference lines from the ref to ensure we have the latest state
                  const currentChart = editingChartRef.current
                  const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
                    refLine.id === currentLineId ? { ...refLine, value: newValue } : refLine
                  )
                  
                  setEditingChart({
                    ...currentChart,
                    referenceLines: updatedReferenceLines
                  })
                  
                  // Clear drag position after a small delay to ensure the update has been processed
                  setTimeout(() => {
                    delete dragPositionRef.current[currentLineId]
                  }, 100)
                }
              })
            
            if (interactiveLine.empty()) {
              interactiveLine = group.append("line")
                .attr("class", "interactive-line")
                .attr("stroke", "transparent")
                .attr("stroke-width", 10)
                .style("cursor", "ew-resize")
                .on("mouseenter", () => setHoveredLine(currentLineId))
                .on("mouseleave", () => {
                  if (!draggingLine || draggingLine.id !== currentLineId) {
                    setHoveredLine(null)
                  }
                })
            }
            
            // Always re-apply drag behavior to ensure it's properly bound
            interactiveLine.call(drag)
            
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
          
          // Remove any existing handle (no handle for vertical lines)
          group.select(".line-handle").remove()
        }
      } else if (line.type === "horizontal") {
        // Horizontal reference line
        let yPos: number
        
        // Use drag position only if this specific line is currently being dragged
        if (draggingLine?.id === line.id && dragPositionRef.current[line.id] !== undefined) {
          yPos = dragPositionRef.current[line.id]
        } else {
          const yValue = typeof line.value === 'number' ? line.value : parseFloat(line.value)
          if (isNaN(yValue)) {
            console.warn('Invalid y value for horizontal reference line:', line.value)
            return
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
            .attr("stroke-width", isHovered || isDragging ? 2 : 1)
            .attr("stroke-dasharray", strokeDasharray)
            .attr("opacity", isHovered || isDragging ? 1 : 0.7)
            .style("transition", isDragging ? "none" : "all 0.2s ease")
          
          // Update or create interactive area
          if (isInteractive) {
            let interactiveLine = group.select<SVGLineElement>(".interactive-line")
            
            // Create drag behavior with proper context
            const currentLineId = line.id
            const drag = d3.drag<SVGLineElement, any>()
              .on("start", function() {
                setHoveredLine(currentLineId)
                setDraggingLine({ id: currentLineId, type: "horizontal" })
                isDraggingRef.current = true
              })
              .on("drag", function(event) {
                const clampedY = Math.max(0, Math.min(height, event.y))
                
                // Store drag position
                dragPositionRef.current[currentLineId] = clampedY
                
                // Update visual elements directly without re-render
                const currentGroup = d3.select(this.parentNode as SVGGElement)
                currentGroup.select(".main-line")
                  .attr("y1", clampedY)
                  .attr("y2", clampedY)
                currentGroup.select(".interactive-line")
                  .attr("y1", clampedY)
                  .attr("y2", clampedY)
                currentGroup.select(".line-label")
                  .attr("y", clampedY - 3)
              })
              .on("end", function(event) {
                const clampedY = Math.max(0, Math.min(height, event.y))
                let newValue = yScale.invert(clampedY)
                
                // Ensure the value is within the scale domain
                const [minDomain, maxDomain] = yScale.domain()
                newValue = Math.max(minDomain, Math.min(maxDomain, newValue))
                newValue = Math.round(newValue)
                
                // Clear dragging state
                setDraggingLine(null)
                setHoveredLine(null)
                isDraggingRef.current = false
                
                // Update the data model with the current chart state
                if (setEditingChart) {
                  // Get the current reference lines from the ref to ensure we have the latest state
                  const currentChart = editingChartRef.current
                  const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
                    refLine.id === currentLineId ? { ...refLine, value: newValue } : refLine
                  )
                  
                  setEditingChart({
                    ...currentChart,
                    referenceLines: updatedReferenceLines
                  })
                  
                  // Clear drag position after a small delay to ensure the update has been processed
                  setTimeout(() => {
                    delete dragPositionRef.current[currentLineId]
                  }, 100)
                }
              })
            
            if (interactiveLine.empty()) {
              interactiveLine = group.append("line")
                .attr("class", "interactive-line")
                .attr("stroke", "transparent")
                .attr("stroke-width", 10)
                .style("cursor", "ns-resize")
                .on("mouseenter", () => setHoveredLine(currentLineId))
                .on("mouseleave", () => {
                  if (!draggingLine || draggingLine.id !== currentLineId) {
                    setHoveredLine(null)
                  }
                })
            }
            
            // Always re-apply drag behavior to ensure it's properly bound
            interactiveLine.call(drag)
            
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
          
          // Remove any existing handle (no handle for horizontal lines)
          group.select(".line-handle").remove()
        }
      }
    })
  }

  return null // This component doesn't render anything directly
}