import * as d3 from "d3"
import { ChartComponent } from "@/types"

interface BarChartProps {
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

export const renderBarChart = ({ g, data, width, height, editingChart, scalesRef }: BarChartProps) => {
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
    const maxValue = d3.max(data, d => d[param.parameter] || 0) || 100
    yDomain = [0, maxValue]
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
    .attr("y", d => yScale(d[param.parameter] || 0))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d[param.parameter] || 0))
    .attr("fill", param.line?.color || "#69b3a2")

  // For bar charts, we don't have a time scale, so we'll store null for xScale
  scalesRef.current = { xScale: null, yScale }
}