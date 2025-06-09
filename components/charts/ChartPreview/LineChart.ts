import * as d3 from "d3"
import { ChartComponent } from "@/types"
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
    const extent = d3.extent(allValues)
    yDomain = extent[0] !== undefined && extent[1] !== undefined ? [extent[0], extent[1]] : [0, 100]
  }
  
  const yScale = d3.scaleLinear()
    .domain(yDomain)
    .nice()
    .range([height, 0])

  const timeFormat = getTimeFormat(xDomain[0], xDomain[1])
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => d3.timeFormat(timeFormat)(d as Date)))

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

  // Store scales for reference lines
  scalesRef.current = { xScale, yScale }
}