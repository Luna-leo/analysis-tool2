"use client"

import React, { useEffect, useRef, useMemo, useCallback } from "react"
import * as d3 from "d3"
import { ChartComponent } from "@/types"
import { VerticalReferenceLine } from "./VerticalReferenceLine"
import { HorizontalReferenceLine } from "./HorizontalReferenceLine"
import { useReferenceLineDrag } from "./useReferenceLineDrag"
import { useFileStore } from "@/stores/useFileStore"

// Performance monitoring helper
const measurePerformance = (label: string, fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(`${label}-start`)
    fn()
    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)
  } else {
    fn()
  }
}

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
  const [dummyState, setDummyState] = React.useState(0) // For forcing re-renders
  const observerRef = useRef<MutationObserver | null>(null)
  
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
  
  // Track scale changes with fingerprinting - optimized to avoid JSON.stringify
  const scaleFingerprint = useMemo(() => {
    if (!scalesRef.current.xScale || !scalesRef.current.yScale) return null
    
    const xDomain = scalesRef.current.xScale.domain()
    const yDomain = scalesRef.current.yScale.domain()
    
    // Use primitive values for comparison instead of JSON.stringify
    const xd0 = xDomain[0] instanceof Date ? xDomain[0].getTime() : xDomain[0]
    const xd1 = xDomain[1] instanceof Date ? xDomain[1].getTime() : xDomain[1]
    
    return `${xd0}-${xd1}-${yDomain[0]}-${yDomain[1]}`
  }, [scalesRef.current.xScale, scalesRef.current.yScale, zoomVersion])

  useEffect(() => {
    if (!svgRef.current) return
    
    // Wait a bit for scales to be ready if they're not yet available
    if (!scalesRef.current.xScale || !scalesRef.current.yScale) {
      
      // Try again after a short delay
      const timer = setTimeout(() => {
        if (scalesRef.current.xScale && scalesRef.current.yScale && svgRef.current) {
          // Force re-render by updating a dummy state
          setDummyState(prev => prev + 1)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }

    const svg = d3.select(svgRef.current)
    const margin = margins || { top: 20, right: 40, bottom: 60, left: 60 }
    const width = (dimensions?.width || 400) - margin.left - margin.right
    const height = (dimensions?.height || 300) - margin.top - margin.bottom
    
    // Debug log dimensions and state
    if (process.env.NODE_ENV === 'development') {
    }

    const isInteractive = !!setEditingChart

    // Create or update clip path for reference lines
    const clipId = `reference-lines-clip-${editingChart.id}`
    let defs = svg.select<SVGDefsElement>("defs")
    if (defs.empty()) {
      defs = svg.append<SVGDefsElement>("defs")
    }
    
    let clipPath = defs.select<SVGClipPathElement>(`#${clipId}`)
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
    
    // Remove clip path - reference lines should extend to full plot area
    // clipGroup.attr("clip-path", `url(#${clipId})`)
    
    // Create a separate top-level layer for labels to ensure they're always on top
    let labelsTopLayer = svg.select<SVGGElement>(".reference-labels-top-layer")
    if (labelsTopLayer.empty()) {
      labelsTopLayer = svg
        .append<SVGGElement>("g")
        .attr("class", "reference-labels-top-layer")
        .style("pointer-events", isInteractive ? "auto" : "none")
    }
    
    // Update transform for labels layer too
    labelsTopLayer.attr("transform", `translate(${margin.left},${margin.top})`)
    
    // Create or select labels group within the top layer
    let labelsGroup = labelsTopLayer.select<SVGGElement>(".reference-labels-group")
    if (labelsGroup.empty()) {
      labelsGroup = labelsTopLayer
        .append<SVGGElement>("g")
        .attr("class", "reference-labels-group")
    }
    
    // Always draw reference lines with performance monitoring
    if (scalesRef.current.xScale && scalesRef.current.yScale) {
      measurePerformance('reference-lines-render', () => {
        drawReferenceLines(
          clipGroup,
          labelsGroup,
          scalesRef.current.xScale!,
          scalesRef.current.yScale!,
          width,
          height
        )
      })
    }
    
    // Ensure reference lines and labels are properly layered
    // Use requestAnimationFrame to batch DOM operations
    requestAnimationFrame(() => {
      // First raise the lines layer
      refLinesLayer.raise()
      // Then raise the labels layer to ensure it's always on top
      labelsTopLayer.raise()
      
      // Double-check by moving labels to the end if there are any elements after it
      const parent = labelsTopLayer.node()?.parentNode
      if (parent) {
        parent.appendChild(labelsTopLayer.node()!)
      }
    })
  }, [
    // Use specific properties to avoid unnecessary re-renders
    editingChart.referenceLines,
    editingChart.xAxisType,
    draggingLine,
    draggingLabel,
    svgRef,
    scaleFingerprint, // Track actual scale changes
    dimensions,
    margins,
    zoomVersion,
    dummyState // For forced re-renders when scales become available
  ])

  // Helper function to update reference lines in both UIStore and FileStore
  const updateReferenceLines = useCallback((updatedReferenceLines: typeof editingChart.referenceLines) => {
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
  }, [setEditingChart, updateFileCharts]) // Removed openTabs dependency - accessed via closure
  
  // Setup MutationObserver to ensure labels stay on top
  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = svgRef.current
    const labelsTopLayer = d3.select(svg).select(".reference-labels-top-layer")
    
    if (labelsTopLayer.empty()) return
    
    // Function to raise labels to top
    const raiseLabels = () => {
      const node = labelsTopLayer.node() as SVGGElement | null
      if (node && node.parentNode) {
        const parent = node.parentNode
        // Only move if not already the last child
        if (parent.lastChild !== node) {
          parent.appendChild(node)
        }
      }
    }
    
    // Create observer to watch for new elements being added
    const observer = new MutationObserver((mutations) => {
      let shouldRaise = false
      const labelsNode = labelsTopLayer.node() as SVGGElement | null
      if (!labelsNode) return
      
      // Only check if elements were added after our labels layer
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Get the position of our labels layer
          const labelsIndex = Array.from(svg.children).indexOf(labelsNode)
          
          for (const addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === Node.ELEMENT_NODE) {
              const addedIndex = Array.from(svg.children).indexOf(addedNode as Element)
              // Only raise if element was added after our labels layer
              if (addedIndex > labelsIndex) {
                shouldRaise = true
                break
              }
            }
          }
        }
        if (shouldRaise) break
      }
      
      if (shouldRaise) {
        requestAnimationFrame(raiseLabels)
      }
    })
    
    // Start observing the SVG for child list changes
    observer.observe(svg, {
      childList: true,
      subtree: false // Only watch direct children of SVG
    })
    
    observerRef.current = observer
    
    // Cleanup
    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [svgRef])

  const drawReferenceLines = useCallback((
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
  }, [updateReferenceLines]) // Memoized with stable dependency

  return null // This component doesn't render anything directly
}