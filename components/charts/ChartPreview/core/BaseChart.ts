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
  }>
  protected scales!: ChartScales

  constructor(config: BaseChartConfig) {
    this.g = config.g
    this.data = config.data
    this.width = config.width
    this.height = config.height
    this.editingChart = config.editingChart
    this.scalesRef = config.scalesRef
  }

  /**
   * Main render method - template method pattern
   */
  render(): void {
    // Clear previous content
    this.clearContent()
    
    // Setup scales and axes
    this.setupScalesAndAxes()
    
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
   * Setup scales and axes using AxisManager
   */
  protected setupScalesAndAxes(): void {
    const axisManager = new AxisManager({
      g: this.g,
      width: this.width,
      height: this.height,
      editingChart: this.editingChart,
      data: this.data
    })
    
    this.scales = axisManager.createAxes()
  }

  /**
   * Add common elements like labels and borders
   */
  protected addCommonElements(): void {
    // Add chart title
    AxisManager.addChartTitle(this.g, this.width, this.editingChart)
    
    // Add axis labels
    AxisManager.addAxisLabels(this.g, this.width, this.height, this.editingChart)
    
    // Add chart border
    AxisManager.addChartBorder(this.g, this.width, this.height)
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
}