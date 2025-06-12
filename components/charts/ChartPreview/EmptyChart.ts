import * as d3 from "d3"
import { ChartComponent } from "@/types"
import { getTimeFormat } from "./utils"
import { calculateXAxisPosition } from "@/utils/chart/axisPositioning"
import { calculateConsistentYDomain } from "@/utils/chart/scaleUtils"

interface EmptyChartProps {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  width: number
  height: number
  chartType: string
  editingChart: ChartComponent
  scalesRef: React.MutableRefObject<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
    yScale: d3.ScaleLinear<number, number> | null
  }>
}

export const renderEmptyChart = ({ g, width, height, chartType, editingChart, scalesRef }: EmptyChartProps) => {
  // Always show axes with placeholder scales for line/scatter charts
  let xDomain: [Date, Date] | [number, number]
  let xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  
  const xAxisType = editingChart.xAxisType || "datetime"
    
    if (xAxisType === "datetime") {
      // Datetime: 1 month ago to current time
      const now = new Date()
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      xDomain = [oneMonthAgo, now] as [Date, Date]
      xScale = d3.scaleTime()
        .domain(xDomain)
        .range([0, width])
    } else if (xAxisType === "time") {
      // Time (elapsed): 0min to 30min
      xDomain = [0, 30] as [number, number]
      xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([0, width])
    } else {
      // Parameter: 0 to 100
      xDomain = [0, 100] as [number, number]
      xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([0, width])
    }
    
    // Calculate consistent Y domain that includes reference lines
    const yDomain = calculateConsistentYDomain([], editingChart, 0.1)
    
    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0])
    
    // Only apply nice() if using auto range
    const firstYParam = editingChart.yAxisParams?.[0]
    if (!firstYParam || firstYParam.range?.auto !== false) {
      yScale.nice()
    }
    
    // Calculate X-axis position
    const xAxisY = calculateXAxisPosition(yDomain, yScale, height)
    
    // X axis
    if (xAxisType === "datetime") {
      const timeFormat = getTimeFormat(xDomain[0] as Date, xDomain[1] as Date)
      g.append("g")
        .attr("transform", `translate(0,${xAxisY})`)
        .call(d3.axisBottom(xScale as d3.ScaleTime<number, number>)
          .ticks(5)
          .tickFormat((d) => d3.timeFormat(timeFormat)(d as Date)))
        .selectAll("text")
        .style("font-size", "12px")
    } else if (xAxisType === "time") {
      g.append("g")
        .attr("transform", `translate(0,${xAxisY})`)
        .call(d3.axisBottom(xScale as d3.ScaleLinear<number, number>)
          .ticks(5)
          .tickFormat((d) => `${d}min`))
        .selectAll("text")
        .style("font-size", "12px")
    } else {
      g.append("g")
        .attr("transform", `translate(0,${xAxisY})`)
        .call(d3.axisBottom(xScale as d3.ScaleLinear<number, number>)
          .ticks(5))
        .selectAll("text")
        .style("font-size", "12px")
    }
    
    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "12px")
    
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
    
    // Get unit from the first Y parameter (reuse existing firstYParam variable)
    const unit = firstYParam?.unit
    const labelWithUnit = firstYAxisLabel && unit ? `${firstYAxisLabel} [${unit}]` : firstYAxisLabel
    
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "12px")
      .text(labelWithUnit)
    
  // Store scales for reference lines
  scalesRef.current = { xScale, yScale }
}