"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ChartComponent } from "@/types"
import { VerticalReferenceLine } from "./VerticalReferenceLine"
import { HorizontalReferenceLine } from "./HorizontalReferenceLine"
import { useReferenceLineDrag } from "./useReferenceLineDrag"

interface ReferenceLinesProps {
  svgRef: React.RefObject<SVGSVGElement | null>
  editingChart: ChartComponent
  setEditingChart?: (chart: ChartComponent) => void
  scalesRef: React.MutableRefObject<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
    yScale: d3.ScaleLinear<number, number> | null
  }>
  dimensions?: { width: number; height: number }
  margins?: { top: number; right: number; bottom: number; left: number }
}

export function ReferenceLines({ svgRef, editingChart, setEditingChart, scalesRef, dimensions, margins }: ReferenceLinesProps) {
  const {
    draggingLine,
    draggingLabel,
    startLineDrag,
    updateLineDragPosition,
    endLineDrag,
    clearLineDragPosition,
    startLabelDrag,
    updateLabelDragPosition,
    endLabelDrag,
    clearLabelDragPosition,
    getLineDragPosition,
    getLabelDragPosition,
    isLineDragging,
    isLabelDragging
  } = useReferenceLineDrag()
  
  // Keep a ref to the current editingChart to avoid closure issues
  const editingChartRef = useRef<ChartComponent>(editingChart)
  
  useEffect(() => {
    editingChartRef.current = editingChart
  }, [editingChart])

  useEffect(() => {
    if (!svgRef.current || !scalesRef.current.xScale || !scalesRef.current.yScale) return

    const svg = d3.select(svgRef.current)
    const margin = margins || { top: 20, right: 40, bottom: 60, left: 60 }
    const width = (dimensions?.width || 400) - margin.left - margin.right
    const height = (dimensions?.height || 300) - margin.top - margin.bottom

    const isInteractive = !!setEditingChart

    // Ensure reference lines layer exists at the SVG level, not inside main chart group
    let refLinesLayer = svg.select<SVGGElement>(".reference-lines-layer")
    if (refLinesLayer.empty()) {
      refLinesLayer = svg
        .append<SVGGElement>("g")
        .attr("class", "reference-lines-layer")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .style("pointer-events", isInteractive ? "auto" : "none")
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
    scalesRef,
    dimensions
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
      
      if (line.type === "vertical") {
        VerticalReferenceLine({
          line,
          group,
          xScale,
          width,
          height,
          xAxisType: editingChartRef.current.xAxisType,
          isInteractive,
          isDragging: isLineDragging(line.id),
          dragPosition: getLineDragPosition(line.id),
          onDragStart: () => startLineDrag(line.id, "vertical"),
          onDrag: (x) => updateLineDragPosition(line.id, x),
          onDragEnd: (newValue) => {
            endLineDrag()
            
            // Update the data model with the current chart state
            if (setEditingChart) {
              // Get the current reference lines from the ref to ensure we have the latest state
              const currentChart = editingChartRef.current
              const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
                refLine.id === line.id ? { ...refLine, value: newValue } : refLine
              )
              
              setEditingChart({
                ...currentChart,
                referenceLines: updatedReferenceLines
              })
              
              // Clear drag position after a small delay to ensure the update has been processed
              setTimeout(() => {
                clearLineDragPosition(line.id)
              }, 100)
            }
          },
          isLabelDragging: isLabelDragging(line.id),
          labelDragPosition: getLabelDragPosition(line.id),
          onLabelDragStart: () => {
            const labelEl = group.select(".line-label")
            if (!labelEl.empty()) {
              const x = parseFloat(labelEl.attr("x"))
              const y = parseFloat(labelEl.attr("y"))
              startLabelDrag(line.id, "vertical", x, y)
            }
          },
          onLabelDrag: (x, y) => updateLabelDragPosition(line.id, x, y),
          onLabelDragEnd: (offsetX, offsetY) => {
            endLabelDrag()
            
            // Update the data model with label offset
            if (setEditingChart) {
              const currentChart = editingChartRef.current
              const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
                refLine.id === line.id 
                  ? { ...refLine, labelOffset: { x: offsetX, y: offsetY } } 
                  : refLine
              )
              
              setEditingChart({
                ...currentChart,
                referenceLines: updatedReferenceLines
              })
              
              // Clear drag position
              setTimeout(() => {
                clearLabelDragPosition(line.id)
              }, 100)
            }
          }
        })
      } else if (line.type === "horizontal") {
        HorizontalReferenceLine({
          line,
          group,
          yScale,
          width,
          height,
          isInteractive,
          isDragging: isLineDragging(line.id),
          dragPosition: getLineDragPosition(line.id),
          onDragStart: () => startLineDrag(line.id, "horizontal"),
          onDrag: (y) => updateLineDragPosition(line.id, y),
          onDragEnd: (newValue) => {
            endLineDrag()
            
            // Update the data model with the current chart state
            if (setEditingChart) {
              // Get the current reference lines from the ref to ensure we have the latest state
              const currentChart = editingChartRef.current
              const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
                refLine.id === line.id ? { ...refLine, value: newValue } : refLine
              )
              
              setEditingChart({
                ...currentChart,
                referenceLines: updatedReferenceLines
              })
              
              // Clear drag position after a small delay to ensure the update has been processed
              setTimeout(() => {
                clearLineDragPosition(line.id)
              }, 100)
            }
          },
          isLabelDragging: isLabelDragging(line.id),
          labelDragPosition: getLabelDragPosition(line.id),
          onLabelDragStart: () => {
            const labelEl = group.select(".line-label")
            if (!labelEl.empty()) {
              const x = parseFloat(labelEl.attr("x"))
              const y = parseFloat(labelEl.attr("y"))
              startLabelDrag(line.id, "horizontal", x, y)
            }
          },
          onLabelDrag: (x, y) => updateLabelDragPosition(line.id, x, y),
          onLabelDragEnd: (offsetX, offsetY) => {
            endLabelDrag()
            
            // Update the data model with label offset
            if (setEditingChart) {
              const currentChart = editingChartRef.current
              const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
                refLine.id === line.id 
                  ? { ...refLine, labelOffset: { x: offsetX, y: offsetY } } 
                  : refLine
              )
              
              setEditingChart({
                ...currentChart,
                referenceLines: updatedReferenceLines
              })
              
              // Clear drag position
              setTimeout(() => {
                clearLabelDragPosition(line.id)
              }, 100)
            }
          }
        })
      }
    })
  }

  return null // This component doesn't render anything directly
}