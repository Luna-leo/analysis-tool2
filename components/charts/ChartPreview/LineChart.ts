import * as d3 from "d3"
import { ChartComponent, MarkerType } from "@/types"
import { ChartDataPoint } from "@/types/chart-data"
import { getTimeFormat } from "./utils"
import { calculateXAxisPosition } from "@/utils/chart/axisPositioning"
import { calculateConsistentYDomain } from "@/utils/chart/scaleUtils"
import { defaultChartColors } from "@/utils/chartColors"

interface ChartDataItem {
  timestamp: Date | number
  [key: string]: number | Date | undefined
}

interface LineChartProps {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  data: ChartDataItem[]
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
      yDomain = extent[0] !== undefined && extent[1] !== undefined ? [extent[0] as number, extent[1] as number] : [0, 100]
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
  
  // Calculate X-axis position
  const xAxisY = calculateXAxisPosition(yDomain, yScale, height)
  
  g.append("g")
    .attr("transform", `translate(0,${xAxisY})`)
    .call(d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => d3.timeFormat(timeFormat)(d as Date)))
    .selectAll("text")
    .style("font-size", "12px")

  g.append("g")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("font-size", "12px")

  yParams.forEach((param, index) => {
    // Skip parameters with empty names
    if (!param.parameter || param.parameter.trim() === '') {
      return
    }
    
    const lineColor = param.line?.color || defaultChartColors[index % defaultChartColors.length]
    const showLine = param.line?.width !== undefined && param.line.width > 0
    const showMarker = param.marker !== undefined
    
    // Draw line if line width > 0
    if (showLine) {
      const paramLine = d3.line<ChartDataItem>()
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

    // Parameter labels will be shown in legend instead
  })

  // Add legend if enabled
  const legendParams = yParams.filter(p => p.parameter && p.parameter.trim() !== '')
  if (editingChart.legend !== false && legendParams.length > 0) {
    const legendStyle = editingChart.legendStyle || {}
    const position = legendStyle.position || 'bottom'
    const layout = legendStyle.layout || 'horizontal'
    const fontSize = legendStyle.fontSize || 12
    const fontColor = legendStyle.fontColor || '#374151'
    const backgroundColor = legendStyle.backgroundColor || 'transparent'
    const borderColor = legendStyle.borderColor || 'transparent'
    const borderWidth = legendStyle.borderWidth || 0
    const padding = legendStyle.padding || 8
    const itemSpacing = legendStyle.itemSpacing || 4

    // Calculate legend position based on position setting
    let legendTransform = ''
    let maxLegendWidth = width
    let maxLegendHeight = height
    
    switch (position) {
      case 'top':
        legendTransform = `translate(${width / 2}, -20)`
        break
      case 'right':
        legendTransform = `translate(${width + 20}, ${height / 2})`
        maxLegendWidth = 150 // Limit width for right position
        break
      case 'bottom':
        legendTransform = `translate(${width / 2}, ${height + 35})`
        break
      case 'left':
        legendTransform = `translate(-20, ${height / 2})`
        maxLegendWidth = 150 // Limit width for left position
        break
    }

    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", legendTransform)

    // Create background rect (will be sized after content is added)
    const bgRect = legend.append("rect")
      .attr("fill", backgroundColor)
      .attr("stroke", borderColor)
      .attr("stroke-width", borderWidth)
      .attr("rx", 4)
      .attr("ry", 4)

    // Create content group with padding
    const contentGroup = legend.append("g")
      .attr("transform", `translate(${padding}, ${padding})`)

    let currentX = 0
    let currentY = 0
    let maxWidth = 0
    let maxHeight = 0

    legendParams.forEach((param, index) => {
      const lineColor = param.line?.color || defaultChartColors[index % defaultChartColors.length]
      const showLine = param.line?.width !== undefined && param.line.width > 0
      const showMarker = param.marker !== undefined
      
      const legendItem = contentGroup.append("g")
        .attr("transform", `translate(${currentX}, ${currentY})`)
      
      // Draw legend symbol
      let symbolWidth = 20
      if (showLine) {
        legendItem.append("line")
          .attr("x1", 0)
          .attr("x2", symbolWidth)
          .attr("y1", fontSize / 2)
          .attr("y2", fontSize / 2)
          .attr("stroke", lineColor)
          .attr("stroke-width", param.line?.width || 2)
          .attr("stroke-dasharray", param.line?.style === "dashed" ? "5,5" : param.line?.style === "dotted" ? "2,2" : "none")
      }
      
      if (showMarker && param.marker) {
        drawMarker(
          legendItem,
          symbolWidth / 2,
          fontSize / 2,
          param.marker.type,
          (param.marker.size || 6) * 0.8,
          param.marker.fillColor || lineColor,
          param.marker.borderColor || lineColor
        )
      }
      
      // Add text
      const text = legendItem.append("text")
        .attr("x", symbolWidth + 5)
        .attr("y", fontSize / 2)
        .attr("dy", "0.35em")
        .style("font-size", `${fontSize}px`)
        .style("fill", fontColor)
        .text(param.parameter)
      
      // Calculate dimensions
      const bbox = (text.node() as SVGTextElement).getBBox()
      const itemWidth = symbolWidth + 5 + bbox.width
      const itemHeight = Math.max(fontSize, bbox.height)

      if (layout === 'horizontal') {
        // Check if we need to wrap to next line
        if (currentX + itemWidth > maxLegendWidth && index > 0) {
          currentX = 0
          currentY += itemHeight + itemSpacing
          legendItem.attr("transform", `translate(${currentX}, ${currentY})`)
        }
        currentX += itemWidth + itemSpacing * 2
        maxWidth = Math.max(maxWidth, currentX)
        maxHeight = currentY + itemHeight
      } else {
        // Vertical layout
        currentY += itemHeight + itemSpacing
        maxWidth = Math.max(maxWidth, itemWidth)
        maxHeight = currentY - itemSpacing
      }
    })

    // Update background rect size
    bgRect
      .attr("x", -padding)
      .attr("y", -padding)
      .attr("width", maxWidth + padding * 2)
      .attr("height", maxHeight + padding * 2)

    // Adjust legend position to center it
    switch (position) {
      case 'top':
      case 'bottom':
        legend.attr("transform", `${legendTransform} translate(${-(maxWidth + padding * 2) / 2}, 0)`)
        break
      case 'left':
      case 'right':
        legend.attr("transform", `${legendTransform} translate(0, ${-(maxHeight + padding * 2) / 2})`)
        break
    }
  }

  // Store scales for reference lines
  scalesRef.current = { xScale, yScale }
}