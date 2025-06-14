import * as d3 from "d3"
import { BaseChart, BaseChartConfig } from "./core/BaseChart"
import { MarkerRenderer, MarkerConfig } from "@/utils/chart/markerRenderer"
import { ChartTooltipManager } from "@/utils/chart/chartTooltipManager"
import { defaultChartColors } from "@/utils/chartColors"

interface ChartDataItem {
  [key: string]: number | Date | string | undefined
}

interface LineChartConfig extends BaseChartConfig {
  data: ChartDataItem[]
}

/**
 * LineChart using BaseChart architecture
 * Provides clean implementation with reduced duplication
 */
class LineChart extends BaseChart<ChartDataItem> {
  constructor(config: LineChartConfig) {
    super(config)
  }

  /**
   * Override setupScalesAndAxes to handle line chart specific logic
   */
  protected setupScalesAndAxes(): void {
    // Ensure x values are Date objects for datetime axis
    const xParameter = this.editingChart.xParameter || 'timestamp'
    
    if ((this.editingChart.xAxisType || 'datetime') === 'datetime' && this.data.length > 0) {
      this.data = this.data.map(d => {
        // For datetime, always ensure timestamp field exists
        const timestampValue = d.timestamp || d[xParameter]
        const xValue = timestampValue instanceof Date ? timestampValue : new Date(timestampValue as string | number)
        
        return {
          ...d,
          [xParameter]: xValue,
          timestamp: xValue // Ensure timestamp field always exists
        }
      })
    }
    
    // Call parent implementation
    super.setupScalesAndAxes()
  }

  /**
   * Render line chart content
   */
  protected renderContent(): void {
    const yParams = this.editingChart.yAxisParams || []
    
    yParams.forEach((param, index) => {
      // Skip parameters with empty names
      if (!param.parameter || param.parameter.trim() === '') {
        return
      }
      
      const lineColor = param.line?.color || defaultChartColors[index % defaultChartColors.length]
      const showLine = param.line?.width !== undefined && param.line.width > 0
      const showMarker = param.marker !== undefined
      
      // Draw line if enabled
      if (showLine) {
        this.renderLine(param, lineColor)
      }
      
      // Draw markers if enabled
      if (showMarker && param.marker) {
        this.renderMarkers(param, lineColor)
      }
    })
  }

  /**
   * Render line for a parameter
   */
  private renderLine(param: any, lineColor: string): void {
    const xParameter = this.editingChart.xParameter || 'timestamp'
    const line = d3.line<ChartDataItem>()
      .x(d => this.scales.xScale(d[xParameter] as any))
      .y(d => this.scales.yScale(d[param.parameter] as number || 0))
      .curve(d3.curveMonotoneX)
    
    this.g.append("path")
      .datum(this.data)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", param.line?.width || 2)
      .attr("stroke-dasharray", this.getLineDashArray(param.line?.style))
      .attr("d", line)
  }

  /**
   * Render markers for a parameter
   */
  private renderMarkers(param: any, lineColor: string): void {
    const xParameter = this.editingChart.xParameter || 'timestamp'
    const markers: MarkerConfig[] = this.data.map(d => ({
      x: this.scales.xScale(d[xParameter] as any),
      y: this.scales.yScale(d[param.parameter] as number || 0),
      type: param.marker!.type,
      size: param.marker!.size || 6,
      fillColor: param.marker!.fillColor || lineColor,
      borderColor: param.marker!.borderColor || lineColor,
      opacity: 1,
      data: {
        parameter: param.parameter,
        value: d[param.parameter] || 0,
        timestamp: d[xParameter],
        unit: param.unit
      }
    }))
    
    const tooltipHandlers = ChartTooltipManager.createHandlers({
      xAxisType: 'datetime',
      showTimestamp: false,
      showDataSource: false,
      customContent: (data) => ChartTooltipManager.createLineChartTooltip(
        data.parameter!,
        data.y,
        data.x as Date,
        data.unit
      )
    })
    
    MarkerRenderer.render({
      container: this.g,
      markers,
      ...tooltipHandlers
    })
  }

  /**
   * Get line dash array based on style
   */
  private getLineDashArray(style?: string): string {
    switch (style) {
      case "dashed":
        return "5,5"
      case "dotted":
        return "2,2"
      default:
        return "none"
    }
  }
}

/**
 * Factory function to render line chart
 * Maintains backward compatibility with existing code
 */
export const renderLineChart = (props: LineChartConfig) => {
  const chart = new LineChart(props)
  chart.render()
}