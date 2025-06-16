import * as d3 from "d3"
import { ChartComponent } from "@/types"
import { getTimeFormat } from "./utils"
import { calculateXAxisPosition } from "@/utils/chart/axisPositioning"
import { calculateConsistentYDomain } from "@/utils/chart/scaleUtils"
import { AxisManager } from "@/utils/chart/axisManager"

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
    
    // Use AxisManager to create axes with grid and tick settings
    const axisManager = new AxisManager({
      g,
      width,
      height,
      editingChart,
      data: []
    })
    
    // Manually set scales for empty chart
    ;(axisManager as any).xScale = xScale
    ;(axisManager as any).yScale = yScale
    
    // Render axes with proper formatting
    ;(axisManager as any).renderAxes()
    
    // Add chart title
    AxisManager.addChartTitle(g, width, editingChart)
    
    // Add axis labels
    AxisManager.addAxisLabels(g, width, height, editingChart)
    
    // Add chart border
    AxisManager.addChartBorder(g, width, height)

  // Store scales for reference lines
  scalesRef.current = { xScale, yScale }
}