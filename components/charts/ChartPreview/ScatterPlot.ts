import * as d3 from "d3"
import { ChartComponent, DataSourceStyle } from "@/types"
import { BaseChart, BaseChartConfig } from "./core/BaseChart"
import { MarkerRenderer, MarkerConfig } from "@/utils/chart/markerRenderer"
import { ChartTooltipManager } from "@/utils/chart/chartTooltipManager"
import { showTooltip, updateTooltipPosition, hideTooltip } from "@/utils/chartTooltip"
import { formatXValue } from "@/utils/chartAxisUtils"
import { determineLODLevel, simplifyData, getRenderMethod } from "./LODRenderer"
import { renderWithOptimizedCanvas } from "./OptimizedCanvasRenderer"
import { performanceTracker } from "@/utils/performanceTracking"
import { defaultChartColors } from "@/utils/chartColors"

interface ScatterDataPoint {
  x: number | string | Date
  y: number
  series: string
  seriesIndex: number
  timestamp: string | Date
  dataSourceId: string
  dataSourceLabel: string
  dataSourceIndex?: number
}

interface ScatterPlotConfig extends BaseChartConfig {
  data: ScatterDataPoint[]
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
  canvas?: HTMLCanvasElement
}

/**
 * ScatterPlot using BaseChart architecture
 * Provides optimized rendering with LOD support
 */
class ScatterPlot extends BaseChart<ScatterDataPoint> {
  private dataSourceStyles: { [dataSourceId: string]: DataSourceStyle }
  private canvas?: HTMLCanvasElement

  constructor(config: ScatterPlotConfig) {
    super(config)
    this.dataSourceStyles = config.dataSourceStyles || {}
    this.canvas = config.canvas
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
    
    // Apply LOD simplification if needed
    let dataToRender = this.data
    if (lodConfig.level !== 'high') {
      dataToRender = simplifyData(this.data, lodConfig)
    }
    
    // Render based on chart type
    if (this.editingChart.type === 'line') {
      this.renderLineChart(dataToRender)
    } else {
      // Get all unique series/data sources
      const uniqueSeries = Array.from(new Set(this.data.map(d => d.dataSourceId)))
      const seriesColorMap = this.createSeriesColorMap(uniqueSeries)

      if (renderMethod === 'canvas' && this.canvas) {
        renderWithOptimizedCanvas({
          canvas: this.canvas,
          data: dataToRender,
          width: this.width,
          height: this.height,
          margin: this.getMargins(),
          xScale: this.scales.xScale,
          yScale: this.scales.yScale,
          editingChart: this.editingChart,
          colorScale: (series) => seriesColorMap.get(series) || '#000',
          dataSourceStyles: this.dataSourceStyles
        })
      } else {
        this.renderWithSVG(dataToRender, seriesColorMap)
      }
    }
    
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

  /**
   * Render line chart with markers
   */
  private renderLineChart(data: ScatterDataPoint[]): void {
    const yParams = this.editingChart.yAxisParams || []
    
    // Transform scatter data to line chart format
    const dataByX = new Map<string, any>()
    
    data.forEach(point => {
      const xKey = String(point.x)
      if (!dataByX.has(xKey)) {
        // Ensure we have the correct timestamp
        const timestampValue = point.timestamp ? 
          (typeof point.timestamp === 'string' ? new Date(point.timestamp) : point.timestamp) : 
          point.x
        dataByX.set(xKey, {
          x: point.x,
          timestamp: timestampValue
        })
      }
      
      // Extract parameter name from series
      const paramName = point.series.split(' - ').pop()
      if (paramName) {
        dataByX.get(xKey)[paramName] = point.y
      }
    })
    
    // Convert to array and sort
    const lineData = Array.from(dataByX.values()).sort((a, b) => {
      const aVal = a.x
      const bVal = b.x
      if (aVal instanceof Date && bVal instanceof Date) {
        return aVal.getTime() - bVal.getTime()
      }
      return Number(aVal) - Number(bVal)
    })
    
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
        this.renderLine(lineData, param, lineColor)
      }
      
      // Draw markers if enabled
      if (showMarker && param.marker) {
        this.renderMarkers(lineData, param, lineColor)
      }
    })
  }

  /**
   * Render line for a parameter
   */
  private renderLine(data: any[], param: any, lineColor: string): void {
    const line = d3.line<any>()
      .x(d => this.scales.xScale(d.x as any))
      .y(d => this.scales.yScale(d[param.parameter] as number || 0))
      .curve(d3.curveMonotoneX)
    
    this.g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", param.line?.width || 2)
      .attr("stroke-dasharray", this.getLineDashArray(param.line?.style))
      .attr("d", line)
  }

  /**
   * Render markers for a parameter
   */
  private renderMarkers(data: any[], param: any, lineColor: string): void {
    const markers: MarkerConfig[] = data.map(d => ({
      x: this.scales.xScale(d.x as any),
      y: this.scales.yScale(d[param.parameter] as number || 0),
      type: param.marker!.type,
      size: param.marker!.size || 6,
      fillColor: param.marker!.fillColor || lineColor,
      borderColor: param.marker!.borderColor || lineColor,
      opacity: 1,
      data: {
        parameter: param.parameter,
        value: d[param.parameter] || 0,
        timestamp: d.timestamp || d.x,
        unit: param.unit
      }
    }))
    
      const tooltipHandlers = ChartTooltipManager.createHandlers({
        xAxisType: this.editingChart.xAxisType || 'datetime',
        showTimestamp: false,
        showDataSource: false,
        customContent: (d: any) => ChartTooltipManager.createLineChartTooltip(
          d.parameter!,
          d.value,
          d.timestamp as Date,
          d.unit
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
 * Factory function to render scatter plot
 * Maintains backward compatibility with existing code
 */
export const renderScatterPlot = (props: ScatterPlotConfig) => {
  const chart = new ScatterPlot(props)
  chart.render()
}