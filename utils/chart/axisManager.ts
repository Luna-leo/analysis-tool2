import * as d3 from "d3"
import { ChartComponent, AxisType } from "@/types"
import { getTimeFormat } from "@/components/charts/ChartPreview/utils"
import { calculateXAxisPosition } from "@/utils/chart/axisPositioning"

export interface AxisConfig {
  type: AxisType
  domain: [any, any]
  range: [number, number]
  tickFormat?: (d: any) => string
  ticks?: number
}

export interface AxisManagerOptions {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  width: number
  height: number
  editingChart: ChartComponent
  data?: any[]
}

export interface ChartScales {
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
}

/**
 * Unified axis management for charts
 * Handles scale creation, axis rendering, and label formatting
 */
export class AxisManager {
  private xScale!: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  private yScale!: d3.ScaleLinear<number, number>
  
  constructor(private options: AxisManagerOptions) {}

  /**
   * Create scales and render axes
   */
  createAxes(): ChartScales {
    this.createXScale()
    this.createYScale()
    this.renderAxes()
    
    return {
      xScale: this.xScale,
      yScale: this.yScale
    }
  }

  /**
   * Create X-axis scale based on axis type and range settings
   */
  private createXScale(): void {
    const { editingChart, data, width } = this.options
    const xAxisType = editingChart.xAxisType || 'datetime'
    
    if (xAxisType === 'datetime') {
      let xDomain: [Date, Date]
      
      if (editingChart.xAxisRange?.auto === false && editingChart.xAxisRange.min && editingChart.xAxisRange.max) {
        xDomain = [new Date(editingChart.xAxisRange.min), new Date(editingChart.xAxisRange.max)]
      } else if (data && data.length > 0) {
        // Extract datetime values from data
        // For datetime axis, prioritize timestamp field
        const xParameter = editingChart.xParameter || 'timestamp'
        const dateValues = data.map(d => {
          // Try multiple fields: timestamp first, then xParameter, then x
          const val = d.timestamp || d[xParameter] || d.x
          return val instanceof Date ? val : new Date(val)
        }).filter(d => !isNaN(d.getTime()))
        
        if (dateValues.length > 0) {
          const extent = d3.extent(dateValues) as [Date, Date]
          xDomain = extent
        } else {
          // Fallback to last hour
          const now = new Date()
          xDomain = [new Date(now.getTime() - 60 * 60 * 1000), now]
        }
      } else {
        // Default to last hour
        const now = new Date()
        xDomain = [new Date(now.getTime() - 60 * 60 * 1000), now]
      }
      
      this.xScale = d3.scaleTime()
        .domain(xDomain)
        .range([0, width])
    } else {
      // Linear scale for numeric/parameter types
      let xDomain: [number, number]
      
      if (editingChart.xAxisRange?.auto === false && editingChart.xAxisRange.min && editingChart.xAxisRange.max) {
        xDomain = [Number(editingChart.xAxisRange.min), Number(editingChart.xAxisRange.max)]
      } else if (data && data.length > 0) {
        const xParameter = editingChart.xParameter || 'timestamp'
        const extent = d3.extent(data, d => Number(d[xParameter] || d.x)) as [number, number]
        const padding = (extent[1] - extent[0]) * 0.05
        xDomain = [extent[0] - padding, extent[1] + padding]
      } else {
        xDomain = [0, 100]
      }
      
      this.xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([0, width])
    }
  }

  /**
   * Create Y-axis scale based on parameters and range settings
   */
  private createYScale(): void {
    const { editingChart, data, height } = this.options
    const yParams = editingChart.yAxisParams || []
    
    // Group parameters by axis
    const groupedByAxis: Record<number, typeof yParams> = {}
    yParams.forEach(param => {
      if (param.parameter && param.parameter.trim() !== '') {
        const axisNo = param.axisNo || 1
        if (!groupedByAxis[axisNo]) groupedByAxis[axisNo] = []
        groupedByAxis[axisNo].push(param)
      }
    })
    
    // Use first axis for primary Y scale
    const firstAxisParams = Object.values(groupedByAxis)[0] || []
    let yDomain: [number, number]
    
    if (firstAxisParams.length === 0) {
      yDomain = [0, 100]
    } else if (firstAxisParams[0].range?.auto === false) {
      yDomain = [firstAxisParams[0].range.min || 0, firstAxisParams[0].range.max || 100]
    } else if (data && data.length > 0) {
      const allValues = data.flatMap(d => 
        firstAxisParams.map(p => d[p.parameter] || d.y || 0)
      )
      if (allValues.length === 0) {
        yDomain = [0, 100]
      } else {
        const extent = d3.extent(allValues) as [number, number]
        yDomain = extent[0] !== undefined && extent[1] !== undefined ? extent : [0, 100]
      }
    } else {
      yDomain = [0, 100]
    }
    
    this.yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0])
    
    // Apply nice() if using auto range
    if (firstAxisParams.length > 0 && firstAxisParams[0].range?.auto !== false && data && data.length > 0) {
      this.yScale.nice()
    }
  }

  /**
   * Render X and Y axes with proper formatting
   */
  private renderAxes(): void {
    const { g, width, height, editingChart } = this.options
    const xAxisType = editingChart.xAxisType || 'datetime'
    const xAxisTicks = editingChart.xAxisTicks || 5
    const yAxisTicks = editingChart.yAxisTicks || 5
    const xAxisTickPrecision = editingChart.xAxisTickPrecision ?? 2
    const yAxisTickPrecision = editingChart.yAxisTickPrecision ?? 2
    
    // Create X-axis
    let xAxis: d3.Axis<number | Date | { valueOf(): number }>
    
    if (xAxisType === 'datetime') {
      const xDomain = this.xScale.domain() as [Date, Date]
      const timeFormat = getTimeFormat(xDomain[0], xDomain[1])
      xAxis = d3.axisBottom(this.xScale)
        .ticks(xAxisTicks)
        .tickFormat((d) => d3.timeFormat(timeFormat)(d as Date))
    } else if (xAxisType === 'time') {
      xAxis = d3.axisBottom(this.xScale)
        .ticks(xAxisTicks)
        .tickFormat(d => {
          const minutes = Number(d)
          const hours = Math.floor(minutes / 60)
          const mins = Math.floor(minutes % 60)
          return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
        })
    } else {
      xAxis = d3.axisBottom(this.xScale)
        .ticks(xAxisTicks)
        .tickFormat(d3.format(`.${xAxisTickPrecision}f`))
    }
    
    // Calculate X-axis position
    const yDomain = this.yScale.domain() as [number, number]
    const xAxisY = calculateXAxisPosition(yDomain, this.yScale, height)
    
    // Render X-axis
    const xAxisGroup = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${xAxisY})`)
      .call(xAxis)
    
    xAxisGroup.selectAll("text")
      .style("font-size", "12px")
    
    // Add grid lines if enabled
    if (editingChart.showGrid) {
      xAxisGroup.selectAll(".tick line")
        .clone()
        .attr("y2", -height)
        .attr("stroke-opacity", 0.1)
    }
    
    // Create and render Y-axis
    const yAxis = d3.axisLeft(this.yScale)
      .ticks(yAxisTicks)
      .tickFormat(d3.format(`.${yAxisTickPrecision}f`))
    
    const yAxisGroup = g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
    
    yAxisGroup.selectAll("text")
      .style("font-size", "12px")
    
    // Add grid lines if enabled
    if (editingChart.showGrid) {
      yAxisGroup.selectAll(".tick line")
        .clone()
        .attr("x2", width)
        .attr("stroke-opacity", 0.1)
    }
  }

  /**
   * Add axis labels
   */
  static addAxisLabels(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    editingChart: ChartComponent
  ): void {
    // X-axis label
    if (editingChart.xLabel) {
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("font-size", "12px")
        .text(editingChart.xLabel)
    }
    
    // Y-axis label
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
  }

  /**
   * Add chart border
   */
  static addChartBorder(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number
  ): void {
    g.append("rect")
      .attr("class", "chart-border")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1)
  }

  /**
   * Get scales for external use
   */
  getScales(): ChartScales {
    return {
      xScale: this.xScale,
      yScale: this.yScale
    }
  }
}