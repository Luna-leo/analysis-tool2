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

    const data = generateMockData()
    if (!data.length) {
      svg.append("text")
        .attr("x", "50%")
        .attr("y", "50%")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#6b7280")
        .text("No data to preview. Select data sources and add Y parameters.")
      return
    }

    const margin = { top: 20, right: 80, bottom: 40, left: 60 }
    const width = 400 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const chartType = editingChart.chartType || "line"
    
    if (chartType === "line") {
      renderLineChart(g, data, width, height)
    } else if (chartType === "bar") {
      renderBarChart(g, data, width, height)
    } else if (chartType === "pie") {
      renderPieChart(g, data, width, height)
    }

  }, [editingChart, selectedDataSourceItems])

  const renderLineChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], width: number, height: number) => {
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp) as [Date, Date])
      .range([0, width])

    const yParams = editingChart.yAxisParams || []
    const allValues = data.flatMap(d => yParams.map(p => d[p.parameter] || 0))
    const yScale = d3.scaleLinear()
      .domain(d3.extent(allValues) as [number, number])
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
  }

  const renderBarChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], width: number, height: number) => {
    const yParams = editingChart.yAxisParams || []
    if (!yParams.length) return

    const param = yParams[0]
    const xScale = d3.scaleBand()
      .domain(data.map((_, i) => i.toString()))
      .range([0, width])
      .padding(0.1)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[param.parameter] || 0)] as [number, number])
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
      {selectedDataSourceItems.length > 0 && (
        <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
          <div className="font-medium mb-1">Data Sources:</div>
          {selectedDataSourceItems.map((item, index) => (
            <div key={item.id} className="text-muted-foreground">
              {index + 1}. {item.plant} - {item.machineNo} ({item.label})
            </div>
          ))}
        </div>
      )}
    </div>
  )
}