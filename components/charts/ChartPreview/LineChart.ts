import * as d3 from "d3"
import { ChartComponent, MarkerType } from "@/types"
import { getTimeFormat } from "./utils"

interface LineChartProps {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  data: any[]
  width: number
  height: number
  editingChart: ChartComponent
  scalesRef: React.MutableRefObject<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
    yScale: d3.ScaleLinear<number, number> | null
  }>
}

const drawMarker = (
  context: CanvasRenderingContext2D | d3.Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  type: MarkerType,
  size: number,
  fillColor: string,
  borderColor: string
) => {
  if (!context) return
  
  const halfSize = size / 2
  const isCanvas = 'beginPath' in context

  if (isCanvas) {
    // Canvas rendering
    const ctx = context as CanvasRenderingContext2D
    ctx.save()
    ctx.fillStyle = fillColor
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 1

    switch (type) {
      case "circle":
        ctx.beginPath()
        ctx.arc(x, y, halfSize, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        break
      case "square":
        ctx.fillRect(x - halfSize, y - halfSize, size, size)
        ctx.strokeRect(x - halfSize, y - halfSize, size, size)
        break
      case "triangle":
        ctx.beginPath()
        ctx.moveTo(x, y - halfSize)
        ctx.lineTo(x - halfSize, y + halfSize)
        ctx.lineTo(x + halfSize, y + halfSize)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      case "diamond":
        ctx.beginPath()
        ctx.moveTo(x, y - halfSize)
        ctx.lineTo(x + halfSize, y)
        ctx.lineTo(x, y + halfSize)
        ctx.lineTo(x - halfSize, y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      case "star":
        const spikes = 5
        const outerRadius = halfSize
        const innerRadius = halfSize * 0.5
        ctx.beginPath()
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (i * Math.PI) / spikes - Math.PI / 2
          const px = x + Math.cos(angle) * radius
          const py = y + Math.sin(angle) * radius
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      case "cross":
        ctx.beginPath()
        ctx.moveTo(x - halfSize, y)
        ctx.lineTo(x + halfSize, y)
        ctx.moveTo(x, y - halfSize)
        ctx.lineTo(x, y + halfSize)
        ctx.stroke()
        break
    }
    ctx.restore()
  } else {
    // SVG rendering
    const svg = context as d3.Selection<SVGGElement, unknown, null, undefined>
    
    switch (type) {
      case "circle":
        svg.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", halfSize)
          .attr("fill", fillColor)
          .attr("stroke", borderColor)
          .attr("stroke-width", 1)
        break
      case "square":
        svg.append("rect")
          .attr("x", x - halfSize)
          .attr("y", y - halfSize)
          .attr("width", size)
          .attr("height", size)
          .attr("fill", fillColor)
          .attr("stroke", borderColor)
          .attr("stroke-width", 1)
        break
      case "triangle":
        svg.append("polygon")
          .attr("points", `${x},${y - halfSize} ${x - halfSize},${y + halfSize} ${x + halfSize},${y + halfSize}`)
          .attr("fill", fillColor)
          .attr("stroke", borderColor)
          .attr("stroke-width", 1)
        break
      case "diamond":
        svg.append("polygon")
          .attr("points", `${x},${y - halfSize} ${x + halfSize},${y} ${x},${y + halfSize} ${x - halfSize},${y}`)
          .attr("fill", fillColor)
          .attr("stroke", borderColor)
          .attr("stroke-width", 1)
        break
      case "star":
        const spikes = 5
        const outerRadius = halfSize
        const innerRadius = halfSize * 0.5
        let points = ""
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (i * Math.PI) / spikes - Math.PI / 2
          const px = x + Math.cos(angle) * radius
          const py = y + Math.sin(angle) * radius
          points += `${px},${py} `
        }
        svg.append("polygon")
          .attr("points", points.trim())
          .attr("fill", fillColor)
          .attr("stroke", borderColor)
          .attr("stroke-width", 1)
        break
      case "cross":
        const crossGroup = svg.append("g")
        crossGroup.append("line")
          .attr("x1", x - halfSize)
          .attr("y1", y)
          .attr("x2", x + halfSize)
          .attr("y2", y)
          .attr("stroke", borderColor)
          .attr("stroke-width", 1)
        crossGroup.append("line")
          .attr("x1", x)
          .attr("y1", y - halfSize)
          .attr("x2", x)
          .attr("y2", y + halfSize)
          .attr("stroke", borderColor)
          .attr("stroke-width", 1)
        break
    }
  }
}

export const renderLineChart = ({ g, data, width, height, editingChart, scalesRef }: LineChartProps) => {
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
    // Only include parameters that have a non-empty parameter name
    if (param.parameter && param.parameter.trim() !== '') {
      const axisNo = param.axisNo || 1
      if (!groupedByAxis[axisNo]) groupedByAxis[axisNo] = []
      groupedByAxis[axisNo].push(param)
    }
  })

  // Use first axis for primary Y scale (for simplicity in preview)
  const firstAxisParams = Object.values(groupedByAxis)[0] || []
  let yDomain: [number, number]
  
  if (firstAxisParams.length === 0) {
    // No Y parameters set or all parameters are empty - use default range 0-100
    yDomain = [0, 100]
  } else if (firstAxisParams[0].range?.auto === false) {
    yDomain = [firstAxisParams[0].range.min || 0, firstAxisParams[0].range.max || 100]
  } else {
    const allValues = data.flatMap(d => firstAxisParams.map(p => d[p.parameter] || 0))
    if (allValues.length === 0) {
      // No data values - use default range 0-100
      yDomain = [0, 100]
    } else {
      const extent = d3.extent(allValues)
      yDomain = extent[0] !== undefined && extent[1] !== undefined ? [extent[0], extent[1]] : [0, 100]
    }
  }
  
  const yScale = d3.scaleLinear()
    .domain(yDomain)
    .range([height, 0])
  
  // Only apply nice() if we have actual data values, not default range
  if (firstAxisParams.length > 0 && firstAxisParams[0].range?.auto !== false) {
    const validParams = firstAxisParams.filter(p => p.parameter && p.parameter.trim() !== '')
    if (validParams.length > 0) {
      const allValues = data.flatMap(d => validParams.map(p => d[p.parameter] || 0))
      if (allValues.length > 0) {
        yScale.nice()
      }
    }
  }

  const timeFormat = getTimeFormat(xDomain[0], xDomain[1])
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => d3.timeFormat(timeFormat)(d as Date)))

  g.append("g")
    .call(d3.axisLeft(yScale))

  yParams.forEach((param, index) => {
    // Skip parameters with empty names
    if (!param.parameter || param.parameter.trim() === '') {
      return
    }
    
    const lineColor = param.line?.color || d3.schemeCategory10[index % 10]
    const showLine = param.line?.width !== undefined && param.line.width > 0
    const showMarker = param.marker !== undefined
    
    // Draw line if line width > 0
    if (showLine) {
      const paramLine = d3.line<any>()
        .x(d => xScale(d.timestamp))
        .y(d => yScale(d[param.parameter] || 0))
        .curve(d3.curveMonotoneX)

      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("stroke-width", param.line?.width || 2)
        .attr("stroke-dasharray", param.line?.style === "dashed" ? "5,5" : param.line?.style === "dotted" ? "2,2" : "none")
        .attr("d", paramLine)
    }

    // Draw markers if marker is defined
    if (showMarker && param.marker) {
      const markerGroup = g.append("g")
        .attr("class", `markers-${index}`)
      
      data.forEach(d => {
        const x = xScale(d.timestamp)
        const y = yScale(d[param.parameter] || 0)
        
        drawMarker(
          markerGroup,
          x,
          y,
          param.marker!.type,
          param.marker!.size || 6,
          param.marker!.fillColor || lineColor,
          param.marker!.borderColor || lineColor
        )
      })
    }

    // Add parameter label
    g.append("text")
      .attr("x", width + 5)
      .attr("y", yScale(data[data.length - 1][param.parameter] || 0))
      .attr("dy", "0.35em")
      .attr("fill", lineColor)
      .style("font-size", "12px")
      .text(param.parameter)
  })

  // Store scales for reference lines
  scalesRef.current = { xScale, yScale }
}