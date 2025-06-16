import { MarkerType, LineStyle } from './index'

export type ApplyStrategy = 'pattern' | 'matching' | 'rule'

export type ColorTheme = 'default' | 'blue' | 'warm' | 'cool' | 'monochrome' | 'custom'

export type MarkerPattern = 'uniform' | 'cycle' | 'preserve'

export interface PlotStyleTemplate {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  
  // Display settings (always applied)
  displaySettings: {
    showMarkers?: boolean
    showLines?: boolean
    showGrid?: boolean
    showTitle?: boolean
    showLegend?: boolean
    showXLabel?: boolean
    showYLabel?: boolean
  }
  
  // Common style settings (always applied)
  commonStyles: {
    markerSize?: number
    lineWidth?: number
    lineStyle?: LineStyle
    xAxisTicks?: number
    yAxisTicks?: number
    xAxisTickPrecision?: number
    yAxisTickPrecision?: number
  }
  
  // Optional style settings (selectively applied)
  optionalStyles: {
    colorTheme?: ColorTheme
    customColors?: string[]
    markerPattern?: MarkerPattern
    markerType?: MarkerType // Only used when markerPattern is 'uniform'
  }
  
  // Layout settings
  layoutSettings?: {
    legendPosition?: {
      xRatio: number
      yRatio: number
    }
    margins?: {
      top: number
      right: number
      bottom: number
      left: number
    }
  }
}

export interface ApplyTemplateOptions {
  strategy: ApplyStrategy
  targetChartIds: string[]
  overwriteExisting: boolean
  applyDisplaySettings: boolean
  applyCommonStyles: boolean
  applyOptionalStyles: boolean
  applyLayoutSettings: boolean
}

export interface TemplateApplicationResult {
  chartId: string
  applied: boolean
  changes: string[]
  errors?: string[]
}