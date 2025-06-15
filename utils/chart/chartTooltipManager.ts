import { AxisType } from "@/types"
import { formatXValue } from "@/utils/chartAxisUtils"
import { showTooltip, updateTooltipPosition, hideTooltip } from "@/utils/chartTooltip"

export interface TooltipData {
  series?: string
  x: number | Date | string
  y: number
  timestamp?: string | Date
  dataSourceLabel?: string
  parameter?: string
  unit?: string
}

export interface TooltipConfig {
  xAxisType?: AxisType
  formatX?: (value: any) => string
  formatY?: (value: number) => string
  showTimestamp?: boolean
  showDataSource?: boolean
  customContent?: (data: TooltipData) => string
}

/**
 * Unified tooltip manager for chart interactions
 * Provides consistent tooltip behavior across all chart types
 */
export class ChartTooltipManager {
  private static defaultConfig: TooltipConfig = {
    xAxisType: 'parameter',
    formatY: (value: number) => value.toFixed(3),
    showTimestamp: true,
    showDataSource: true
  }
  
  private static hideTimeout: NodeJS.Timeout | null = null

  /**
   * Create tooltip event handlers for chart elements
   */
  static createHandlers(config?: TooltipConfig) {
    const mergedConfig = { ...this.defaultConfig, ...config }
    
    return {
      onMouseOver: (event: MouseEvent, data: TooltipData) => {
        // Clear any pending hide timeout
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout)
          this.hideTimeout = null
        }
        
        const content = this.generateTooltipContent(data, mergedConfig)
        showTooltip(event, content)
      },
      onMouseMove: (event: MouseEvent) => {
        updateTooltipPosition(event)
      },
      onMouseOut: (event: MouseEvent) => {
        // If moving to another marker within the chart, skip hiding
        const related = event.relatedTarget as HTMLElement | null
        if (related && related.closest(".markers")) {
          return
        }

        // Add a longer delay before hiding to prevent flickering
        this.hideTimeout = setTimeout(() => {
          hideTooltip()
          this.hideTimeout = null
        }, 200) // 200ms delay for better stability
      }
    }
  }

  /**
   * Generate tooltip content based on data and configuration
   */
  static generateTooltipContent(data: TooltipData, config: TooltipConfig): string {
    if (config.customContent) {
      return config.customContent(data)
    }

    const parts: string[] = []
    
    // Series/Parameter name
    if (data.series) {
      parts.push(`<div><strong>${data.series}</strong></div>`)
    } else if (data.parameter) {
      parts.push(`<div><strong>${data.parameter}</strong></div>`)
    }
    
    // X value
    const xDisplay = config.formatX 
      ? config.formatX(data.x)
      : formatXValue(data.x, config.xAxisType || 'parameter')
    parts.push(`<div>X: ${xDisplay}</div>`)
    
    // Y value with optional unit
    const formatY = config.formatY || this.defaultConfig.formatY!
    const yDisplay = formatY(data.y)
    const yLabel = data.unit ? `Y: ${yDisplay} ${data.unit}` : `Y: ${yDisplay}`
    parts.push(`<div>${yLabel}</div>`)
    
    // Timestamp
    if (config.showTimestamp && data.timestamp) {
      const timeStr = data.timestamp instanceof Date 
        ? data.timestamp.toLocaleString()
        : new Date(data.timestamp).toLocaleString()
      parts.push(`<div>Time: ${timeStr}</div>`)
    }
    
    // Data source
    if (config.showDataSource && data.dataSourceLabel) {
      parts.push(`<div>Source: ${data.dataSourceLabel}</div>`)
    }
    
    return parts.join('')
  }

  /**
   * Create a simplified tooltip for line charts
   */
  static createLineChartTooltip(
    parameter: string,
    value: number,
    timestamp: Date | number,
    unit?: string
  ): string {
    return this.generateTooltipContent(
      {
        parameter,
        x: timestamp,
        y: value,
        unit
      },
      {
        xAxisType: 'datetime',
        showTimestamp: false,
        showDataSource: false
      }
    )
  }

  /**
   * Create a detailed tooltip for scatter plots
   */
  static createScatterPlotTooltip(
    data: TooltipData,
    xAxisType: AxisType = 'parameter'
  ): string {
    return this.generateTooltipContent(data, { 
      xAxisType,
      formatY: this.defaultConfig.formatY,
      showTimestamp: this.defaultConfig.showTimestamp,
      showDataSource: this.defaultConfig.showDataSource
    })
  }

  /**
   * Batch create tooltip handlers for multiple series
   */
  static createBatchHandlers<T extends TooltipData>(
    dataPoints: T[],
    config?: TooltipConfig
  ) {
    return dataPoints.map(point => ({
      data: point,
      handlers: this.createHandlers(config)
    }))
  }

  /**
   * Clean up all tooltips
   */
  static cleanup() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
      this.hideTimeout = null
    }
    hideTooltip()
  }
}