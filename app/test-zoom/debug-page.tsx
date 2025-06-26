"use client"

import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

export default function ZoomDebugPage() {
  const svgRef = useRef<SVGSVGElement>(null)
  
  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const width = 800
    const height = 600
    const margin = { top: 20, right: 40, bottom: 60, left: 60 }
    
    // Clear previous content
    svg.selectAll("*").remove()
    
    // Create main group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width - margin.left - margin.right])
    
    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.top - margin.bottom, 0])
    
    // Add axes
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale))
    
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale))
    
    // Add some test data
    const data = Array.from({length: 50}, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100
    }))
    
    const dots = g.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 3)
      .attr("fill", "steelblue")
    
    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .extent([[0, 0], [width, height]])
      .on("zoom", (event) => {
        const transform = event.transform
        
        // Log the transform
        console.log('Zoom transform:', {
          k: transform.k,
          x: transform.x,
          y: transform.y
        })
        
        // Update scales
        const newXScale = transform.rescaleX(xScale)
        const newYScale = transform.rescaleY(yScale)
        
        // Update axes
        g.select<SVGGElement>(".x-axis").call(d3.axisBottom(newXScale))
        g.select<SVGGElement>(".y-axis").call(d3.axisLeft(newYScale))
        
        // Update dots
        dots.attr("cx", d => newXScale(d.x))
            .attr("cy", d => newYScale(d.y))
      })
    
    svg.call(zoom)
    
    // Test range selection
    let isShiftPressed = false
    let selectionStart: [number, number] | null = null
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressed = true
        svg.style('cursor', 'crosshair')
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressed = false
        svg.style('cursor', 'grab')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    svg.on('mousedown', function(event) {
      if (!isShiftPressed) return
      
      const [x, y] = d3.pointer(event, this)
      selectionStart = [x, y]
      
      console.log('Selection start:', { x, y })
      event.preventDefault()
    })
    
    svg.on('mouseup', function(event) {
      if (!isShiftPressed || !selectionStart) return
      
      const [x, y] = d3.pointer(event, this)
      const endPoint: [number, number] = [x, y]
      
      console.log('Selection end:', { x, y })
      
      // Calculate zoom to fit selection
      const x0 = Math.min(selectionStart[0], endPoint[0])
      const x1 = Math.max(selectionStart[0], endPoint[0])
      const y0 = Math.min(selectionStart[1], endPoint[1])
      const y1 = Math.max(selectionStart[1], endPoint[1])
      
      const selectionWidth = x1 - x0
      const selectionHeight = y1 - y0
      
      if (selectionWidth < 10 || selectionHeight < 10) {
        console.log('Selection too small')
        return
      }
      
      // Calculate scale
      const scaleX = width / selectionWidth
      const scaleY = height / selectionHeight
      const scale = Math.min(scaleX, scaleY) * 0.9
      
      // Calculate center
      const centerX = (x0 + x1) / 2
      const centerY = (y0 + y1) / 2
      
      // Calculate translation
      const translateX = width / 2 - centerX * scale
      const translateY = height / 2 - centerY * scale
      
      console.log('Transform calculation:', {
        selection: { x0, y0, x1, y1, width: selectionWidth, height: selectionHeight },
        scale: { scaleX, scaleY, final: scale },
        center: { x: centerX, y: centerY },
        translate: { x: translateX, y: translateY }
      })
      
      // Apply transform
      const transform = d3.zoomIdentity
        .translate(translateX, translateY)
        .scale(scale)
      
      svg.transition()
        .duration(400)
        .call(zoom.transform, transform)
      
      selectionStart = null
    })
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Zoom Debug Test</h1>
      <p className="mb-4">Hold Shift and drag to test range selection zoom</p>
      <svg ref={svgRef} width={800} height={600} className="border border-gray-300" />
    </div>
  )
}