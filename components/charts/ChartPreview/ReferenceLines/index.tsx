"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ChartComponent } from "@/types"
import { VerticalReferenceLine } from "./VerticalReferenceLine"
import { HorizontalReferenceLine } from "./HorizontalReferenceLine"
import { useReferenceLineDrag } from "./useReferenceLineDrag"
import { useFileStore } from "@/stores/useFileStore"

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
  zoomVersion?: number
}

export function ReferenceLines({ svgRef, editingChart, setEditingChart, scalesRef, dimensions, margins, zoomVersion }: ReferenceLinesProps) {
  const { updateFileCharts, openTabs } = useFileStore()
  
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

    // Create or update clip path for reference lines
    const clipId = `reference-lines-clip-${editingChart.id}`
    let defs = svg.select("defs")
    if (defs.empty()) {
      defs = svg.append("defs")
    }
    
    let clipPath = defs.select(`#${clipId}`)
    if (clipPath.empty()) {
      clipPath = defs.append("clipPath")
        .attr("id", clipId)
    }
    
    // Update clip path rectangle to match plot area
    clipPath.selectAll("rect").remove()
    clipPath.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)

    // Ensure reference lines layer exists at the SVG level, not inside main chart group
    let refLinesLayer = svg.select<SVGGElement>(".reference-lines-layer")
    if (refLinesLayer.empty()) {
      refLinesLayer = svg
        .append<SVGGElement>("g")
        .attr("class", "reference-lines-layer")
        .style("pointer-events", isInteractive ? "auto" : "none")
    }
    
    // Update transform to match the current margin (this ensures lines stay aligned with the chart)
    refLinesLayer.attr("transform", `translate(${margin.left},${margin.top})`)
    
    // Create or select clip group for lines
    let clipGroup = refLinesLayer.select<SVGGElement>(".reference-lines-clip-group")
    if (clipGroup.empty()) {
      clipGroup = refLinesLayer
        .append<SVGGElement>("g")
        .attr("class", "reference-lines-clip-group")
    }
    
    // Apply clip path to lines group only
    clipGroup.attr("clip-path", `url(#${clipId})`)
    
    // Create or select labels group (no clip path)
    let labelsGroup = refLinesLayer.select<SVGGElement>(".reference-labels-group")
    if (labelsGroup.empty()) {
      labelsGroup = refLinesLayer
        .append<SVGGElement>("g")
        .attr("class", "reference-labels-group")
        .style("pointer-events", isInteractive ? "auto" : "none")
    }
    
    // Always bring reference lines layer to front
    // Use setTimeout to ensure this happens after all chart rendering
    setTimeout(() => {
      refLinesLayer.raise()
    }, 0)

    
    // Always draw reference lines
    drawReferenceLines(
      clipGroup,
      labelsGroup,
      scalesRef.current.xScale,
      scalesRef.current.yScale,
      width,
      height
    )
    
    // Ensure reference lines are on top after drawing
    // This is important because chart rendering might have added elements after our layer
    refLinesLayer.raise()
  }, [
    // Use specific properties to avoid unnecessary re-renders
    editingChart.referenceLines,
    editingChart.xAxisType,
    draggingLine,
    draggingLabel,
    svgRef,
    scalesRef,
    dimensions,
    margins,
    zoomVersion
  ])

  // Helper function to update reference lines in both UIStore and FileStore
  const updateReferenceLines = (updatedReferenceLines: typeof editingChart.referenceLines) => {
    if (!setEditingChart) return
    
    const currentChart = editingChartRef.current
    
    // Update UIStore
    setEditingChart({
      ...currentChart,
      referenceLines: updatedReferenceLines
    })
    
    // Also update FileStore for immediate reflection in Chart Grid
    const fileId = currentChart.fileId
    if (fileId) {
      const currentFile = openTabs.find(tab => tab.id === fileId)
      if (currentFile && currentFile.charts) {
        const updatedCharts = currentFile.charts.map(c => 
          c.id === currentChart.id 
            ? { ...c, referenceLines: updatedReferenceLines }
            : c
        )
        updateFileCharts(fileId, updatedCharts)
      }
    }
  }

  const drawReferenceLines = (
    linesGroup: d3.Selection<SVGGElement, unknown, null, undefined>, 
    labelsGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    width: number, 
    height: number
  ) => {
    const referenceLines = editingChartRef.current.referenceLines || []
    const isInteractive = !!setEditingChart
    
    // Data join for line groups (in clip area)
    const lineGroups = linesGroup.selectAll<SVGGElement, typeof referenceLines[0]>(".reference-line-group")
      .data(referenceLines, d => d.id)
    
    // Data join for label groups (outside clip area)
    const labelGroups = labelsGroup.selectAll<SVGGElement, typeof referenceLines[0]>(".reference-label-group")
      .data(referenceLines, d => d.id)
    
    // Remove exit selections
    lineGroups.exit().remove()
    labelGroups.exit().remove()
    
    // Enter selection for lines
    const lineGroupsEnter = lineGroups.enter()
      .append("g")
      .attr("class", "reference-line-group")
      .attr("data-line-id", d => d.id)
    
    // Enter selection for labels
    const labelGroupsEnter = labelGroups.enter()
      .append("g")
      .attr("class", "reference-label-group")
      .attr("data-line-id", d => d.id)
    
    // Merge enter and update selections
    const allLineGroups = lineGroupsEnter.merge(lineGroups)
    const allLabelGroups = labelGroupsEnter.merge(labelGroups)
    
    // Update each line group
    allLineGroups.each(function(line, index) {
      const lineGroup = d3.select(this)
      // Get corresponding label group
      const labelGroup = d3.select(allLabelGroups.nodes()[index])
      
      if (line.type === "vertical") {
        VerticalReferenceLine({
          line,
          group: lineGroup,
          labelGroup,
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
            const currentChart = editingChartRef.current
            const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
              refLine.id === line.id ? { ...refLine, value: newValue } : refLine
            )
            
            updateReferenceLines(updatedReferenceLines)
            
            // Clear drag position immediately
            clearLineDragPosition(line.id)
          },
          isLabelDragging: isLabelDragging(line.id),
          labelDragPosition: getLabelDragPosition(line.id),
          onLabelDragStart: () => {
            const labelEl = labelGroup.select(".line-label")
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
            const currentChart = editingChartRef.current
            const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
              refLine.id === line.id 
                ? { ...refLine, labelOffset: { x: offsetX, y: offsetY } } 
                : refLine
            )
            
            updateReferenceLines(updatedReferenceLines)
            
            // Clear drag position immediately
            clearLabelDragPosition(line.id)
          }
        })
      } else if (line.type === "horizontal") {
        HorizontalReferenceLine({
          line,
          group: lineGroup,
          labelGroup,
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
            const currentChart = editingChartRef.current
            const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
              refLine.id === line.id ? { ...refLine, value: newValue } : refLine
            )
            
            updateReferenceLines(updatedReferenceLines)
            
            // Clear drag position immediately
            clearLineDragPosition(line.id)
          },
          isLabelDragging: isLabelDragging(line.id),
          labelDragPosition: getLabelDragPosition(line.id),
          onLabelDragStart: () => {
            const labelEl = labelGroup.select(".line-label")
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
            const currentChart = editingChartRef.current
            const updatedReferenceLines = (currentChart.referenceLines || []).map((refLine) => 
              refLine.id === line.id 
                ? { ...refLine, labelOffset: { x: offsetX, y: offsetY } } 
                : refLine
            )
            
            updateReferenceLines(updatedReferenceLines)
            
            // Clear drag position immediately
            clearLabelDragPosition(line.id)
          }
        })
      }
    })
  }

  return null // This component doesn't render anything directly
}