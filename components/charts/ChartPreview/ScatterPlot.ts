import * as d3 from "d3"
import { ChartComponent, DataSourceStyle, MarkerType, LineStyle } from "@/types"
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
  plotStyles?: ChartComponent['plotStyles']
}

/**
 * ScatterPlot using BaseChart architecture
 * Provides optimized rendering with LOD support
 */
class ScatterPlot extends BaseChart<ScatterDataPoint> {
  private dataSourceStyles: { [dataSourceId: string]: DataSourceStyle }
  private canvas?: HTMLCanvasElement
  private plotStyles: ChartComponent['plotStyles']

  constructor(config: ScatterPlotConfig) {
    super(config)
    this.dataSourceStyles = config.dataSourceStyles || {}
    this.canvas = config.canvas
    this.plotStyles = config.plotStyles || {
      mode: 'datasource',
      byDataSource: {},
      byParameter: {},
      byBoth: {}
    }
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
    
    // Render based on display options
    const showLines = this.editingChart.showLines ?? (this.editingChart.type === 'line')
    const showMarkers = this.editingChart.showMarkers ?? true
    
    // Always render using the unified method
    this.renderChart(dataToRender, showLines, showMarkers)
    
    // End performance tracking
    performanceTracker.measure('scatter-plot-render', 'scatter-plot-render-start', undefined, {
      dataPoints: this.data.length,
      lodLevel: lodConfig.level,
      renderMethod: renderMethod
    })
  }

  /**
   * Get plot style for a specific data point
   */
  private getPlotStyle(dataSourceId: string, dataSourceIndex: number, paramIndex: number) {
    const mode = this.plotStyles.mode
    
    // Default style
    const defaultColor = defaultChartColors[mode === 'parameter' ? paramIndex : dataSourceIndex]
    const defaultStyle = {
      marker: {
        type: 'circle' as MarkerType,
        size: 6,
        borderColor: defaultColor,
        fillColor: defaultColor
      },
      line: {
        style: 'solid' as LineStyle,
        width: 2,
        color: defaultColor
      }
    }

    if (mode === 'datasource') {
      return this.plotStyles.byDataSource?.[dataSourceId] || defaultStyle
    } else if (mode === 'parameter') {
      return this.plotStyles.byParameter?.[paramIndex] || defaultStyle
    } else {
      const key = `${dataSourceId}-${paramIndex}`
      return this.plotStyles.byBoth?.[key] || defaultStyle
    }
  }


  /**
   * Render with SVG for interactivity
   */
  private renderWithSVG(data: ScatterDataPoint[], seriesColorMap: Map<string, string>): void {
    // Group data by series for batch rendering
    const seriesGroups = d3.group(data, d => d.dataSourceId)
    
    seriesGroups.forEach((points, seriesId) => {
      const style = this.dataSourceStyles[seriesId] || {}
      
      const markers: MarkerConfig[] = points.map(d => {
        const dsIndex = d.dataSourceIndex || 0
        const paramIndex = d.seriesIndex
        const plotStyle = this.getPlotStyle(seriesId, dsIndex, paramIndex)
        
        // Use plotStyle for marker settings, fallback to dataSourceStyles
        const markerType = plotStyle?.marker?.type || style.markerShape || 'circle'
        const markerSize = plotStyle?.marker?.size || style.markerSize || 6
        const fillColor = plotStyle?.marker?.fillColor || style.markerColor || defaultChartColors[dsIndex % defaultChartColors.length]
        const borderColor = plotStyle?.marker?.borderColor || style.markerColor || defaultChartColors[dsIndex % defaultChartColors.length]
        
        return {
          x: this.scales.xScale(d.x as any),
          y: this.scales.yScale(d.y),
          type: markerType,
          size: markerSize,
          fillColor,
          borderColor,
          opacity: style.markerOpacity || 0.8,
          data: d
        }
      })
      
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
   * Render chart with lines and/or markers based on display options
   */
  private renderChart(data: ScatterDataPoint[], showLines: boolean, showMarkers: boolean): void {
    // If only showing markers (scatter plot mode), use scatter rendering
    if (showMarkers && !showLines) {
      this.renderScatterPlot(data)
    } else if (showLines) {
      // Use line chart rendering (with optional markers)
      this.renderLineChart(data, showMarkers)
    }
  }

  /**
   * Render as scatter plot (markers only)
   */
  private renderScatterPlot(data: ScatterDataPoint[]): void {
    // Render with SVG for interactivity
    this.renderWithSVG(data, new Map())
  }

  /**
   * Render as line chart with optional markers
   */
  private renderLineChart(data: ScatterDataPoint[], showMarkers: boolean): void {
    // Group data by dataSource and parameter combination
    const dataByDsAndParam = new Map<string, ScatterDataPoint[]>()
    
    data.forEach(d => {
      const key = `${d.dataSourceId}-${d.seriesIndex}`
      if (!dataByDsAndParam.has(key)) {
        dataByDsAndParam.set(key, [])
      }
      dataByDsAndParam.get(key)!.push(d)
    })
    
    // Render each series as a separate line
    dataByDsAndParam.forEach((seriesData, key) => {
      const [dataSourceId, paramIndexStr] = key.split('-')
      const paramIndex = parseInt(paramIndexStr)
      const dataSourceIndex = seriesData[0]?.dataSourceIndex || 0
      
      // Sort data by x value for proper line rendering
      const sortedData = seriesData.sort((a, b) => {
        if (a.x instanceof Date && b.x instanceof Date) {
          return a.x.getTime() - b.x.getTime()
        }
        return Number(a.x) - Number(b.x)
      })
      
      // Get plot style for this combination
      const plotStyle = this.getPlotStyle(dataSourceId, dataSourceIndex, paramIndex)
      
      // Find the corresponding yParam
      const yParam = this.editingChart.yAxisParams?.[paramIndex]
      if (!yParam) return
      
      // Create line data
      const lineData = sortedData.map(d => ({
        x: d.x,
        y: d.y,
        timestamp: d.timestamp,
        dataSourceId: d.dataSourceId,
        dataSourceIndex: d.dataSourceIndex,
        seriesIndex: d.seriesIndex,
        [yParam.parameter]: d.y
      }))
      
      // Render line with plot style
      this.renderLine(lineData, yParam, plotStyle?.line?.color || defaultChartColors[paramIndex % defaultChartColors.length])
      
      // Render markers if requested
      if (showMarkers) {
        this.renderMarkersWithStyle(lineData, yParam, plotStyle)
      }
    })
  }


  /**
   * Render line for a parameter
   */
  private renderLine(data: any[], param: any, lineColor: string): void {
    const line = d3.line<any>()
      .defined(d => d[param.parameter] !== undefined)
      .x(d => this.scales.xScale(d.x as any))
      .y(d => this.scales.yScale(d[param.parameter] as number))
      .curve(d3.curveMonotoneX)
    
    this.g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", param?.line?.width || 2)
      .attr("stroke-dasharray", this.getLineDashArray(param?.line?.style))
      .attr("d", line)
  }

  /**
   * Render markers with plot style
   */
  private renderMarkersWithStyle(data: any[], param: any, plotStyle: any): void {
    const paramIndex = data[0]?.seriesIndex || 0
    const defaultColor = defaultChartColors[paramIndex % defaultChartColors.length]
    
    const markers: MarkerConfig[] = data
      .filter(d => d[param.parameter] !== undefined)
      .map(d => ({
        x: this.scales.xScale(d.x as any),
        y: this.scales.yScale(d[param.parameter] as number),
        type: plotStyle?.marker?.type || 'circle',
        size: plotStyle?.marker?.size || 6,
        fillColor: plotStyle?.marker?.fillColor || defaultColor,
        borderColor: plotStyle?.marker?.borderColor || defaultColor,
        opacity: 1,
        data: {
          parameter: param.parameter,
          value: d[param.parameter] as number,
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