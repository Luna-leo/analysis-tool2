"use client"

import React, { useState, useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function DebugZoomPage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 })
  const [selection, setSelection] = useState<{ start: [number, number] | null, end: [number, number] | null }>({ start: null, end: null })
  
  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const width = 800
    const height = 400
    const margin = { top: 20, right: 20, bottom: 40, left: 40 }
    
    // Clear previous content
    svg.selectAll("*").remove()
    
    // Add background
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#f3f4f6")
    
    // Add plot area
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom
    
    svg.append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", plotWidth)
      .attr("height", plotHeight)
      .attr("fill", "white")
      .attr("stroke", "#e5e7eb")
    
    // Add grid lines
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, plotWidth])
    
    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([plotHeight, 0])
    
    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${plotHeight})`)
      .call(d3.axisBottom(xScale))
    
    g.append("g")
      .call(d3.axisLeft(yScale))
    
    // Add test points
    const data = Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100
    }))
    
    const dataGroup = g.append("g").attr("class", "data-group")
    
    dataGroup.selectAll("circle")
      .data(data)
      .enter().append("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 4)
      .attr("fill", "#3b82f6")
    
    // Setup zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        const { transform } = event
        setTransform({ k: transform.k, x: transform.x, y: transform.y })
        dataGroup.attr("transform", transform.toString())
      })
    
    svg.call(zoom)
    
    // Range selection
    let isSelecting = false
    let startPoint: [number, number] | null = null
    
    svg.on("mousedown", function(event) {
      if (!event.shiftKey) return
      
      const [x, y] = d3.pointer(event, this)
      startPoint = [x - margin.left, y - margin.top]
      isSelecting = true
      setSelection({ start: startPoint, end: startPoint })
      event.preventDefault()
    })
    
    svg.on("mousemove", function(event) {
      if (!isSelecting || !startPoint) return
      
      const [x, y] = d3.pointer(event, this)
      const endPoint: [number, number] = [x - margin.left, y - margin.top]
      setSelection({ start: startPoint, end: endPoint })
    })
    
    svg.on("mouseup", function(event) {
      if (!isSelecting || !startPoint) return
      
      const [x, y] = d3.pointer(event, this)
      const endPoint: [number, number] = [x - margin.left, y - margin.top]
      
      // Calculate zoom
      const x0 = Math.min(startPoint[0], endPoint[0])
      const x1 = Math.max(startPoint[0], endPoint[0])
      const y0 = Math.min(startPoint[1], endPoint[1])
      const y1 = Math.max(startPoint[1], endPoint[1])
      
      if (x1 - x0 > 10 && y1 - y0 > 10) {
        const scaleX = plotWidth / (x1 - x0)
        const scaleY = plotHeight / (y1 - y0)
        const scale = Math.min(scaleX, scaleY, 10) * 0.9
        
        const centerX = (x0 + x1) / 2
        const centerY = (y0 + y1) / 2
        
        const svgCenterX = centerX + margin.left
        const svgCenterY = centerY + margin.top
        
        const translateX = width / 2 - svgCenterX * scale
        const translateY = height / 2 - svgCenterY * scale
        
        const newTransform = d3.zoomIdentity
          .translate(translateX, translateY)
          .scale(scale)
        
        svg.transition()
          .duration(400)
          .call(zoom.transform, newTransform)
      }
      
      isSelecting = false
      setSelection({ start: null, end: null })
    })
    
  }, [])
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Zoom Implementation</h1>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Hold Shift and drag to select a region</p>
        <div className="text-sm">
          <p>Current transform: k={transform.k.toFixed(2)}, x={transform.x.toFixed(2)}, y={transform.y.toFixed(2)}</p>
          {selection.start && selection.end && (
            <p>Selection: [{selection.start[0].toFixed(0)}, {selection.start[1].toFixed(0)}] to [{selection.end[0].toFixed(0)}, {selection.end[1].toFixed(0)}]</p>
          )}
        </div>
      </div>
      <div className="relative">
        <svg ref={svgRef} width={800} height={400} className="border border-gray-300" />
        {selection.start && selection.end && (
          <svg width={800} height={400} className="absolute inset-0 pointer-events-none">
            <rect
              x={Math.min(selection.start[0], selection.end[0]) + 40}
              y={Math.min(selection.start[1], selection.end[1]) + 20}
              width={Math.abs(selection.end[0] - selection.start[0])}
              height={Math.abs(selection.end[1] - selection.start[1])}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
          </svg>
        )}
      </div>
    </div>
  )
}