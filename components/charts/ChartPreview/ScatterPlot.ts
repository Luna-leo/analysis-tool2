import * as d3 from "d3"
import { ChartComponent } from "@/types"
import { formatXValue, getXValueForScale } from "@/utils/chartAxisUtils"
import { calculateXAxisPosition } from "@/utils/chart/axisPositioning"
import { calculateConsistentYDomain } from "@/utils/chart/scaleUtils"
import { showTooltip, togglePinnedTooltip, hideAllTooltips } from "@/utils/chartTooltip"

interface RenderScatterPlotProps {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  data: Array<{
    x: number | string | Date
    y: number
    series: string
    seriesIndex: number
    timestamp: string
    dataSourceId: string
    dataSourceLabel: string
  }>
  width: number
  height: number
  editingChart: ChartComponent
  scalesRef: React.MutableRefObject<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
    yScale: d3.ScaleLinear<number, number> | null
  }>
}

export function renderScatterPlot({ g, data, width, height, editingChart, scalesRef }: RenderScatterPlotProps) {
  // Clear previous content
  g.selectAll("*").remove()

  if (data.length === 0) {
    return
  }
  
  // Add event listener to close tooltips on wheel/drag
  const svg = g.node()?.ownerSVGElement
  if (svg) {
    d3.select(svg)
      .on("wheel.tooltip", () => hideAllTooltips())
      .on("mousedown.tooltip", (event) => {
        // Only hide if it's a drag (not a click)
        const startX = event.clientX
        const startY = event.clientY
        
        const handleMouseMove = (e: MouseEvent) => {
          if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) {
            hideAllTooltips()
            window.removeEventListener("mousemove", handleMouseMove)
          }
        }
        
        const handleMouseUp = () => {
          window.removeEventListener("mousemove", handleMouseMove)
          window.removeEventListener("mouseup", handleMouseUp)
        }
        
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
      })
  }

  // Create scales based on x-axis type
  let xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  let xAxis: d3.Axis<number | Date | { valueOf(): number }>
  
  
  if (editingChart.xAxisType === 'datetime') {
    // For datetime, convert string timestamps to Date objects
    
    const dateData = data.map(d => ({
      ...d,
      x: new Date(d.x as string)
    }))
    
    
    const xExtent = d3.extent(dateData, d => d.x) as [Date, Date]
    
    xScale = d3.scaleTime()
      .domain(xExtent)
      .range([0, width])
      
      
    xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat("%Y-%m-%d %H:%M"))
  } else if (editingChart.xAxisType === 'time') {
    // For elapsed time (already converted to minutes)
    
    const xExtent = d3.extent(data, d => d.x as number) as [number, number]
    const xPadding = (xExtent[1] - xExtent[0]) * 0.05
    
    
    xScale = d3.scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, width])
      
      
    xAxis = d3.axisBottom(xScale)
      .tickFormat(d => {
        const minutes = Number(d)
        const hours = Math.floor(minutes / 60)
        const mins = Math.floor(minutes % 60)
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
      })
  } else {
    // For numeric parameters
    
    const xExtent = d3.extent(data, d => d.x as number) as [number, number]
    const xPadding = (xExtent[1] - xExtent[0]) * 0.05
    
    
    xScale = d3.scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, width])
      
      
    xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format(".2f"))
  }

  // Calculate consistent Y domain that includes reference lines
  const yDomain = calculateConsistentYDomain(data, editingChart, 0.1)


  const yScale = d3.scaleLinear()
    .domain(yDomain)
    .range([height, 0])

  // Store scales in ref
  scalesRef.current = { xScale, yScale }

  // Create color scale for different series
  const seriesNames = Array.from(new Set(data.map(d => d.series)))
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(seriesNames)

  // Create y-axis
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d3.format(".2f"))

  // Add axes
  const yScaleDomain = yScale.domain()
  const xAxisY = calculateXAxisPosition(yScaleDomain as [number, number], yScale, height)
  
  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${xAxisY})`)
    .call(xAxis)

  g.append("g")
    .attr("class", "y-axis")
    .call(yAxis)

  // Add axis labels
  if (editingChart.xLabel || editingChart.xParameter) {
    g.append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("font-size", "12px")
      .text(editingChart.xLabel || editingChart.xParameter || "X Axis")
  }

  if (editingChart.yLabel) {
    g.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .style("font-size", "12px")
      .text(editingChart.yLabel)
  }

  // Group data by series for consistent styling
  const dataBySeriesIndex = d3.group(data, d => d.seriesIndex)

  // Render scatter points for each series
  dataBySeriesIndex.forEach((seriesData, seriesIndex) => {
    const yParam = editingChart.yAxisParams?.[seriesIndex]
    const markerConfig = yParam?.marker || {
      type: 'circle',
      size: 4,
      fillColor: colorScale(seriesData[0].series),
      borderColor: colorScale(seriesData[0].series)
    }

    const points = g.selectAll(`.scatter-points-${seriesIndex}`)
      .data(seriesData)
      .enter()
      .append("g")
      .attr("class", `scatter-points-${seriesIndex}`)

    // Add scatter points based on marker type
    
    if (markerConfig.type === 'circle') {
      points.append("circle")
        .attr("cx", d => {
          const scaledValue = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
          return xScale(scaledValue)
        })
        .attr("cy", d => yScale(d.y))
        .attr("r", markerConfig.size || 4)
        .style("fill", markerConfig.fillColor || colorScale(seriesData[0].series))
        .style("stroke", markerConfig.borderColor || colorScale(seriesData[0].series))
        .style("stroke-width", 1)
        .style("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", 0.7)
            .style("stroke-width", 1)
        })
        .on("click", function(event, d) {
          event.stopPropagation()
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          togglePinnedTooltip(event, content)
        })
    } else if (markerConfig.type === 'square') {
      const size = (markerConfig.size || 4) * 2
      points.append("rect")
        .attr("x", d => {
          const scaledValue = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
          const xPos = xScale(scaledValue)
          return xPos - size/2
        })
        .attr("y", d => yScale(d.y) - size/2)
        .attr("width", size)
        .attr("height", size)
        .style("fill", markerConfig.fillColor || colorScale(seriesData[0].series))
        .style("stroke", markerConfig.borderColor || colorScale(seriesData[0].series))
        .style("stroke-width", 1)
        .style("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", 0.7)
            .style("stroke-width", 1)
        })
        .on("click", function(event, d) {
          event.stopPropagation()
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          togglePinnedTooltip(event, content)
        })
    } else {
      // Default to circle for other marker types
      points.append("circle")
        .attr("cx", d => {
          const scaledValue = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
          return xScale(scaledValue)
        })
        .attr("cy", d => yScale(d.y))
        .attr("r", markerConfig.size || 4)
        .style("fill", markerConfig.fillColor || colorScale(seriesData[0].series))
        .style("stroke", markerConfig.borderColor || colorScale(seriesData[0].series))
        .style("stroke-width", 1)
        .style("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", 0.7)
            .style("stroke-width", 1)
        })
        .on("click", function(event, d) {
          event.stopPropagation()
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          togglePinnedTooltip(event, content)
        })
    }
  })

  // Add grid lines if enabled
  if (editingChart.yAxisParams?.some(param => true)) { // Assuming grid is enabled by default
    // Vertical grid lines
    const xTicks = editingChart.xAxisType === 'datetime' 
      ? (xScale as d3.ScaleTime<number, number>).ticks()
      : (xScale as d3.ScaleLinear<number, number>).ticks()
      
    g.selectAll(".grid-line-x")
      .data(xTicks)
      .enter()
      .append("line")
      .attr("class", "grid-line-x")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .style("stroke", "#e0e0e0")
      .style("stroke-width", 0.5)
      .style("stroke-dasharray", "2,2")

    // Horizontal grid lines
    g.selectAll(".grid-line-y")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("class", "grid-line-y")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .style("stroke", "#e0e0e0")
      .style("stroke-width", 0.5)
      .style("stroke-dasharray", "2,2")
  }

  // Add legend if multiple series
  if (seriesNames.length > 1) {
    const legend = g.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 120}, 20)`)

    const legendItems = legend.selectAll(".legend-item")
      .data(seriesNames)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`)

    legendItems.append("circle")
      .attr("cx", 6)
      .attr("cy", 6)
      .attr("r", 5)
      .style("fill", d => colorScale(d))

    legendItems.append("text")
      .attr("x", 16)
      .attr("y", 6)
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .text(d => d)
  }
}