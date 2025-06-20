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

  constructor(config: BaseChartConfig) {
    this.g = config.g
    this.data = config.data
    this.width = config.width
    this.height = config.height
    this.editingChart = config.editingChart
    this.scalesRef = config.scalesRef
    this.clipId = `chart-data-clip-${Math.random().toString(36).substr(2, 9)}`
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
      // Use existing (zoomed) scales
      this.scales = {
        xScale: this.scalesRef.current.xScale,
        yScale: this.scalesRef.current.yScale
      }
      
      // Redraw axes with existing scales
      AxisManager.redrawAxesWithScales(
        this.g,
        this.width,
        this.height,
        this.scales,
        this.editingChart
      )
    } else {
      // Create new scales (initial render)
      const axisManager = new AxisManager({
        g: this.g,
        width: this.width,
        height: this.height,
        editingChart: this.editingChart,
        data: this.data
      })
      
      this.scales = axisManager.createAxes()
    }
  }

  /**
   * Add common elements like labels and borders
   */
  protected addCommonElements(): void {
    // Add chart title
    AxisManager.addChartTitle(this.g, this.width, this.editingChart)
    
    // Add axis labels
    AxisManager.addAxisLabels(this.g, this.width, this.height, this.editingChart)
    
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
   * Add chart border with proper positioning
   */
  protected addChartBorder(): void {
    // Get the parent SVG element
    const svg = this.g.node()?.ownerSVGElement
    if (!svg) return
    
    const svgSelection = d3.select(svg)
    const margins = this.getMargins()
    
    // Create a border group at the SVG level (not inside mainGroup)
    // First remove any existing border to avoid duplicates
    svgSelection.select(".chart-border-group").remove()
    
    const borderGroup = svgSelection.append("g")
      .attr("class", "chart-border-group")
      .attr("transform", `translate(${margins.left},${margins.top})`)
    
    // Draw the border at the correct position
    borderGroup.append("rect")
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