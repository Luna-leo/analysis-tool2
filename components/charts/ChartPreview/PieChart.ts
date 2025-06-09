import * as d3 from "d3"
import { ChartComponent } from "@/types"

interface PieChartProps {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  data: any[]
  width: number
  height: number
  editingChart: ChartComponent
}

export const renderPieChart = ({ g, data, width, height, editingChart }: PieChartProps) => {
  const yParams = editingChart.yAxisParams || []
  if (!yParams.length) return

  const param = yParams[0]
  const radius = Math.min(width, height) / 2
  const centerX = width / 2
  const centerY = height / 2

  const pie = d3.pie<any>()
    .value(d => d[param.parameter] || 0)

  const arc = d3.arc<any>()
    .innerRadius(0)
    .outerRadius(radius)

  const color = d3.scaleOrdinal(d3.schemeCategory10)

  const pieGroup = g.append("g")
    .attr("transform", `translate(${centerX}, ${centerY})`)

  const arcs = pieGroup.selectAll(".arc")
    .data(pie(data))
    .enter().append("g")
    .attr("class", "arc")

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", (_, i) => color(i.toString()))

  arcs.append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text((_, i) => `${i + 1}`)
}