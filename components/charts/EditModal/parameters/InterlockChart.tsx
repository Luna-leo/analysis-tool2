"use client"

import React, { useRef, useEffect, useCallback } from "react"
import * as d3 from "d3"
import { InterlockThreshold } from "@/types"

interface InterlockChartProps {
  name: string
  xParameter: string
  xUnit: string
  yUnit: string
  thresholds: InterlockThreshold[]
  lineType: "linear" | "step" | "stepBefore" | "stepAfter"
  width?: number
  height?: number
}

export function InterlockChart({
  name,
  xParameter,
  xUnit,
  yUnit,
  thresholds,
  lineType,
  width = 800,
  height = 400
}: InterlockChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const drawChart = useCallback(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 50, right: 30, bottom: 70, left: 80 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Get all X and Y values for scaling
    const allXValues = new Set<number>()
    const allYValues = new Set<number>()
    
    thresholds.forEach(threshold => {
      threshold.points.forEach(point => {
        allXValues.add(point.x)
        allYValues.add(point.y)
      })
    })

    // Set appropriate domain based on actual data
    let xExtent: [number, number] = [0, 10]
    let yExtent: [number, number] = [0, 10]
    
    if (allXValues.size > 0 && allYValues.size > 0) {
      const xValues = Array.from(allXValues)
      const yValues = Array.from(allYValues)
      
      xExtent = d3.extent(xValues) as [number, number]
      yExtent = d3.extent(yValues) as [number, number]
      
      // Ensure minimum range for better visualization
      const minXRange = 10
      const minYRange = 5
      
      if ((xExtent[1] - xExtent[0]) < minXRange) {
        const center = (xExtent[0] + xExtent[1]) / 2
        xExtent = [center - minXRange / 2, center + minXRange / 2]
      }
      
      if ((yExtent[1] - yExtent[0]) < minYRange) {
        const center = (yExtent[0] + yExtent[1]) / 2
        yExtent = [center - minYRange / 2, center + minYRange / 2]
      }
    }

    // Add minimal padding to the extents (5% instead of 10%)
    const xRange = xExtent[1] - xExtent[0]
    const yRange = yExtent[1] - yExtent[0]
    const xPadding = Math.max(xRange * 0.05, 1)
    const yPadding = Math.max(yRange * 0.05, 0.5)

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, chartWidth])

    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([chartHeight, 0])

    // Create main group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Add grid lines
    const xAxisGrid = d3.axisBottom(xScale)
      .tickSize(-chartHeight)
      .tickFormat("")

    const yAxisGrid = d3.axisLeft(yScale)
      .tickSize(-chartWidth)
      .tickFormat("")

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxisGrid)
      .selectAll("line")
      .style("stroke", "#e0e0e0")
      .style("stroke-width", "1px")
      .style("opacity", 0.7)

    g.append("g")
      .attr("class", "grid")
      .call(yAxisGrid)
      .selectAll("line")
      .style("stroke", "#e0e0e0")
      .style("stroke-width", "1px")
      .style("opacity", 0.7)

    // Add axes with larger font sizes
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "14px")

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "14px")

    // Add title (left-aligned)
    g.append("text")
      .attr("transform", `translate(0, -30)`)
      .style("text-anchor", "start")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text(name || "New Interlock Registration")

    // Add axis labels
    g.append("text")
      .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 60})`)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .text(xParameter ? `${xParameter} (${xUnit || ''})` : 'X')

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20)
      .attr("x", 0 - (chartHeight / 2))
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .text(yUnit ? `Y (${yUnit})` : 'Y')

    // Draw threshold lines with selected curve type
    const getCurveType = () => {
      switch (lineType) {
        case "step":
          return d3.curveStep
        case "stepBefore":
          return d3.curveStepBefore
        case "stepAfter":
          return d3.curveStepAfter
        case "linear":
        default:
          return d3.curveLinear
      }
    }

    const line = d3.line<{x: number, y: number}>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(getCurveType())

    // Always show all thresholds in the graph
    thresholds.forEach(threshold => {
      // Sort points by x value for proper line drawing
      const sortedPoints = [...threshold.points].sort((a, b) => a.x - b.x)
      
      if (sortedPoints.length > 0) {
        g.append("path")
          .datum(sortedPoints)
          .attr("fill", "none")
          .attr("stroke", threshold.color)
          .attr("stroke-width", 3)
          .attr("d", line)

        // Add points
        g.selectAll(`.point-${threshold.id}`)
          .data(sortedPoints)
          .enter().append("circle")
          .attr("class", `point-${threshold.id}`)
          .attr("cx", d => xScale(d.x))
          .attr("cy", d => yScale(d.y))
          .attr("r", 4)
          .attr("fill", threshold.color)
      }
    })

    // Legend removed - using ThresholdColorSection below the graph instead
  }, [thresholds, xParameter, xUnit, yUnit, name, lineType, width, height])

  // Draw chart when props change
  useEffect(() => {
    // Add a small delay to ensure SVG is ready
    const timer = setTimeout(() => {
      drawChart()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [drawChart])

  return (
    <div className="w-full h-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-white"
        style={{ maxWidth: '100%', display: 'block' }}
      />
    </div>
  )
}