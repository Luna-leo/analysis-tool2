import * as d3 from "d3"
import { ChartComponent, DataSourceStyle, MarkerType, LineStyle } from "@/types"
import { BaseChart, BaseChartConfig } from "./core/BaseChart"
import { MarkerRenderer, MarkerConfig } from "@/utils/chart/markerRenderer"
import { ChartTooltipManager } from "@/utils/chart/chartTooltipManager"
import { showTooltip, updateTooltipPosition, hideTooltip } from "@/utils/chartTooltip"
import { formatXValue } from "@/utils/chartAxisUtils"
import { determineLODLevel, getRenderMethod } from "./LODRenderer"
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
  paramIndex?: number  // Add parameter index for parameter-based styling
}

interface ScatterPlotConfig extends BaseChartConfig {
  data: ScatterDataPoint[]
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
  canvas?: HTMLCanvasElement
  plotStyles?: ChartComponent['plotStyles']
  enableSampling?: boolean
  disableTooltips?: boolean
}

/**
 * ScatterPlot using BaseChart architecture
 * Provides optimized rendering with LOD support
 */
class ScatterPlot extends BaseChart<ScatterDataPoint> {
  private dataSourceStyles: { [dataSourceId: string]: DataSourceStyle }
  private canvas?: HTMLCanvasElement
  private plotStyles: ChartComponent['plotStyles']
  private enableSampling: boolean
  private disableTooltips: boolean

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
    this.enableSampling = config.enableSampling ?? true
    this.disableTooltips = config.disableTooltips ?? false
  }

  /**
   * Override setupScalesAndAxes to handle scatter plot specific logic
   */
  protected setupScalesAndAxes(): void {
    // For scatter plots, we need to handle data transformation before creating scales
    // Transform data based on x-axis type
    const xAxisType = this.editingChart.xAxisType || 'datetime'
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ScatterPlot ${this.editingChart.id}] setupScalesAndAxes called:`, {
        xAxisType,
        dataLength: this.data.length,
        sampleData: this.data.slice(0, 3).map(d => ({
          x: d.x,
          xType: typeof d.x,
          xIsDate: d.x instanceof Date,
          y: d.y,
          series: d.series
        }))
      })
    }
    
    if (this.data.length > 0) {
      if (xAxisType === 'datetime') {
        // Ensure x values are Date objects and timestamp field exists
        this.data = this.data.map(d => {
          const xValue = d.x instanceof Date ? d.x : new Date(d.x as string)
          return {
            ...d,
            x: xValue,
            timestamp: d.timestamp || xValue // Ensure timestamp field exists
          }
        })
      } else if (xAxisType === 'parameter') {
        // For parameter type, x values should already be numbers from useOptimizedChart
        // Filter out any non-numeric values just in case
        this.data = this.data.filter(d => typeof d.x === 'number')
      }
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
    
    // Data is already sampled in useOptimizedChart, no need for additional sampling here
    const dataToRender = this.data
    
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
    const mode = this.plotStyles?.mode || 'datasource'
    
    // Default style with proper color based on mode
    const defaultColor = defaultChartColors[mode === 'parameter' ? paramIndex : dataSourceIndex] || defaultChartColors[0]
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
      },
      legendText: '',
      visible: true
    }

    let style: any
    
    if (mode === 'datasource') {
      style = this.plotStyles?.byDataSource?.[dataSourceId]
    } else if (mode === 'parameter') {
      style = this.plotStyles?.byParameter?.[paramIndex]
    } else {
      const key = `${dataSourceId}-${paramIndex}`
      style = this.plotStyles?.byBoth?.[key]
    }
    
    // Ensure the style has all required properties
    if (!style) {
      return defaultStyle
    }
    
    return {
      marker: {
        ...defaultStyle.marker,
        ...(style.marker || {})
      },
      line: {
        ...defaultStyle.line,
        ...(style.line || {})
      },
      legendText: style.legendText || defaultStyle.legendText,
      visible: style.visible !== undefined ? style.visible : defaultStyle.visible
    }
  }


  /**
   * Render with SVG for interactivity
   */
  private renderWithSVG(data: ScatterDataPoint[]): void {
    // Group data by series for batch rendering
    const seriesGroups = d3.group(data, d => d.dataSourceId)
    
    seriesGroups.forEach((points, seriesId) => {
      const style = this.dataSourceStyles[seriesId] || {}
      
      const markers: MarkerConfig[] = points
        .filter(d => {
          const dsIndex = d.dataSourceIndex || 0
          const paramIndex = d.paramIndex !== undefined ? d.paramIndex : d.seriesIndex
          const plotStyle = this.getPlotStyle(seriesId, dsIndex, paramIndex)
          return plotStyle.visible !== false
        })
        .map(d => {
        const dsIndex = d.dataSourceIndex || 0
        const paramIndex = d.paramIndex !== undefined ? d.paramIndex : d.seriesIndex
        const plotStyle = this.getPlotStyle(seriesId, dsIndex, paramIndex)
        
        // Use plotStyle for marker settings
        const markerType = plotStyle.marker.type
        const markerSize = plotStyle.marker.size
        const fillColor = plotStyle.marker.fillColor
        const borderColor = plotStyle.marker.borderColor
        
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
        container: this.dataGroup,
        markers,
        ...tooltipHandlers
      })
    })
  }

  /**
   * Create tooltip handlers for SVG rendering
   */
  private createTooltipHandlers() {
    // If tooltips are disabled, return empty handlers
    const showTooltip = this.editingChart.showTooltip ?? true
    if (!showTooltip || this.disableTooltips) {
      return {
        onMouseEnter: () => {},
        onMouseMove: () => {},
        onMouseLeave: () => {}
      }
    }
    
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
    this.renderWithSVG(data)
  }

  /**
   * Render as line chart with optional markers
   */
  private renderLineChart(data: ScatterDataPoint[], showMarkers: boolean): void {
    // Group data by dataSource and parameter combination
    const dataByDsAndParam = new Map<string, ScatterDataPoint[]>()
    
    data.forEach(d => {
      // Use paramIndex for grouping when in parameter mode
      const groupIndex = this.plotStyles?.mode === 'parameter' && d.paramIndex !== undefined 
        ? d.paramIndex 
        : d.seriesIndex
      const key = `${d.dataSourceId}-${groupIndex}`
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
      // Use paramIndex from data point if available
      const actualParamIndex = seriesData[0]?.paramIndex !== undefined ? seriesData[0].paramIndex : paramIndex
      
      // Get plot style for this combination
      const plotStyle = this.getPlotStyle(dataSourceId, dataSourceIndex, actualParamIndex)
      
      // Skip if not visible
      if (plotStyle.visible === false) return
      
      // Sort data by x value for proper line rendering
      const sortedData = seriesData.sort((a, b) => {
        if (a.x instanceof Date && b.x instanceof Date) {
          return a.x.getTime() - b.x.getTime()
        }
        return Number(a.x) - Number(b.x)
      })
      
      // Find the corresponding yParam
      const yParam = this.editingChart.yAxisParams?.[actualParamIndex]
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
      this.renderLine(lineData, yParam, plotStyle.line.color)
      
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
    
    this.dataGroup.append("path")
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
    const markers: MarkerConfig[] = data
      .filter(d => d[param.parameter] !== undefined)
      .map(d => ({
        x: this.scales.xScale(d.x as any),
        y: this.scales.yScale(d[param.parameter] as number),
        type: plotStyle.marker.type,
        size: plotStyle.marker.size,
        fillColor: plotStyle.marker.fillColor,
        borderColor: plotStyle.marker.borderColor,
        opacity: 1,
        data: {
          parameter: param.parameter,
          value: d[param.parameter] as number,
          timestamp: d.timestamp || d.x,
          unit: param.unit
        }
      }))
    
      const tooltipHandlers = this.disableTooltips 
        ? {} 
        : ChartTooltipManager.createHandlers({
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
      container: this.dataGroup,
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