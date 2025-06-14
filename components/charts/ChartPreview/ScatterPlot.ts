import * as d3 from "d3"
import { ChartComponent, DataSourceStyle } from "@/types"
import { BaseChart, BaseChartConfig } from "./core/BaseChart"
import { MarkerRenderer, MarkerConfig } from "@/utils/chart/markerRenderer"
import { ChartTooltipManager } from "@/utils/chart/chartTooltipManager"
import { showTooltip, updateTooltipPosition, hideTooltip } from "@/utils/chartTooltip"
import { formatXValue } from "@/utils/chartAxisUtils"
import { determineLODLevel, simplifyData, getRenderMethod } from "./LODRenderer"
import { performanceTracker } from "@/utils/performanceTracking"
import { defaultChartColors } from "@/utils/chartColors"

interface ScatterDataPoint {
  x: number | string | Date
  y: number
  series: string
  seriesIndex: number
  timestamp: string
  dataSourceId: string
  dataSourceLabel: string
  dataSourceIndex?: number
}

interface ScatterPlotConfig extends BaseChartConfig {
  data: ScatterDataPoint[]
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
}

/**
 * ScatterPlot using BaseChart architecture
 * Provides optimized rendering with LOD support
 */
class ScatterPlot extends BaseChart<ScatterDataPoint> {
  private dataSourceStyles: { [dataSourceId: string]: DataSourceStyle }

  constructor(config: ScatterPlotConfig) {
    super(config)
    this.dataSourceStyles = config.dataSourceStyles || {}
  }

  /**
   * Override setupScalesAndAxes to handle scatter plot specific logic
   */
  protected setupScalesAndAxes(): void {
    // For scatter plots, we need to handle data transformation before creating scales
    // Transform data based on x-axis type
    if ((this.editingChart.xAxisType || 'datetime') === 'datetime' && this.data.length > 0) {
      // Ensure x values are Date objects and timestamp field exists
      this.data = this.data.map(d => {
        const xValue = d.x instanceof Date ? d.x : new Date(d.x as string)
        return {
          ...d,
          x: xValue,
          timestamp: d.timestamp || xValue // Ensure timestamp field exists
        }
      })
    }
    
    // Call parent implementation
    super.setupScalesAndAxes()
  }

  /**
   * Render scatter plot content
   */
  protected renderContent(): void {
    performanceTracker.mark('scatter-plot-render-start')
    
    if (this.data.length === 0) {
      return
    }
    
    // Determine LOD level and render method
    const viewportSize = { width: this.width, height: this.height }
    const lodConfig = determineLODLevel(this.data.length, 1, viewportSize)
    const renderMethod = getRenderMethod(this.data.length, viewportSize)
    
    // Add event listener to close tooltips on wheel/drag
    const svg = this.g.node()?.ownerSVGElement
    if (svg) {
      d3.select(svg).on("wheel.tooltip", () => {
        ChartTooltipManager.cleanup()
      })
    }
    
    // Get all unique series/data sources
    const uniqueSeries = Array.from(new Set(this.data.map(d => d.dataSourceId)))
    const seriesColorMap = this.createSeriesColorMap(uniqueSeries)
    
    // Apply LOD simplification if needed
    let dataToRender = this.data
    if (lodConfig.level !== 'high') {
      dataToRender = simplifyData(this.data, lodConfig)
    }
    
    // Always use SVG rendering for now
    // TODO: Implement proper canvas rendering with BaseChart architecture
    this.renderWithSVG(dataToRender, seriesColorMap)
    
    // End performance tracking
    performanceTracker.measure('scatter-plot-render', 'scatter-plot-render-start', undefined, {
      dataPoints: this.data.length,
      lodLevel: lodConfig.level,
      renderMethod: renderMethod
    })
  }

  /**
   * Create color map for series
   */
  private createSeriesColorMap(uniqueSeries: string[]): Map<string, string> {
    const colorMap = new Map<string, string>()
    
    uniqueSeries.forEach((seriesId, index) => {
      const style = this.dataSourceStyles[seriesId]
      const color = style?.markerColor || defaultChartColors[index % defaultChartColors.length]
      colorMap.set(seriesId, color)
    })
    
    return colorMap
  }


  /**
   * Render with SVG for interactivity
   */
  private renderWithSVG(data: ScatterDataPoint[], seriesColorMap: Map<string, string>): void {
    // Group data by series for batch rendering
    const seriesGroups = d3.group(data, d => d.dataSourceId)
    
    seriesGroups.forEach((points, seriesId) => {
      const style = this.dataSourceStyles[seriesId] || {}
      const color = seriesColorMap.get(seriesId) || '#000'
      
      const markers: MarkerConfig[] = points.map(d => ({
        x: this.scales.xScale(d.x as any),
        y: this.scales.yScale(d.y),
        type: style.markerShape || 'circle',
        size: style.markerSize || 6,
        fillColor: color,
        borderColor: color,
        opacity: style.markerOpacity || 0.8,
        data: d
      }))
      
      const tooltipHandlers = this.createTooltipHandlers()
      
      MarkerRenderer.render({
        container: this.g,
        markers,
        ...tooltipHandlers
      })
    })
  }

  /**
   * Create tooltip handlers for SVG rendering
   */
  private createTooltipHandlers() {
    return ChartTooltipManager.createHandlers({
      xAxisType: this.editingChart.xAxisType || 'datetime',
      showTimestamp: true,
      showDataSource: true,
      customContent: (data: any) => {
        const point = data as ScatterDataPoint
        return ChartTooltipManager.createScatterPlotTooltip(
          point,
          this.editingChart.xAxisType || 'datetime'
        )
      }
    })
  }

}

/**
 * Factory function to render scatter plot
 * Maintains backward compatibility with existing code
 */
export const renderScatterPlot = (props: ScatterPlotConfig) => {
  const chart = new ScatterPlot(props)
  chart.render()
}