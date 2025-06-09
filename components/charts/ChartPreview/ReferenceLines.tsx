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
  const [draggingLabel, setDraggingLabel] = React.useState<{ id: string; type: 'vertical' | 'horizontal' } | null>(null)
  const dragPositionRef = useRef<{ [key: string]: number }>({})
  const labelDragPositionRef = useRef<{ [key: string]: { x: number; y: number } }>({})
  
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
    draggingLine,
    draggingLabel,
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
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", strokeDasharray)
            .attr("opacity", 0.8)
          
          // Update or create interactive area
          if (isInteractive) {
            let interactiveLine = group.select<SVGLineElement>(".interactive-line")
            
            // Create drag behavior with proper context
            const currentLineId = line.id
            let labelOffsetX: number | null = null
            const drag = d3.drag<SVGLineElement, any>()
              .on("start", function() {
                setDraggingLine({ id: currentLineId, type: "vertical" })
                // Store the current label offset at drag start
                const currentGroup = d3.select(this.parentNode as SVGGElement)
                const currentLabel = currentGroup.select(".line-label")
                if (!currentLabel.empty()) {
                  const labelX = parseFloat(currentLabel.attr("x"))
                  const lineX = parseFloat(currentGroup.select(".main-line").attr("x1"))
                  labelOffsetX = labelX - lineX
                }
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
                const currentLabel = currentGroup.select(".line-label")
                if (!currentLabel.empty() && labelOffsetX !== null) {
                  // Update label position maintaining the offset
                  currentLabel
                    .attr("x", clampedX + labelOffsetX)
                }
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
            }
            
            // Re-apply drag behavior (D3 will automatically replace existing drag)
            interactiveLine.call(drag)
            
            interactiveLine
              .attr("x1", xPos)
              .attr("x2", xPos)
              .attr("y1", 0)
              .attr("y2", height)
          }
          
          // Update or create label - ensure it's always on top
          if (line.label) {
            let labelText = group.select<SVGTextElement>(".line-label")
            
            // Calculate label position
            let labelX = xPos + 3
            let labelY = 15
            
            // Use drag position if label is being dragged
            if (draggingLabel?.id === line.id && labelDragPositionRef.current[line.id]) {
              labelX = labelDragPositionRef.current[line.id].x
              labelY = labelDragPositionRef.current[line.id].y
            } else if (line.labelOffset) {
              // Use saved offset
              labelX = xPos + (line.labelOffset.x || 3)
              labelY = line.labelOffset.y || 15
            }
            
            if (labelText.empty()) {
              labelText = group.append("text")
                .attr("class", "line-label")
                .style("font-size", "10px")
                .style("cursor", "move")
            }
            
            // Create label drag behavior
            if (isInteractive) {
              const currentLineId = line.id
              const labelDrag = d3.drag<SVGTextElement, any>()
                .on("start", function() {
                  setDraggingLabel({ id: currentLineId, type: "vertical" })
                  // Store initial position
                  const currentX = parseFloat(d3.select(this).attr("x"))
                  const currentY = parseFloat(d3.select(this).attr("y"))
                  labelDragPositionRef.current[currentLineId] = { x: currentX, y: currentY }
                })
                .on("drag", function(event) {
                  // Update label position during drag
                  const newX = event.x
                  const newY = event.y
                  
                  labelDragPositionRef.current[currentLineId] = { x: newX, y: newY }
                  
                  d3.select(this)
                    .attr("x", newX)
                    .attr("y", newY)
                })
                .on("end", function(event) {
                  // Calculate offset from line position
                  const lineX = xScale(line.type === "vertical" && editingChartRef.current.xAxisType === "datetime" 
                    ? new Date(line.value as string)
                    : (line.value as number))
                  const offsetX = event.x - lineX
                  const offsetY = event.y
                  
                  // Clear dragging state
                  setDraggingLabel(null)
                  
                  // Update the data model with label offset
                  if (setEditingChart) {
                    const currentChart = editingChartRef.current
                    const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
                      refLine.id === currentLineId 
                        ? { ...refLine, labelOffset: { x: offsetX, y: offsetY } } 
                        : refLine
                    )
                    
                    setEditingChart({
                      ...currentChart,
                      referenceLines: updatedReferenceLines
                    })
                    
                    // Clear drag position
                    setTimeout(() => {
                      delete labelDragPositionRef.current[currentLineId]
                    }, 100)
                  }
                })
                
              labelText.call(labelDrag)
            }
            
            labelText
              .attr("x", labelX)
              .attr("y", labelY)
              .attr("fill", color)
              .style("font-weight", "normal")
              .text(line.label)
              .raise() // Bring to front
          } else {
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
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", strokeDasharray)
            .attr("opacity", 0.8)
          
          // Update or create interactive area
          if (isInteractive) {
            let interactiveLine = group.select<SVGLineElement>(".interactive-line")
            
            // Create drag behavior with proper context
            const currentLineId = line.id
            let labelOffsetY: number | null = null
            const drag = d3.drag<SVGLineElement, any>()
              .on("start", function() {
                setDraggingLine({ id: currentLineId, type: "horizontal" })
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
                
                // Clear dragging state
                setDraggingLine(null)
                
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
            if (draggingLabel?.id === line.id && labelDragPositionRef.current[line.id]) {
              labelX = labelDragPositionRef.current[line.id].x
              labelY = labelDragPositionRef.current[line.id].y
            } else if (line.labelOffset) {
              // Use saved offset
              labelX = line.labelOffset.x || 5
              labelY = yPos + (line.labelOffset.y || -3)
            }
            
            if (labelText.empty()) {
              labelText = group.append("text")
                .attr("class", "line-label")
                .style("font-size", "10px")
                .style("cursor", "move")
            }
            
            // Create label drag behavior
            if (isInteractive) {
              const currentLineId = line.id
              const labelDrag = d3.drag<SVGTextElement, any>()
                .on("start", function() {
                  setDraggingLabel({ id: currentLineId, type: "horizontal" })
                  // Store initial position
                  const currentX = parseFloat(d3.select(this).attr("x"))
                  const currentY = parseFloat(d3.select(this).attr("y"))
                  labelDragPositionRef.current[currentLineId] = { x: currentX, y: currentY }
                })
                .on("drag", function(event) {
                  // Update label position during drag
                  const newX = event.x
                  const newY = event.y
                  
                  labelDragPositionRef.current[currentLineId] = { x: newX, y: newY }
                  
                  d3.select(this)
                    .attr("x", newX)
                    .attr("y", newY)
                })
                .on("end", function(event) {
                  // Calculate offset from line position
                  const lineY = yScale(line.value as number)
                  const offsetX = event.x
                  const offsetY = event.y - lineY
                  
                  // Clear dragging state
                  setDraggingLabel(null)
                  
                  // Update the data model with label offset
                  if (setEditingChart) {
                    const currentChart = editingChartRef.current
                    const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
                      refLine.id === currentLineId 
                        ? { ...refLine, labelOffset: { x: offsetX, y: offsetY } } 
                        : refLine
                    )
                    
                    setEditingChart({
                      ...currentChart,
                      referenceLines: updatedReferenceLines
                    })
                    
                    // Clear drag position
                    setTimeout(() => {
                      delete labelDragPositionRef.current[currentLineId]
                    }, 100)
                  }
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
      }
    })
  }

  return null // This component doesn't render anything directly
}