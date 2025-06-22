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

export interface BoundsInfo {
  exceedsLeft: boolean
  exceedsRight: boolean
  exceedsTop: boolean
  exceedsBottom: boolean
  leftOverflow: number
  rightOverflow: number
  topOverflow: number
  bottomOverflow: number
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
  private yAxisGroup?: d3.Selection<SVGGElement, unknown, null, undefined>
  
  constructor(private options: AxisManagerOptions) {}

  /**
   * Create scales and render axes
   */
  createAxes(): ChartScales {
    this.createXScale()
    this.createYScale()
    this.yAxisGroup = this.renderAxes()
    
    return {
      xScale: this.xScale,
      yScale: this.yScale
    }
  }
  
  /**
   * Get the Y-axis group for external use
   */
  getYAxisGroup(): d3.Selection<SVGGElement, unknown, null, undefined> | undefined {
    return this.yAxisGroup
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
        // Ensure we create valid Date objects
        const minDate = new Date(editingChart.xAxisRange.min)
        const maxDate = new Date(editingChart.xAxisRange.max)
        
        // Validate dates
        if (isNaN(minDate.getTime()) || isNaN(maxDate.getTime())) {
          console.warn('Invalid date range in xAxisRange:', editingChart.xAxisRange)
          // Fall back to data extent
          const dateValues = (data || []).map(d => {
            if ('x' in d && d.x !== undefined) {
              return d.x instanceof Date ? d.x : new Date(d.x)
            }
            return new Date()
          }).filter(d => !isNaN(d.getTime()))
          
          if (dateValues.length > 0) {
            xDomain = d3.extent(dateValues) as [Date, Date]
          } else {
            // Default to current date range
            const now = new Date()
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            xDomain = [yesterday, now]
          }
        } else {
          xDomain = [minDate, maxDate]
        }
      } else if (data && data.length > 0) {
        // Extract datetime values from data
        // For scatter plot data format, use d.x directly if available
        const xParameter = editingChart.xParameter || 'timestamp'
        const dateValues = data.map(d => {
          // For transformed scatter plot data, x is already the correct value
          if ('x' in d && d.x !== undefined) {
            return d.x instanceof Date ? d.x : new Date(d.x)
          }
          // Fallback for other data formats
          const val = d.timestamp || d[xParameter]
          return val instanceof Date ? val : new Date(val)
        }).filter(d => !isNaN(d.getTime()))
        
        if (dateValues.length > 0) {
          const extent = d3.extent(dateValues) as [Date, Date]
          
          // Apply nice rounding for datetime AutoRange
          const rangeMs = extent[1].getTime() - extent[0].getTime()
          const msPerMinute = 60 * 1000
          const msPerHour = 60 * msPerMinute
          const msPerDay = 24 * msPerHour
          
          let roundedMin: Date
          let roundedMax: Date
          
          if (rangeMs <= msPerHour) {
            // Less than 1 hour: round to 5 or 15 minutes
            const roundTo = rangeMs <= 30 * msPerMinute ? 5 : 15
            roundedMin = new Date(Math.floor(extent[0].getTime() / (roundTo * msPerMinute)) * (roundTo * msPerMinute))
            roundedMax = new Date(Math.ceil(extent[1].getTime() / (roundTo * msPerMinute)) * (roundTo * msPerMinute))
          } else if (rangeMs <= 6 * msPerHour) {
            // 1-6 hours: round to 30 minutes or 1 hour
            const roundTo = rangeMs <= 3 * msPerHour ? 30 : 60
            roundedMin = new Date(Math.floor(extent[0].getTime() / (roundTo * msPerMinute)) * (roundTo * msPerMinute))
            roundedMax = new Date(Math.ceil(extent[1].getTime() / (roundTo * msPerMinute)) * (roundTo * msPerMinute))
          } else if (rangeMs <= msPerDay) {
            // 6-24 hours: round to 1 or 3 hours
            const roundTo = rangeMs <= 12 * msPerHour ? 1 : 3
            roundedMin = new Date(Math.floor(extent[0].getTime() / (roundTo * msPerHour)) * (roundTo * msPerHour))
            roundedMax = new Date(Math.ceil(extent[1].getTime() / (roundTo * msPerHour)) * (roundTo * msPerHour))
          } else {
            // More than 1 day: round to 6 hours or 1 day
            const roundTo = rangeMs <= 7 * msPerDay ? 6 : 24
            roundedMin = new Date(Math.floor(extent[0].getTime() / (roundTo * msPerHour)) * (roundTo * msPerHour))
            roundedMax = new Date(Math.ceil(extent[1].getTime() / (roundTo * msPerHour)) * (roundTo * msPerHour))
          }
          
          xDomain = [roundedMin, roundedMax]
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
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AxisManager] Creating parameter scale:`, {
            chartId: editingChart.id,
            xParameter,
            dataLength: data.length,
            sampleData: data.slice(0, 3).map(d => ({
              hasX: 'x' in d,
              x: 'x' in d ? d.x : undefined,
              xType: 'x' in d ? typeof d.x : undefined,
              xIsDate: 'x' in d ? d.x instanceof Date : undefined,
              paramValue: d[xParameter],
              paramType: typeof d[xParameter]
            }))
          })
        }
        
        const values = data.map(d => {
          // For transformed scatter plot data, use d.x directly
          if ('x' in d && typeof d.x === 'number') {
            return d.x
          }
          // Fallback for other data formats
          const val = d[xParameter]
          if (val !== undefined && val !== null) {
            const numVal = Number(val)
            return isNaN(numVal) ? null : numVal
          }
          return null
        }).filter(v => v !== null && !isNaN(v)) as number[]
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AxisManager] Extracted values:`, {
            chartId: editingChart.id,
            valuesLength: values.length,
            values: values.slice(0, 10),
            allValues: values.length <= 20 ? values : undefined
          })
        }
        
        if (values.length > 0) {
          const extent = d3.extent(values) as [number, number]
          // Add padding only if the range is not zero
          const range = extent[1] - extent[0]
          if (range > 0) {
            const padding = range * 0.05
            xDomain = [extent[0] - padding, extent[1] + padding]
          } else {
            // If all values are the same, create a reasonable range around that value
            const value = extent[0]
            const padding = Math.abs(value) * 0.1 || 1 // 10% of value or 1 if value is 0
            xDomain = [value - padding, value + padding]
          }
          if (process.env.NODE_ENV === 'development') {
            console.log(`[AxisManager] Calculated domain:`, {
              chartId: editingChart.id,
              extent,
              xDomain
            })
          }
        } else {
          // No valid numeric values found
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[AxisManager] No valid numeric values found for parameter x-axis, using default range [0, 100]`, {
              chartId: editingChart.id,
              xParameter,
              dataLength: data.length
            })
          }
          xDomain = [0, 100]
        }
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
      // For scatter plot data format, use d.y directly
      const allValues = data.map(d => {
        // Check if this is transformed scatter plot data (has y property)
        if ('y' in d && typeof d.y === 'number') {
          return d.y
        }
        // Fallback to parameter-based extraction for other data formats
        const paramValue = firstAxisParams.map(p => d[p.parameter] || 0)[0] || 0
        return paramValue
      }).filter(v => typeof v === 'number' && !isNaN(v))
      
      
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
  private renderAxes(): d3.Selection<SVGGElement, unknown, null, undefined> | undefined {
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
      // Ensure domain values are Date objects
      const startDate = xDomain[0] instanceof Date ? xDomain[0] : new Date(xDomain[0])
      const endDate = xDomain[1] instanceof Date ? xDomain[1] : new Date(xDomain[1])
      const timeFormat = getTimeFormat(startDate, endDate)
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
        .attr("class", "grid-line")
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
        .attr("class", "grid-line")
    }
    
    // Return the Y-axis group for label positioning
    return yAxisGroup
  }

  /**
   * Add axis labels
   */
  static addAxisLabels(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    editingChart: ChartComponent,
    yAxisGroup?: d3.Selection<SVGGElement, unknown, null, undefined>,
    labelPositions?: {
      xLabel?: { x: number; y: number }
      yLabel?: { x: number; y: number }
    }
  ): void {
    const xLabelOffset = editingChart.xLabelOffset || 40
    const yLabelOffset = editingChart.yLabelOffset || 50
    
    // X-axis label with bounds checking
    const showXLabel = editingChart.showXLabel ?? true
    if (editingChart.xLabel && showXLabel) {
      let labelX: number
      let labelY: number
      
      if (labelPositions?.xLabel) {
        // Use provided position
        labelX = labelPositions.xLabel.x
        labelY = labelPositions.xLabel.y
      } else {
        // Default position
        const margin = editingChart.margins || { top: 20, right: 40, bottom: 60, left: 60 }
        const maxYPosition = height + margin.bottom - 10 // Leave 10px safety margin
        labelX = width / 2
        labelY = Math.min(height + xLabelOffset, maxYPosition)
      }
      
      g.append("text")
        .attr("class", "x-axis-label draggable-label")
        .attr("text-anchor", "middle")
        .attr("x", labelX)
        .attr("y", labelY)
        .style("font-size", "12px")
        .style("cursor", "move")
        .text(editingChart.xLabel)
    }
    
    // Y-axis label with bounds checking
    const showYLabel = editingChart.showYLabel ?? true
    const yAxisLabels = editingChart.yAxisLabels || {}
    const firstYAxisLabel = yAxisLabels[1] || Object.values(yAxisLabels)[0] || ""
    
    // Get unit from the first Y parameter
    const firstYParam = editingChart.yAxisParams?.find(param => (param.axisNo || 1) === 1)
    const unit = firstYParam?.unit
    const labelWithUnit = firstYAxisLabel && unit ? `${firstYAxisLabel} [${unit}]` : firstYAxisLabel
    
    if (labelWithUnit && showYLabel) {
      let labelX: number
      let labelY: number
      
      if (labelPositions?.yLabel) {
        // Use provided position (note: for Y label, x and y are swapped due to rotation)
        labelX = -labelPositions.yLabel.y  // Negative because of rotation
        labelY = labelPositions.yLabel.x
      } else {
        // Calculate dynamic offset based on tick label widths
        let dynamicYLabelOffset = yLabelOffset
        
        // If yAxisGroup is provided, measure tick label widths
        if (yAxisGroup) {
          let maxTickWidth = 0
          yAxisGroup.selectAll(".tick text").each(function() {
            const tickElement = this as SVGTextElement
            try {
              const bbox = tickElement.getBBox()
              if (bbox.width > maxTickWidth) {
                maxTickWidth = bbox.width
              }
            } catch (e) {
              // Fallback if getBBox fails
              console.warn("Failed to measure tick width:", e)
            }
          })
          
          // Add padding based on layout size
          const margin = editingChart.margins || { top: 20, right: 40, bottom: 60, left: 60 }
          const isCompactLayout = margin.left <= 45 // Detect compact layouts
          const tickPadding = isCompactLayout ? 8 : 12 // Smaller padding for compact layouts
          const labelPadding = isCompactLayout ? 20 : 25 // Additional space for the label itself
          
          // Calculate dynamic offset: tick width + tick padding + label padding
          if (maxTickWidth > 0) {
            dynamicYLabelOffset = maxTickWidth + tickPadding + labelPadding
          }
        } else {
          // If no yAxisGroup, try to find it in the DOM
          const existingYAxis = g.select(".y-axis")
          if (!existingYAxis.empty()) {
            let maxTickWidth = 0
            existingYAxis.selectAll(".tick text").each(function() {
              const tickElement = this as SVGTextElement
              try {
                const bbox = tickElement.getBBox()
                if (bbox.width > maxTickWidth) {
                  maxTickWidth = bbox.width
                }
              } catch (e) {
                // Silent fail
              }
            })
            
            const margin = editingChart.margins || { top: 20, right: 40, bottom: 60, left: 60 }
            const isCompactLayout = margin.left <= 45
            const tickPadding = isCompactLayout ? 8 : 12
            const labelPadding = isCompactLayout ? 20 : 25
            
            if (maxTickWidth > 0) {
              dynamicYLabelOffset = maxTickWidth + tickPadding + labelPadding
            }
          }
        }
        
        // Ensure label doesn't exceed left margin
        const margin = editingChart.margins || { top: 20, right: 40, bottom: 60, left: 60 }
        const maxXPosition = -margin.left + 15 // Leave 15px safety margin
        labelX = -height / 2
        labelY = Math.max(-dynamicYLabelOffset, maxXPosition)
      }
      
      g.append("text")
        .attr("class", "y-axis-label draggable-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", labelX)
        .attr("y", labelY)
        .style("font-size", "12px")
        .style("cursor", "move")
        .text(labelWithUnit)
    }
  }

  /**
   * Add chart title
   */
  static addChartTitle(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    editingChart: ChartComponent,
    titlePosition?: { x: number; y: number }
  ): void {
    const showTitle = editingChart.showTitle ?? true
    
    if (editingChart.title && showTitle) {
      let titleX: number
      let titleY: number
      
      if (titlePosition) {
        // Use provided position
        titleX = titlePosition.x
        titleY = titlePosition.y
      } else {
        // Default position
        const marginTop = typeof editingChart.margins?.top === 'number' 
          ? editingChart.margins.top 
          : 20
        
        titleX = width / 2
        titleY = -marginTop + 15
      }
      
      g.append("text")
        .attr("class", "chart-title draggable-label")
        .attr("text-anchor", "middle")
        .attr("x", titleX)
        .attr("y", titleY)
        .style("font-size", "14px")
        .style("font-weight", "500")
        .style("fill", "#1f2937") // Explicit color to ensure visibility
        .style("cursor", "move")
        .text(editingChart.title)
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

  /**
   * Check if any chart elements exceed the bounds
   */
  static checkBounds(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    margin: { top: number; right: number; bottom: number; left: number }
  ): BoundsInfo {
    const bounds: BoundsInfo = {
      exceedsLeft: false,
      exceedsRight: false,
      exceedsTop: false,
      exceedsBottom: false,
      leftOverflow: 0,
      rightOverflow: 0,
      topOverflow: 0,
      bottomOverflow: 0
    }

    // Check all text elements for overflow
    g.selectAll("text").each(function() {
      const element = this as SVGTextElement
      const bbox = element.getBBox()
      const transform = element.getAttribute("transform")
      
      let x = +(element.getAttribute("x") || 0) || 0
      let y = +(element.getAttribute("y") || 0) || 0
      
      // Account for rotation if present
      if (transform && transform.includes("rotate")) {
        // For rotated text (like y-axis label), swap dimensions
        if (transform.includes("-90")) {
          const temp = bbox.width
          bbox.width = bbox.height
          bbox.height = temp
        }
      }
      
      // Check bounds
      const leftEdge = x - bbox.width / 2
      const rightEdge = x + bbox.width / 2
      const topEdge = y - bbox.height
      const bottomEdge = y
      
      if (leftEdge < -margin.left) {
        bounds.exceedsLeft = true
        bounds.leftOverflow = Math.max(bounds.leftOverflow, -margin.left - leftEdge)
      }
      
      if (rightEdge > width + margin.right) {
        bounds.exceedsRight = true
        bounds.rightOverflow = Math.max(bounds.rightOverflow, rightEdge - (width + margin.right))
      }
      
      if (topEdge < -margin.top) {
        bounds.exceedsTop = true
        bounds.topOverflow = Math.max(bounds.topOverflow, -margin.top - topEdge)
      }
      
      if (bottomEdge > height + margin.bottom) {
        bounds.exceedsBottom = true
        bounds.bottomOverflow = Math.max(bounds.bottomOverflow, bottomEdge - (height + margin.bottom))
      }
    })
    
    // Log warnings if bounds are exceeded
    if (bounds.exceedsLeft || bounds.exceedsRight || bounds.exceedsTop || bounds.exceedsBottom) {
      console.warn("Chart elements exceed bounds:", bounds)
    }
    
    return bounds
  }

  /**
   * Redraw axes with existing scales (for zoom/pan)
   */
  static redrawAxesWithScales(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    scales: ChartScales,
    editingChart: ChartComponent
  ): d3.Selection<SVGGElement, unknown, null, undefined> | undefined {
    const xAxisType = editingChart.xAxisType || 'datetime'
    const xAxisTicks = editingChart.xAxisTicks || 5
    const yAxisTicks = editingChart.yAxisTicks || 5
    const xAxisTickPrecision = editingChart.xAxisTickPrecision ?? 2
    const yAxisTickPrecision = editingChart.yAxisTickPrecision ?? 2
    
    // Remove existing axes
    g.selectAll('.x-axis, .y-axis').remove()
    
    // Create X-axis
    let xAxis: d3.Axis<number | Date | { valueOf(): number }>
    
    if (xAxisType === 'datetime') {
      const xDomain = scales.xScale.domain() as [Date, Date]
      // Ensure domain values are Date objects
      const startDate = xDomain[0] instanceof Date ? xDomain[0] : new Date(xDomain[0])
      const endDate = xDomain[1] instanceof Date ? xDomain[1] : new Date(xDomain[1])
      const timeFormat = getTimeFormat(startDate, endDate)
      xAxis = d3.axisBottom(scales.xScale)
        .ticks(xAxisTicks)
        .tickFormat((d) => d3.timeFormat(timeFormat)(d as Date))
    } else if (xAxisType === 'time') {
      xAxis = d3.axisBottom(scales.xScale)
        .ticks(xAxisTicks)
        .tickFormat(d => {
          const minutes = Number(d)
          const hours = Math.floor(minutes / 60)
          const mins = Math.floor(minutes % 60)
          return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
        })
    } else {
      xAxis = d3.axisBottom(scales.xScale)
        .ticks(xAxisTicks)
        .tickFormat(d3.format(`.${xAxisTickPrecision}f`))
    }
    
    // Calculate X-axis position
    const yDomain = scales.yScale.domain() as [number, number]
    const xAxisY = calculateXAxisPosition(yDomain, scales.yScale, height)
    
    // Render X-axis
    const xAxisGroup = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${xAxisY})`)
      .call(xAxis)
    
    // Apply x-axis styling
    xAxisGroup.select('.domain')
      .style('stroke', '#e5e7eb')
      .style('stroke-width', 1)
    xAxisGroup.selectAll('.tick line')
      .style('stroke', '#e5e7eb')
      .style('stroke-width', 1)
    xAxisGroup.selectAll('.tick text')
      .style('fill', '#6b7280')
      .style('font-size', '12px')
    
    // Create Y-axis
    const firstYParam = (editingChart.yAxisParams && editingChart.yAxisParams[0]) || null
    const yAxisFormat = (firstYParam && 'format' in firstYParam && typeof firstYParam.format === 'string' ? firstYParam.format : null) || `.${yAxisTickPrecision}f`
    const yAxis = d3.axisLeft(scales.yScale)
      .ticks(yAxisTicks)
      .tickFormat(d3.format(yAxisFormat))
    
    // Render Y-axis
    const yAxisGroup = g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
    
    // Apply y-axis styling
    yAxisGroup.select('.domain')
      .style('stroke', '#e5e7eb')
      .style('stroke-width', 1)
    yAxisGroup.selectAll('.tick line')
      .style('stroke', '#e5e7eb')
      .style('stroke-width', 1)
    yAxisGroup.selectAll('.tick text')
      .style('fill', '#6b7280')
      .style('font-size', '12px')
    
    // Add grid if enabled
    if (editingChart.showGrid) {
      g.selectAll('.grid').remove()
      
      // X grid lines
      g.insert('g', ':first-child')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis
          .tickSize(-height)
          .tickFormat(() => '')
        )
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
      
      // Y grid lines
      g.insert('g', ':first-child')
        .attr('class', 'grid')
        .call(yAxis
          .tickSize(-width)
          .tickFormat(() => '')
        )
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
    }
    
    // Return the Y-axis group for label positioning
    return yAxisGroup
  }
}