import { ChartComponent, MarkerType, LineStyle } from '@/types'
import { 
  PlotStyleTemplate, 
  ApplyTemplateOptions, 
  TemplateApplicationResult,
  ColorTheme,
  MarkerPattern 
} from '@/types/plot-style-template'
import { getDefaultColor } from './chartColors'

// Color theme definitions
const COLOR_THEMES: Record<ColorTheme, string[]> = {
  default: [], // Use existing colors
  blue: ['#0066CC', '#0080FF', '#3399FF', '#66B2FF', '#99CCFF'],
  warm: ['#FF6B6B', '#FFA06B', '#FFD06B', '#FF856B', '#FFB56B'],
  cool: ['#4ECDC4', '#45B7B8', '#5DADE2', '#76D7EA', '#95E1D3'],
  monochrome: ['#212121', '#424242', '#616161', '#757575', '#9E9E9E'],
  custom: [] // User-defined colors
}

const MARKER_CYCLE: MarkerType[] = ['circle', 'square', 'triangle', 'diamond', 'star', 'cross']

export interface TemplateApplicationResultWithChart extends TemplateApplicationResult {
  updatedChart?: ChartComponent
}

export class PlotStyleApplicator {
  static applyTemplate(
    chart: ChartComponent,
    template: PlotStyleTemplate,
    options: Partial<ApplyTemplateOptions> = {}
  ): TemplateApplicationResultWithChart {
    const result: TemplateApplicationResultWithChart = {
      chartId: chart.id,
      applied: false,
      changes: [],
      errors: []
    }

    try {
      const updatedChart = { ...chart }
      
      // Apply display settings
      if (options.applyDisplaySettings !== false) {
        this.applyDisplaySettings(updatedChart, template, result)
      }
      
      // Apply common styles
      if (options.applyCommonStyles !== false) {
        this.applyCommonStyles(updatedChart, template, result)
      }
      
      // Apply optional styles
      if (options.applyOptionalStyles !== false) {
        this.applyOptionalStyles(updatedChart, template, result)
      }
      
      // Apply layout settings
      if (options.applyLayoutSettings !== false) {
        this.applyLayoutSettings(updatedChart, template, result)
      }
      
      result.applied = result.changes.length > 0
      result.updatedChart = updatedChart
      
      return result
    } catch (error: any) {
      result.errors = [`Failed to apply template: ${error.message}`]
      return result
    }
  }

  private static applyDisplaySettings(
    chart: ChartComponent,
    template: PlotStyleTemplate,
    result: TemplateApplicationResult
  ): void {
    const { displaySettings } = template
    
    if (displaySettings.showMarkers !== undefined) {
      chart.showMarkers = displaySettings.showMarkers
      result.changes.push(`Set markers visibility to ${displaySettings.showMarkers}`)
    }
    
    if (displaySettings.showLines !== undefined) {
      chart.showLines = displaySettings.showLines
      result.changes.push(`Set lines visibility to ${displaySettings.showLines}`)
    }
    
    if (displaySettings.showGrid !== undefined) {
      chart.showGrid = displaySettings.showGrid
      result.changes.push(`Set grid visibility to ${displaySettings.showGrid}`)
    }
    
    if (displaySettings.showTitle !== undefined) {
      chart.showTitle = displaySettings.showTitle
      result.changes.push(`Set title visibility to ${displaySettings.showTitle}`)
    }
    
    if (displaySettings.showLegend !== undefined) {
      chart.showLegend = displaySettings.showLegend
      result.changes.push(`Set legend visibility to ${displaySettings.showLegend}`)
    }
    
    if (displaySettings.showXLabel !== undefined) {
      chart.showXLabel = displaySettings.showXLabel
      result.changes.push(`Set X axis label visibility to ${displaySettings.showXLabel}`)
    }
    
    if (displaySettings.showYLabel !== undefined) {
      chart.showYLabel = displaySettings.showYLabel
      result.changes.push(`Set Y axis label visibility to ${displaySettings.showYLabel}`)
    }
  }

  private static applyCommonStyles(
    chart: ChartComponent,
    template: PlotStyleTemplate,
    result: TemplateApplicationResult
  ): void {
    const { commonStyles } = template
    
    // Apply common marker size to all plot styles
    if (commonStyles.markerSize !== undefined && chart.plotStyles) {
      const applyMarkerSize = (styles: Record<string, any>) => {
        Object.values(styles).forEach(style => {
          if (style.marker) {
            style.marker.size = commonStyles.markerSize
          }
        })
      }
      
      if (chart.plotStyles.byDataSource) applyMarkerSize(chart.plotStyles.byDataSource)
      if (chart.plotStyles.byParameter) applyMarkerSize(chart.plotStyles.byParameter)
      if (chart.plotStyles.byBoth) applyMarkerSize(chart.plotStyles.byBoth)
      
      result.changes.push(`Set all marker sizes to ${commonStyles.markerSize}`)
    }
    
    // Apply common line width to all plot styles
    if (commonStyles.lineWidth !== undefined && chart.plotStyles) {
      const applyLineWidth = (styles: Record<string, any>) => {
        Object.values(styles).forEach(style => {
          if (style.line) {
            style.line.width = commonStyles.lineWidth
          }
        })
      }
      
      if (chart.plotStyles.byDataSource) applyLineWidth(chart.plotStyles.byDataSource)
      if (chart.plotStyles.byParameter) applyLineWidth(chart.plotStyles.byParameter)
      if (chart.plotStyles.byBoth) applyLineWidth(chart.plotStyles.byBoth)
      
      result.changes.push(`Set all line widths to ${commonStyles.lineWidth}`)
    }
    
    // Apply common line style to all plot styles
    if (commonStyles.lineStyle !== undefined && chart.plotStyles) {
      const applyLineStyle = (styles: Record<string, any>) => {
        Object.values(styles).forEach(style => {
          if (style.line) {
            style.line.style = commonStyles.lineStyle
          }
        })
      }
      
      if (chart.plotStyles.byDataSource) applyLineStyle(chart.plotStyles.byDataSource)
      if (chart.plotStyles.byParameter) applyLineStyle(chart.plotStyles.byParameter)
      if (chart.plotStyles.byBoth) applyLineStyle(chart.plotStyles.byBoth)
      
      result.changes.push(`Set all line styles to ${commonStyles.lineStyle}`)
    }
    
    // Apply axis tick settings
    if (commonStyles.xAxisTicks !== undefined) {
      chart.xAxisTicks = commonStyles.xAxisTicks
      result.changes.push(`Set X axis ticks to ${commonStyles.xAxisTicks}`)
    }
    
    if (commonStyles.yAxisTicks !== undefined) {
      chart.yAxisTicks = commonStyles.yAxisTicks
      result.changes.push(`Set Y axis ticks to ${commonStyles.yAxisTicks}`)
    }
    
    if (commonStyles.xAxisTickPrecision !== undefined) {
      chart.xAxisTickPrecision = commonStyles.xAxisTickPrecision
      result.changes.push(`Set X axis tick precision to ${commonStyles.xAxisTickPrecision}`)
    }
    
    if (commonStyles.yAxisTickPrecision !== undefined) {
      chart.yAxisTickPrecision = commonStyles.yAxisTickPrecision
      result.changes.push(`Set Y axis tick precision to ${commonStyles.yAxisTickPrecision}`)
    }
  }

  private static applyOptionalStyles(
    chart: ChartComponent,
    template: PlotStyleTemplate,
    result: TemplateApplicationResult
  ): void {
    const { optionalStyles } = template
    
    if (!optionalStyles || !chart.plotStyles) return
    
    // Apply color theme
    if (optionalStyles.colorTheme && optionalStyles.colorTheme !== 'default') {
      const colors = optionalStyles.colorTheme === 'custom' 
        ? optionalStyles.customColors || []
        : COLOR_THEMES[optionalStyles.colorTheme]
      
      if (colors.length > 0) {
        let colorIndex = 0
        
        const applyColors = (styles: Record<string, any>) => {
          Object.values(styles).forEach(style => {
            const color = colors[colorIndex % colors.length]
            if (style.marker) {
              style.marker.borderColor = color
              style.marker.fillColor = color
            }
            if (style.line) {
              style.line.color = color
            }
            colorIndex++
          })
        }
        
        if (chart.plotStyles.byDataSource) applyColors(chart.plotStyles.byDataSource)
        if (chart.plotStyles.byParameter) applyColors(chart.plotStyles.byParameter)
        if (chart.plotStyles.byBoth) applyColors(chart.plotStyles.byBoth)
        
        result.changes.push(`Applied ${optionalStyles.colorTheme} color theme`)
      }
    }
    
    // Apply marker pattern
    if (optionalStyles.markerPattern) {
      if (optionalStyles.markerPattern === 'uniform' && optionalStyles.markerType) {
        // Apply uniform marker type
        const applyMarkerType = (styles: Record<string, any>) => {
          Object.values(styles).forEach(style => {
            if (style.marker) {
              style.marker.type = optionalStyles.markerType
            }
          })
        }
        
        if (chart.plotStyles.byDataSource) applyMarkerType(chart.plotStyles.byDataSource)
        if (chart.plotStyles.byParameter) applyMarkerType(chart.plotStyles.byParameter)
        if (chart.plotStyles.byBoth) applyMarkerType(chart.plotStyles.byBoth)
        
        result.changes.push(`Set all markers to ${optionalStyles.markerType}`)
        
      } else if (optionalStyles.markerPattern === 'cycle') {
        // Apply cycling marker pattern
        let markerIndex = 0
        
        const applyMarkerCycle = (styles: Record<string, any>) => {
          Object.values(styles).forEach(style => {
            if (style.marker) {
              style.marker.type = MARKER_CYCLE[markerIndex % MARKER_CYCLE.length]
              markerIndex++
            }
          })
        }
        
        if (chart.plotStyles.byDataSource) applyMarkerCycle(chart.plotStyles.byDataSource)
        if (chart.plotStyles.byParameter) applyMarkerCycle(chart.plotStyles.byParameter)
        if (chart.plotStyles.byBoth) applyMarkerCycle(chart.plotStyles.byBoth)
        
        result.changes.push('Applied cycling marker pattern')
      }
      // 'preserve' pattern means no changes to marker types
    }
  }

  private static applyLayoutSettings(
    chart: ChartComponent,
    template: PlotStyleTemplate,
    result: TemplateApplicationResult
  ): void {
    const { layoutSettings } = template
    
    if (!layoutSettings) return
    
    if (layoutSettings.legendPosition) {
      chart.legendPosition = { ...layoutSettings.legendPosition }
      result.changes.push('Updated legend position')
    }
    
    if (layoutSettings.margins) {
      chart.margins = { ...layoutSettings.margins }
      result.changes.push('Updated chart margins')
    }
  }
}