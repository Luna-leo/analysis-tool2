/**
 * Consolidated chart type definitions
 * This file contains all chart-related types to avoid duplication and improve maintainability
 */

import { 
  AxisType, 
  TimeUnit, 
  ReferenceLine,
  InterlockDefinition
} from './index'
import { FormulaDefinition } from './formula'
import { EventInfo } from './index'
import { MarkerSettings, LineSettings, PlotStylesConfig } from './plot-style'

/**
 * Core chart data structure
 */
export interface ChartData {
  name: string
  value: number
}

/**
 * Chart axis range configuration
 */
export interface AxisRange {
  auto?: boolean
  min: string | number
  max: string | number
  unit?: TimeUnit
}

/**
 * Y-axis parameter configuration
 */
export interface YAxisParameter {
  parameterType?: "Parameter" | "Formula" | "Interlock"
  parameter: string
  axisNo?: number
  axisName: string
  range?: {
    auto?: boolean
    min: number
    max: number
  }
  marker?: MarkerSettings
  line?: LineSettings
  // For Interlock type
  interlockId?: string
  interlockSource?: "master" | "custom"
  interlockDefinition?: InterlockDefinition
  selectedThresholds?: string[]
  // For Formula type
  formulaId?: string
  formulaDefinition?: FormulaDefinition
  // Unit conversion
  unit?: string
  unitConversionId?: string
  // Legend text
  legendText?: string
}

/**
 * Chart margins configuration
 */
export interface ChartMargins {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Legend position configuration
 */
export interface LegendPosition {
  xRatio: number
  yRatio: number
}

/**
 * Data source configuration for charts
 */
export interface ChartDataSource {
  name: string
  table: string
  columns: string[]
  lastUpdated: string
}

/**
 * Simplified chart component interface
 * Core properties are required, styling and advanced features are optional
 */
export interface ChartComponent {
  // Core properties
  id: string
  title: string
  /**
   * @deprecated This property is not used. Actual chart data is loaded dynamically 
   * via the useOptimizedChart hook based on data sources and parameters.
   * This field is always initialized as an empty array and never populated.
   */
  data: ChartData[]
  
  // Data configuration
  xParameter?: string
  yParameters?: string[]
  xAxisType?: AxisType
  xAxisRange?: AxisRange
  yAxisParams?: YAxisParameter[]
  
  // Data source
  dataSource?: ChartDataSource
  fileId?: string
  type?: string
  
  // Reference lines
  referenceLines?: ReferenceLine[]
  
  // Display options
  showTitle?: boolean
  showLegend?: boolean
  showMarkers?: boolean
  showLines?: boolean
  showGrid?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showXLabel?: boolean
  showYLabel?: boolean
  showTooltip?: boolean
  
  // Labels
  xLabel?: string
  yLabel?: string
  xLabelOffset?: number
  yLabelOffset?: number
  yAxisLabels?: Record<number, string>
  
  // Label update preferences
  autoUpdateXLabel?: boolean
  autoUpdateYLabels?: boolean
  autoUpdateTitle?: boolean
  
  // Layout
  margins?: ChartMargins
  legendPosition?: LegendPosition
  legendMode?: 'datasource' | 'parameter' | 'both'
  titlePosition?: LegendPosition
  xLabelPosition?: LegendPosition
  yLabelPosition?: LegendPosition
  
  // Styling
  plotStyles?: PlotStylesConfig
  dataSourceLegends?: Record<string, string>
  
  // Axis configuration
  xAxisTicks?: number
  yAxisTicks?: number
  xAxisTickPrecision?: number
  yAxisTickPrecision?: number
  
  // Legacy properties (to be deprecated)
  verticalLines?: Array<{ value: number; label?: string; color?: string }>
  horizontalLines?: Array<{ value: number; label?: string; color?: string }>
}

/**
 * File node in the file tree
 */
export interface FileNode {
  id: string
  name: string
  type: "file" | "folder" | "csv-import" | "event-master" | "interlock-master" | 
        "formula-master" | "trigger-condition-master" | "unit-converter-formula-master" | 
        "sensor-data-master" | "parameter-master" | "tag-master" | "settings" | "server-sync"
  children?: FileNode[]
  dataSources?: string[]
  selectedDataSources?: EventInfo[]
  dataSourceStyles?: Record<string, any> // Legacy - to be migrated to plot styles
  charts?: ChartComponent[]
  isSystemNode?: boolean
}

/**
 * Layout settings for chart grid
 */
export interface LayoutSettings {
  showFileName: boolean
  showDataSources: boolean
  columns: number
  rows: number
  pagination: boolean
  width?: number
  height?: number
  currentPage?: number
}

/**
 * Chart display settings
 */
export interface ChartSettings {
  showXAxis: boolean
  showYAxis: boolean
  showGrid: boolean
  showLegend?: boolean
  showChartTitle?: boolean
  showXLabel?: boolean
  showYLabel?: boolean
  showMarkers?: boolean
  showLines?: boolean
  showTooltip?: boolean
  margins?: ChartMargins | { top: string | number; right: string | number; bottom: string | number; left: string | number }
  xLabelOffset?: number
  yLabelOffset?: number
  marginMode?: 'auto' | 'manual' | 'percentage' | 'fixed' | 'adaptive' | 'unified'
  autoMarginScale?: number
  marginOverrides?: Record<string, any>
}

/**
 * Layout context for adaptive margin calculation
 */
export interface LayoutContext {
  gridSize: {
    columns: number
    rows: number
  }
  containerSize: {
    width: number
    height: number
  }
  contentMetrics?: {
    maxTickLabelWidth: number
    maxTickLabelHeight: number
    titleHeight: number
    legendSize: {
      width: number
      height: number
    }
  }
  deviceContext?: {
    dpr: number
    zoomLevel: number
  }
}

export type LayoutCategory = 'small' | 'medium' | 'large'

export interface MarginPixels {
  top: number
  right: number
  bottom: number
  left: number
}

export interface AdaptiveMargins {
  base: {
    top: string | number
    right: string | number
    bottom: string | number
    left: string | number
  }
  constraints: {
    min: MarginPixels
    max: MarginPixels
  }
  calculated: MarginPixels
}