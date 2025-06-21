import * as d3 from "d3"
import { ChartComponent } from "@/types"
import { AxisManager, ChartScales } from "@/utils/chart/axisManager"

export interface BaseChartConfig {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  data: any[]
  width: number
  height: number
  editingChart: ChartComponent
  scalesRef: React.MutableRefObject<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
    yScale: d3.ScaleLinear<number, number> | null
    isEmptyScale?: boolean
  }>
  labelPositions?: {
    title?: { x: number; y: number }
    xLabel?: { x: number; y: number }
    yLabel?: { x: number; y: number }
  }
}

/**
 * Abstract base class for chart rendering
 * Provides common functionality for all chart types
 */
export abstract class BaseChart<TData = any> {
  protected g: d3.Selection<SVGGElement, unknown, null, undefined>
  protected data: TData[]
  protected width: number
  protected height: number
  protected editingChart: ChartComponent
  protected scalesRef: React.MutableRefObject<{
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
    yScale: d3.ScaleLinear<number, number> | null
    isEmptyScale?: boolean
  }>
  protected scales!: ChartScales
  protected dataGroup!: d3.Selection<SVGGElement, unknown, null, undefined>
  protected clipId: string
  protected axisManager?: AxisManager
  protected yAxisGroup?: d3.Selection<SVGGElement, unknown, null, undefined>
  protected labelPositions?: BaseChartConfig['labelPositions']

  constructor(config: BaseChartConfig) {
    this.g = config.g
    this.data = config.data
    this.width = config.width
    this.height = config.height
    this.editingChart = config.editingChart
    this.scalesRef = config.scalesRef
    this.clipId = `chart-data-clip-${Math.random().toString(36).substr(2, 9)}`
    this.labelPositions = config.labelPositions
  }

  /**
   * Main render method - template method pattern
   */
  render(): void {
    // Clear previous content
    this.clearContent()
    
    // Create clip path for data area
    this.createClipPath()
    
    // Setup scales and axes
    this.setupScalesAndAxes()
    
    // Create data group with clipping
    this.dataGroup = this.g.append("g")
      .attr("class", "data-group")
      .attr("clip-path", `url(#${this.clipId})`)
    
    // Render the chart-specific content
    this.renderContent()
    
    // Add common elements
    this.addCommonElements()
    
    // Store scales for reference
    this.updateScalesRef()
  }

  /**
   * Clear previous chart content
   */
  protected clearContent(): void {
    this.g.selectAll("*").remove()
  }
  
  /**
   * Create clip path for data area
   */
  protected createClipPath(): void {
    // Increased padding to ensure axis lines and edge markers are visible
    const clipPadding = 5
    
    // Create clip path within the g element for proper coordinate system
    this.g.append("clipPath")
      .attr("id", this.clipId)
      .append("rect")
      .attr("x", -clipPadding)
      .attr("y", -clipPadding)
      .attr("width", this.width + 2 * clipPadding)
      .attr("height", this.height + 2 * clipPadding)
  }

  /**
   * Setup scales and axes using AxisManager
   */
  protected setupScalesAndAxes(): void {
    // Check if we already have scales (from zoom)
    if (this.scalesRef.current.xScale && this.scalesRef.current.yScale) {
      // Update scale ranges to match new dimensions
      this.updateScaleRanges()
      
      // Use existing (zoomed) scales with updated ranges
      this.scales = {
        xScale: this.scalesRef.current.xScale,
        yScale: this.scalesRef.current.yScale
      }
      
      // Redraw axes with existing scales
      this.yAxisGroup = AxisManager.redrawAxesWithScales(
        this.g,
        this.width,
        this.height,
        this.scales,
        this.editingChart
      )
    } else {
      // Create new scales (initial render)
      this.axisManager = new AxisManager({
        g: this.g,
        width: this.width,
        height: this.height,
        editingChart: this.editingChart,
        data: this.data
      })
      
      this.scales = this.axisManager.createAxes()
    }
  }

  /**
   * Add common elements like labels and borders
   */
  protected addCommonElements(): void {
    // Add chart title
    AxisManager.addChartTitle(this.g, this.width, this.editingChart, this.labelPositions?.title)
    
    // Get Y-axis group from the axis manager or from stored reference
    const yAxisGroup = this.axisManager?.getYAxisGroup() || this.yAxisGroup
    
    // Add axis labels with Y-axis group for dynamic positioning
    AxisManager.addAxisLabels(this.g, this.width, this.height, this.editingChart, yAxisGroup, {
      xLabel: this.labelPositions?.xLabel,
      yLabel: this.labelPositions?.yLabel
    })
    
    // Add chart border at the correct position (accounting for margins)
    this.addChartBorder()
  }

  /**
   * Update scales reference for external use
   */
  protected updateScalesRef(): void {
    this.scalesRef.current = {
      xScale: this.scales.xScale,
      yScale: this.scales.yScale
    }
  }

  /**
   * Abstract method to be implemented by specific chart types
   */
  protected abstract renderContent(): void

  /**
   * Get the current scales
   */
  getScales(): ChartScales {
    return this.scales
  }

  /**
   * Helper method to check if data is empty
   */
  protected hasData(): boolean {
    return this.data && this.data.length > 0
  }

  /**
   * Helper method to get margin configuration
   */
  protected getMargins() {
    return this.editingChart.margins || {
      top: 20,
      right: 40,
      bottom: 60,
      left: 60
    }
  }
  
  /**
   * Update scale ranges when dimensions change
   */
  protected updateScaleRanges(): void {
    if (!this.scalesRef.current.xScale || !this.scalesRef.current.yScale) return
    
    // Update X scale range
    const xScale = this.scalesRef.current.xScale
    if ('range' in xScale && typeof xScale.range === 'function') {
      xScale.range([0, this.width])
    }
    
    // Update Y scale range
    const yScale = this.scalesRef.current.yScale
    if ('range' in yScale && typeof yScale.range === 'function') {
      yScale.range([this.height, 0])
    }
    
    // Log the update in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[BaseChart] Updated scale ranges for new dimensions:`, {
        width: this.width,
        height: this.height
      })
    }
  }
  
  /**
   * Add chart border with proper positioning
   */
  protected addChartBorder(): void {
    // Simply draw the border within the current group (this.g)
    // The group is already transformed with margins, so we just need to draw at (0,0)
    this.g.append("rect")
      .attr("class", "chart-border")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("fill", "none")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1)
  }
}