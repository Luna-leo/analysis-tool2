"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"
import { ChartComponent, EventInfo } from "@/types"

interface ChartPreviewProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
}

export function ChartPreview({ editingChart, selectedDataSourceItems }: ChartPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const generateMockData = () => {
    if (!selectedDataSourceItems.length || !editingChart.yAxisParams?.length) {
      return []
    }

    const data: Array<{ timestamp: Date; [key: string]: Date | number }> = []
    const startTime = new Date(selectedDataSourceItems[0].start)
    const endTime = new Date(selectedDataSourceItems[0].end)
    const duration = endTime.getTime() - startTime.getTime()
    const points = Math.min(50, Math.max(10, Math.floor(duration / (5 * 60 * 1000))))

    for (let i = 0; i < points; i++) {
      const timestamp = new Date(startTime.getTime() + (i * duration / (points - 1)))
      const dataPoint: { timestamp: Date; [key: string]: Date | number } = { timestamp }

      editingChart.yAxisParams.forEach((param) => {
        if (param.parameter) {
          const baseValue = Math.random() * 50 + 25
          const variation = Math.sin(i * 0.3) * 10
          dataPoint[param.parameter] = Math.max(0, baseValue + variation)
        }
      })

      data.push(dataPoint)
    }

    return data
  }

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 20, right: 80, bottom: 40, left: 60 }
    const width = 400 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const data = generateMockData()
    const chartType = editingChart.chartType || "line"
    
    if (data.length > 0) {
      // Render chart with data
      if (chartType === "line") {
        renderLineChart(g, data, width, height)
      } else if (chartType === "bar") {
        renderBarChart(g, data, width, height)
      } else if (chartType === "pie") {
        renderPieChart(g, data, width, height)
      }
    } else {
      // Render empty chart with axes
      renderEmptyChart(g, width, height, chartType)
    }

  }, [editingChart, selectedDataSourceItems])

  const drawReferenceLines = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>, 
    xScale: d3.ScaleTime<number, number>, 
    yScale: d3.ScaleLinear<number, number>, 
    width: number, 
    height: number
  ) => {
    const referenceLines = editingChart.referenceLines || []
    
    referenceLines.forEach(line => {
      const color = line.color || "#999999"
      const strokeDasharray = line.style === "dashed" ? "5,5" : line.style === "dotted" ? "2,2" : "none"
      
      if (line.type === "vertical") {
        // Vertical reference line
        let xPos: number
        if ((editingChart.xAxisType || "datetime") === "datetime") {
          // For datetime, convert value to date
          const date = new Date(line.value)
          xPos = xScale(date)
        } else {
          // For numeric values, need to map to time scale (simplified)
          const domain = xScale.domain()
          const range = domain[1].getTime() - domain[0].getTime()
          const normalizedValue = line.value / 100 // Assume 0-100 range for simplicity
          xPos = xScale(new Date(domain[0].getTime() + range * normalizedValue))
        }
        
        if (xPos >= 0 && xPos <= width) {
          // Draw vertical line
          g.append("line")
            .attr("x1", xPos)
            .attr("x2", xPos)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", color)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", strokeDasharray)
            .attr("opacity", 0.7)
          
          // Draw label
          if (line.label) {
            g.append("text")
              .attr("x", xPos + 3)
              .attr("y", 15)
              .attr("fill", color)
              .style("font-size", "10px")
              .text(line.label)
          }
        }
      } else if (line.type === "horizontal") {
        // Horizontal reference line
        const yPos = yScale(line.value)
        
        if (yPos >= 0 && yPos <= height) {
          // Draw horizontal line
          g.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", yPos)
            .attr("y2", yPos)
            .attr("stroke", color)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", strokeDasharray)
            .attr("opacity", 0.7)
          
          // Draw label
          if (line.label) {
            g.append("text")
              .attr("x", 3)
              .attr("y", yPos - 3)
              .attr("fill", color)
              .style("font-size", "10px")
              .text(line.label)
          }
        }
      }
    })
  }

  const renderEmptyChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, width: number, height: number, chartType: string) => {
    if (chartType === "pie") {
      // For pie charts, show a circle placeholder
      const radius = Math.min(width, height) / 2
      const centerX = width / 2
      const centerY = height / 2
      
      g.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", radius - 10)
        .attr("fill", "none")
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
      
    } else {
      // For line and bar charts, show axes with placeholder scales
      let xDomain: [Date, Date]
      if (editingChart.xAxisRange?.auto === false && editingChart.xAxisRange.min && editingChart.xAxisRange.max) {
        if ((editingChart.xAxisType || "datetime") === "datetime") {
          xDomain = [new Date(editingChart.xAxisRange.min), new Date(editingChart.xAxisRange.max)]
        } else {
          const now = new Date()
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
          xDomain = [oneHourAgo, now]
        }
      } else {
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        xDomain = [oneHourAgo, now]
      }
      
      const xScale = d3.scaleTime()
        .domain(xDomain)
        .range([0, width])
      
      // Y-axis scale based on parameter settings
      let yDomain: [number, number] = [0, 100]
      if (editingChart.yAxisParams && editingChart.yAxisParams.length > 0) {
        const firstParam = editingChart.yAxisParams[0]
        if (firstParam.range?.auto === false) {
          yDomain = [firstParam.range.min || 0, firstParam.range.max || 100]
        }
      }
      
      const yScale = d3.scaleLinear()
        .domain(yDomain)
        .nice()
        .range([height, 0])
      
      // X axis
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat((d) => d3.timeFormat("%H:%M")(d as Date)))
      
      // Y axis
      g.append("g")
        .call(d3.axisLeft(yScale))
      
      // X axis label
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .style("font-size", "12px")
        .text(editingChart.xLabel || "Time")
      
      // Y axis label
      const yAxisLabels = editingChart.yAxisLabels || {}
      const firstYAxisLabel = Object.values(yAxisLabels)[0] || "Value"
      
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -35)
        .attr("text-anchor", "middle")
        .attr("fill", "#6b7280")
        .style("font-size", "12px")
        .text(firstYAxisLabel)
      
      // Draw reference lines on empty chart
      drawReferenceLines(g, xScale, yScale, width, height)
    }
  }

  const renderLineChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], width: number, height: number) => {
    // X-axis scale with range settings
    let xDomain: [Date, Date]
    if (editingChart.xAxisRange?.auto === false && editingChart.xAxisRange.min && editingChart.xAxisRange.max) {
      if ((editingChart.xAxisType || "datetime") === "datetime") {
        xDomain = [new Date(editingChart.xAxisRange.min), new Date(editingChart.xAxisRange.max)]
      } else {
        // For time/parameter types, still use data extent for now
        xDomain = d3.extent(data, d => d.timestamp) as [Date, Date]
      }
    } else {
      xDomain = d3.extent(data, d => d.timestamp) as [Date, Date]
    }
    
    const xScale = d3.scaleTime()
      .domain(xDomain)
      .range([0, width])

    const yParams = editingChart.yAxisParams || []
    
    // Group parameters by axis for separate Y scales
    const groupedByAxis: Record<number, typeof yParams> = {}
    yParams.forEach(param => {
      const axisNo = param.axisNo || 1
      if (!groupedByAxis[axisNo]) groupedByAxis[axisNo] = []
      groupedByAxis[axisNo].push(param)
    })

    // Use first axis for primary Y scale (for simplicity in preview)
    const firstAxisParams = Object.values(groupedByAxis)[0] || []
    let yDomain: [number, number]
    
    if (firstAxisParams.length > 0 && firstAxisParams[0].range?.auto === false) {
      yDomain = [firstAxisParams[0].range.min || 0, firstAxisParams[0].range.max || 100]
    } else {
      const allValues = data.flatMap(d => firstAxisParams.map(p => d[p.parameter] || 0))
      yDomain = d3.extent(allValues) as [number, number] || [0, 100]
    }
    
    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .nice()
      .range([height, 0])

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => d3.timeFormat("%H:%M")(d as Date)))

    g.append("g")
      .call(d3.axisLeft(yScale))

    yParams.forEach((param, index) => {
      const color = param.line?.color || d3.schemeCategory10[index % 10]
      
      const paramLine = d3.line<any>()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d[param.parameter] || 0))
        .curve(d3.curveMonotoneX)

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", param.line?.width || 2)
        .attr("d", paramLine)

      g.append("text")
        .attr("x", width + 5)
        .attr("y", yScale(data[data.length - 1][param.parameter] || 0))
        .attr("dy", "0.35em")
        .attr("fill", color)
        .style("font-size", "12px")
        .text(param.parameter)
    })

    // Draw reference lines
    drawReferenceLines(g, xScale, yScale, width, height)
  }

  const renderBarChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], width: number, height: number) => {
    const yParams = editingChart.yAxisParams || []
    if (!yParams.length) return

    const param = yParams[0]
    const xScale = d3.scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.1)

    // Y-axis scale with range settings
    let yDomain: [number, number]
    if (param.range?.auto === false) {
      yDomain = [param.range.min || 0, param.range.max || 100]
    } else {
      yDomain = [0, d3.max(data, d => d[param.parameter] || 0)] as [number, number] || [0, 100]
    }

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .nice()
      .range([height, 0])

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))

    g.append("g")
      .call(d3.axisLeft(yScale))

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (_, i) => xScale(i.toString()) || 0)
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d[param.parameter] || 0))
      .attr("height", d => height - yScale(d[param.parameter] || 0))
      .attr("fill", param.line?.color || "#3b82f6")

    // Create scales for reference lines (simplified time scale for bar chart)
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const timeScale = d3.scaleTime()
      .domain([oneHourAgo, now])
      .range([0, width])

    // Draw reference lines
    drawReferenceLines(g, timeScale, yScale, width, height)
  }

  const renderPieChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], width: number, height: number) => {
    const yParams = editingChart.yAxisParams || []
    if (!yParams.length) return

    const radius = Math.min(width, height) / 2
    const centerX = width / 2
    const centerY = height / 2

    const aggregatedData = yParams.map(param => ({
      label: param.parameter,
      value: d3.sum(data, d => d[param.parameter] || 0),
      color: param.line?.color || d3.schemeCategory10[yParams.indexOf(param) % 10]
    }))

    const pie = d3.pie<any>()
      .value(d => d.value)

    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius - 10)

    const pieData = pie(aggregatedData)

    const arcs = g.selectAll(".arc")
      .data(pieData)
      .enter().append("g")
      .attr("class", "arc")
      .attr("transform", `translate(${centerX},${centerY})`)

    arcs.append("path")
      .attr("d", arc)
      .attr("fill", d => d.data.color)

    arcs.append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text(d => d.data.label)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <svg 
          ref={svgRef} 
          width="100%" 
          height="100%" 
          viewBox="0 0 400 300"
          className="border rounded"
        />
      </div>
      <div className="mt-2 space-y-2">
        <div className="p-2 bg-muted/30 rounded text-xs">
          <div className="font-medium mb-1">Data Sources:</div>
          {selectedDataSourceItems.length > 0 ? (
            selectedDataSourceItems.map((item, index) => (
              <div key={item.id} className="text-muted-foreground">
                {index + 1}. {item.plant} - {item.machineNo} ({item.label})
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">Not set</div>
          )}
        </div>
        
        {/* Range Settings Display */}
        <div className="p-2 bg-muted/30 rounded text-xs">
          <div className="font-medium mb-1">Range Settings:</div>
          <div className="space-y-1 text-muted-foreground">
            <div>
              <span className="font-medium">X-Axis ({editingChart.xAxisType || "datetime"}):</span>
              {editingChart.xAxisRange?.auto !== false ? (
                <span className="ml-1">Auto</span>
              ) : (
                <span className="ml-1">
                  {(editingChart.xAxisType || "datetime") === "datetime" ? (
                    `${editingChart.xAxisRange.min || "Not set"} ~ ${editingChart.xAxisRange.max || "Not set"}`
                  ) : (
                    `${editingChart.xAxisRange.min || 0} - ${editingChart.xAxisRange.max || 100}`
                  )}
                </span>
              )}
            </div>
            
            {editingChart.yAxisParams && editingChart.yAxisParams.length > 0 ? (
              // Group parameters by axis and show their ranges
              (() => {
                const groupedByAxis: Record<number, typeof editingChart.yAxisParams> = {}
                editingChart.yAxisParams.forEach(param => {
                  const axisNo = param.axisNo || 1
                  if (!groupedByAxis[axisNo]) groupedByAxis[axisNo] = []
                  groupedByAxis[axisNo].push(param)
                })
                
                return Object.entries(groupedByAxis).map(([axisNo, params]) => {
                  const firstParam = params[0]
                  const axisLabel = editingChart.yAxisLabels?.[parseInt(axisNo)] || `Axis ${axisNo}`
                  
                  return (
                    <div key={axisNo}>
                      <span className="font-medium">Y-Axis {axisNo} ({axisLabel}):</span>
                      {firstParam.range?.auto !== false ? (
                        <span className="ml-1">Auto</span>
                      ) : (
                        <span className="ml-1">
                          {firstParam.range.min || 0} - {firstParam.range.max || 100}
                        </span>
                      )}
                    </div>
                  )
                })
              })()
            ) : (
              <div>
                <span className="font-medium">Y-Axis:</span>
                <span className="ml-1">Auto</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Y Parameter Settings Display */}
        <div className="p-2 bg-muted/30 rounded text-xs">
          <div className="font-medium mb-1">Y Parameter Settings:</div>
          {editingChart.yAxisParams && editingChart.yAxisParams.length > 0 ? (
            <div className="space-y-1 text-muted-foreground">
              {editingChart.yAxisParams.map((param, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <div>
                    <span className="font-medium">{param.parameter || `Parameter ${index + 1}`}</span>
                    <span className="ml-2">Axis {param.axisNo || 1}</span>
                  </div>
                  <div className="ml-2 flex flex-wrap gap-2 text-[10px]">
                    {param.line?.color ? (
                      <span className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded" 
                          style={{ backgroundColor: param.line.color }}
                        />
                        Color
                      </span>
                    ) : (
                      <span>Color: Not set</span>
                    )}
                    {param.line?.width ? (
                      <span>Width: {param.line.width}px</span>
                    ) : (
                      <span>Width: Not set</span>
                    )}
                    {param.range && !param.range.auto ? (
                      <span>Range: {param.range.min || 0} - {param.range.max || 100}</span>
                    ) : param.range?.auto ? (
                      <span>Range: Auto</span>
                    ) : (
                      <span>Range: Not set</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Not set</div>
          )}
        </div>
      </div>
    </div>
  )
}