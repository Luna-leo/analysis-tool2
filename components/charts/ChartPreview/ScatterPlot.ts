import * as d3 from "d3"
import { ChartComponent, DataSourceStyle } from "@/types"
import { formatXValue, getXValueForScale } from "@/utils/chartAxisUtils"
import { calculateXAxisPosition } from "@/utils/chart/axisPositioning"
import { calculateConsistentYDomain } from "@/utils/chart/scaleUtils"
import { showTooltip, updateTooltipPosition, hideTooltip } from "@/utils/chartTooltip"
import { determineLODLevel, simplifyData, renderLODGrid, getRenderMethod } from "./LODRenderer"
import { renderWithOptimizedCanvas } from "./OptimizedCanvasRenderer"
import { performanceTracker } from "@/utils/performanceTracking"
import { defaultChartColors } from "@/utils/chartColors"

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
    dataSourceIndex?: number
  }>
  width: number
  height: number
  editingChart: ChartComponent
  scalesRef: React.MutableRefObject<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
    yScale: d3.ScaleLinear<number, number> | null
  }>
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
}

export function renderScatterPlot({ g, data, width, height, editingChart, scalesRef, dataSourceStyles = {} }: RenderScatterPlotProps) {
  // Start performance tracking
  performanceTracker.mark('scatter-plot-render-start')
  
  // Clear previous content
  g.selectAll("*").remove()

  if (data.length === 0) {
    return
  }
  
  // Determine LOD level and render method
  const viewportSize = { width, height }
  const lodConfig = determineLODLevel(data.length, 1, viewportSize)
  let renderMethod = getRenderMethod(data.length, viewportSize)
  
  // Add event listener to close tooltips on wheel/drag
  const svg = g.node()?.ownerSVGElement
  if (svg) {
    d3.select(svg)
      .on("wheel.tooltip", () => {
        hideTooltip()
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
      .tickFormat((d) => d3.timeFormat("%Y-%m-%d %H:%M")(d as Date))
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

  // Create color scale for different series using our default colors
  const seriesNames = Array.from(new Set(data.map(d => d.series)))
  
  // Create a mapping of series to color based on dataSourceIndex
  const seriesColorMap = new Map<string, string>()
  data.forEach(dataPoint => {
    if (!seriesColorMap.has(dataPoint.series)) {
      const index = dataPoint.dataSourceIndex ?? dataPoint.seriesIndex ?? 0
      seriesColorMap.set(dataPoint.series, defaultChartColors[index % defaultChartColors.length])
    }
  })
  
  const colorScale = (series: string): string => {
    return seriesColorMap.get(series) || defaultChartColors[0]
  }
  
  // Create y-axis
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d3.format(".2f"))
  
  // Use canvas rendering for high-density data - lowered threshold for better performance
  if (renderMethod === 'canvas' && data.length > 300) {
    try {
      // Create canvas element
      const svg = g.node()?.ownerSVGElement
      if (!svg) {
        console.warn('SVG element not found for canvas rendering')
        renderMethod = 'svg' // Fallback to SVG
      } else {
        const svgRect = svg.getBoundingClientRect()
        const canvas = document.createElement('canvas')
        canvas.style.position = 'absolute'
        canvas.style.left = `${svgRect.left}px`
        canvas.style.top = `${svgRect.top}px`
        canvas.style.pointerEvents = 'none'
        
        // Add canvas to DOM temporarily for rendering
        document.body.appendChild(canvas)
        
        try {
          // Render with optimized canvas
          const margin = { top: 0, right: 0, bottom: 0, left: 0 }
          renderWithOptimizedCanvas({
            canvas,
            data,
            width,
            height,
            margin,
            xScale,
            yScale,
            editingChart,
            colorScale: (series: string) => colorScale(series),
            dataSourceStyles
          })
          
          // Convert canvas to image and embed in SVG
          const dataURL = canvas.toDataURL()
          g.append("image")
            .attr("xlink:href", dataURL)
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("preserveAspectRatio", "none")
        } catch (canvasError) {
          console.error('Canvas rendering failed:', canvasError)
          renderMethod = 'svg' // Fallback to SVG
        } finally {
          // Always remove canvas from DOM
          if (canvas.parentNode) {
            document.body.removeChild(canvas)
          }
        }
      }
    } catch (error) {
      console.error('Canvas setup failed:', error)
      renderMethod = 'svg' // Fallback to SVG
    }
    
    // If canvas rendering succeeded, add axes and labels
    if (renderMethod === 'canvas') {
    
    // Add axes and labels over the canvas image
    const yScaleDomain = yScale.domain()
    const xAxisY = calculateXAxisPosition(yScaleDomain as [number, number], yScale, height)
    
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${xAxisY})`)
      .call(xAxis)

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
    
    // Add chart border (外枠) for canvas mode
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1)
    
    // Add axis labels
    if (editingChart.xLabel) {
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("font-size", "12px")
        .text(editingChart.xLabel)
    }

    // Y axis label - use yAxisLabels for axis 1
    const yAxisLabels = editingChart.yAxisLabels || {}
    const firstYAxisLabel = yAxisLabels[1] || Object.values(yAxisLabels)[0] || ""
    
    // Get unit from the first Y parameter
    const firstYParam = editingChart.yAxisParams?.find(param => (param.axisNo || 1) === 1)
    const unit = firstYParam?.unit
    const labelWithUnit = firstYAxisLabel && unit ? `${firstYAxisLabel} [${unit}]` : firstYAxisLabel
    
    if (labelWithUnit) {
      g.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("font-size", "12px")
        .text(labelWithUnit)
    }
      
      return // Exit early for canvas rendering
    }
  }

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
  if (editingChart.xLabel) {
    g.append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("font-size", "12px")
      .text(editingChart.xLabel)
  }

  // Y axis label - use yAxisLabels for axis 1
  const yAxisLabels = editingChart.yAxisLabels || {}
  const firstYAxisLabel = yAxisLabels[1] || Object.values(yAxisLabels)[0] || ""
  
  // Get unit from the first Y parameter
  const firstYParam = editingChart.yAxisParams?.find(param => (param.axisNo || 1) === 1)
  const unit = firstYParam?.unit
  const labelWithUnit = firstYAxisLabel && unit ? `${firstYAxisLabel} [${unit}]` : firstYAxisLabel
  
  if (labelWithUnit) {
    g.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .style("font-size", "12px")
      .text(labelWithUnit)
  }

  // Add grid lines based on LOD level
  renderLODGrid(g, width, height, xScale, yScale, lodConfig)

  // Add chart border (外枠)
  g.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("stroke", "#d1d5db")
    .attr("stroke-width", 1)

  // Create a separate group for scatter points to ensure they're on top
  const scatterGroup = g.append("g")
    .attr("class", "scatter-points-container")
    .style("pointer-events", "all")

  // Group data by series for consistent styling
  const dataBySeriesIndex = d3.group(data, d => d.seriesIndex)

  // Render lines and scatter points for each series
  dataBySeriesIndex.forEach((seriesData, seriesIndex) => {
    const firstDataPoint = seriesData[0]
    const dataSourceStyle = dataSourceStyles[firstDataPoint.dataSourceId] || {}
    
    // Apply DataSource styles with priority over yParam marker config
    const defaultColor = colorScale(firstDataPoint.series)
    const markerConfig = {
      type: dataSourceStyle.markerShape || 'circle',
      size: dataSourceStyle.markerSize || 4,
      fillColor: dataSourceStyle.markerColor || dataSourceStyle.lineColor || defaultColor,
      borderColor: dataSourceStyle.markerColor || dataSourceStyle.lineColor || defaultColor,
      opacity: dataSourceStyle.markerOpacity !== undefined ? dataSourceStyle.markerOpacity : 0.7,
      enabled: dataSourceStyle.markerEnabled !== undefined ? dataSourceStyle.markerEnabled : true
    }
    
    // Draw line if enabled
    if (dataSourceStyle.lineEnabled) {
      const line = d3.line<typeof seriesData[0]>()
        .x(d => {
          const scaledValue = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
          return xScale(scaledValue)
        })
        .y(d => yScale(d.y))
        .curve(
          dataSourceStyle.interpolation === 'smooth' ? d3.curveCardinal :
          dataSourceStyle.interpolation === 'step' ? d3.curveStep :
          dataSourceStyle.interpolation === 'stepAfter' ? d3.curveStepAfter :
          dataSourceStyle.interpolation === 'stepBefore' ? d3.curveStepBefore :
          d3.curveLinear
        )
      
      scatterGroup.append("path")
        .datum(seriesData)
        .attr("fill", "none")
        .attr("stroke", dataSourceStyle.lineColor || defaultColor)
        .attr("stroke-width", dataSourceStyle.lineWidth || 2)
        .attr("stroke-dasharray",
          dataSourceStyle.lineStyle === 'dashed' ? '5,5' :
          dataSourceStyle.lineStyle === 'dotted' ? '2,2' :
          dataSourceStyle.lineStyle === 'dashdot' ? '5,2,2,2' :
          'none'
        )
        .attr("opacity", dataSourceStyle.lineOpacity || 1)
        .attr("d", line)
    }
    
    // Simplify data based on LOD
    const simplifiedData = simplifyData(seriesData, lodConfig)

    // Skip rendering if markers are disabled
    if (!markerConfig.enabled) {
      return
    }
    
    const points = scatterGroup.selectAll(`.scatter-points-${seriesIndex}`)
      .data(lodConfig.showMarkers ? simplifiedData : [])
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
        .attr("r", lodConfig.markerSize || markerConfig.size || 4)
        .style("fill", markerConfig.fillColor || colorScale(seriesData[0].series))
        .style("stroke", markerConfig.borderColor || colorScale(seriesData[0].series))
        .style("stroke-width", 1)
        .style("opacity", markerConfig.opacity)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          showTooltip(event, content)
        })
        .on("mousemove", function(event, d) {
          updateTooltipPosition(event)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", markerConfig.opacity)
            .style("stroke-width", 1)
          
          hideTooltip()
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
        .style("opacity", markerConfig.opacity)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          showTooltip(event, content)
        })
        .on("mousemove", function(event, d) {
          updateTooltipPosition(event)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", markerConfig.opacity)
            .style("stroke-width", 1)
          
          hideTooltip()
        })
    } else if (markerConfig.type === 'triangle') {
      const size = markerConfig.size || 4
      const trianglePath = d3.symbol().type(d3.symbolTriangle).size(size * size * 2)
      
      points.append("path")
        .attr("d", trianglePath)
        .attr("transform", d => {
          const scaledValue = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
          return `translate(${xScale(scaledValue)},${yScale(d.y)})`
        })
        .style("fill", markerConfig.fillColor || colorScale(seriesData[0].series))
        .style("stroke", markerConfig.borderColor || colorScale(seriesData[0].series))
        .style("stroke-width", 1)
        .style("opacity", markerConfig.opacity)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          showTooltip(event, content)
        })
        .on("mousemove", function(event, d) {
          updateTooltipPosition(event)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", markerConfig.opacity)
            .style("stroke-width", 1)
          
          hideTooltip()
        })
    } else if (markerConfig.type === 'diamond') {
      const size = markerConfig.size || 4
      const diamondPath = d3.symbol().type(d3.symbolDiamond).size(size * size * 2.5)
      
      points.append("path")
        .attr("d", diamondPath)
        .attr("transform", d => {
          const scaledValue = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
          return `translate(${xScale(scaledValue)},${yScale(d.y)})`
        })
        .style("fill", markerConfig.fillColor || colorScale(seriesData[0].series))
        .style("stroke", markerConfig.borderColor || colorScale(seriesData[0].series))
        .style("stroke-width", 1)
        .style("opacity", markerConfig.opacity)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          showTooltip(event, content)
        })
        .on("mousemove", function(event, d) {
          updateTooltipPosition(event)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", markerConfig.opacity)
            .style("stroke-width", 1)
          
          hideTooltip()
        })
    } else if (markerConfig.type === 'cross') {
      const size = markerConfig.size || 4
      const crossPath = d3.symbol().type(d3.symbolCross).size(size * size * 2)
      
      points.append("path")
        .attr("d", crossPath)
        .attr("transform", d => {
          const scaledValue = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
          return `translate(${xScale(scaledValue)},${yScale(d.y)})`
        })
        .style("fill", markerConfig.fillColor || colorScale(seriesData[0].series))
        .style("stroke", markerConfig.borderColor || colorScale(seriesData[0].series))
        .style("stroke-width", 1)
        .style("opacity", markerConfig.opacity)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          showTooltip(event, content)
        })
        .on("mousemove", function(event, d) {
          updateTooltipPosition(event)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", markerConfig.opacity)
            .style("stroke-width", 1)
          
          hideTooltip()
        })
    } else if (markerConfig.type === 'star') {
      const size = markerConfig.size || 4
      const starPath = d3.symbol().type(d3.symbolStar).size(size * size * 2)
      
      points.append("path")
        .attr("d", starPath)
        .attr("transform", d => {
          const scaledValue = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
          return `translate(${xScale(scaledValue)},${yScale(d.y)})`
        })
        .style("fill", markerConfig.fillColor || colorScale(seriesData[0].series))
        .style("stroke", markerConfig.borderColor || colorScale(seriesData[0].series))
        .style("stroke-width", 1)
        .style("opacity", markerConfig.opacity)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          showTooltip(event, content)
        })
        .on("mousemove", function(event, d) {
          updateTooltipPosition(event)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", markerConfig.opacity)
            .style("stroke-width", 1)
          
          hideTooltip()
        })
    } else {
      // Default to circle for unknown marker types
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
        .style("opacity", markerConfig.opacity)
        .style("cursor", "pointer")
        .style("pointer-events", "all")
        .on("mouseover", function(event, d) {
          d3.select(this)
            .style("opacity", 1)
            .style("stroke-width", 2)
          
          const xDisplay = formatXValue(d.x, editingChart.xAxisType || 'parameter')
          
          const content = `
            <div><strong>${d.series}</strong></div>
            <div>X: ${xDisplay}</div>
            <div>Y: ${d.y.toFixed(3)}</div>
            <div>Time: ${new Date(d.timestamp).toLocaleString()}</div>
            <div>Source: ${d.dataSourceLabel}</div>
          `
          
          showTooltip(event, content)
        })
        .on("mousemove", function(event, d) {
          updateTooltipPosition(event)
        })
        .on("mouseout", function(event, d) {
          d3.select(this)
            .style("opacity", markerConfig.opacity)
            .style("stroke-width", 1)
          
          hideTooltip()
        })
    }
  })

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
      .style("fill", d => {
        // Find the first data point for this series to get the dataSourceId
        const seriesData = data.find(point => point.series === d)
        if (seriesData) {
          const dataSourceStyle = dataSourceStyles[seriesData.dataSourceId] || {}
          return dataSourceStyle.markerColor || dataSourceStyle.lineColor || colorScale(d)
        }
        return colorScale(d)
      })

    legendItems.append("text")
      .attr("x", 16)
      .attr("y", 6)
      .attr("dy", "0.35em")
      .style("font-size", "11px")
      .text(d => d)
  }
  
  // End performance tracking
  performanceTracker.measure('scatter-plot-render', 'scatter-plot-render-start', undefined, {
    dataPoints: data.length,
    lodLevel: lodConfig.level,
    renderMethod: renderMethod
  })
}