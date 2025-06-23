import { FormulaDefinition } from './formula'
import { StandardizedCSVData } from './csv-data'
import { ChartDataPoint } from './chart-data'

export type ActiveView = "explorer" | "search" | "database" | "calculator" | "settings"

export type ConditionMode = "predefined" | "manual"

export type CSVDataSourceType = "CASS" | "ACS" | "CHINAMI" | "SSAC" | "standard"


export type AxisType = "datetime" | "time" | "numeric" | "category" | "parameter"

export type TimeUnit = "sec" | "min" | "hr"

// DurationUnit has been removed - use TimeUnit instead for consistency

export type OperatorType = "gt" | "lt" | "eq" | "gte" | "lte" | "ne" | "crossAbove" | "crossBelow" | "isOn" | "isOff" | "switchedOn" | "switchedOff"

export type LogicalOperator = "AND" | "OR"

export type MarkerType = "circle" | "square" | "triangle" | "diamond" | "star" | "cross"

export type LineStyle = "solid" | "dashed" | "dotted"

export type ReferenceLineType = "vertical" | "horizontal" | "interlock"

export interface InterlockPoint {
  x: number
  y: number
}

export interface InterlockThreshold {
  id: string
  name: string
  color: string
  points: InterlockPoint[]
}

export interface InterlockDefinition {
  id: string
  name: string
  description?: string
  thresholds: InterlockThreshold[]
  xParameter?: string
  xUnit?: string
  yUnit?: string
}

export interface InterlockMaster {
  id: string
  name: string
  category: string
  plant_name: string
  machine_no: string
  definition: InterlockDefinition
  createdAt: string
  updatedAt: string
}

export interface ReferenceLine {
  id: string
  type: ReferenceLineType
  value: number | string  // Allow both for datetime strings and numeric values
  label: string
  color: string
  style: LineStyle
  // Label position offset from default position
  labelOffset?: {
    x: number
    y: number
  }
  // Range settings for the line
  xRange?: {
    auto: boolean
    min: string
    max: string
  }
  yRange?: {
    auto: boolean
    min: string
    max: string
  }
  // For interlock type
  interlockId?: string
  interlockSource?: "master" | "custom"
  interlockDefinition?: InterlockDefinition
  selectedThresholds?: string[]
}

// Note: DataSourceStyle is deprecated for chart plotting - use PlotStyle from './plot-style' instead
// This type is kept for backward compatibility with FileNode.dataSourceStyles
export interface DataSourceStyle {
  // Line settings
  lineEnabled?: boolean
  lineColor?: string
  lineWidth?: number
  lineStyle?: 'solid' | 'dashed' | 'dotted' | 'dashdot'
  lineOpacity?: number
  
  // Marker settings
  markerEnabled?: boolean
  markerShape?: 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star'
  markerSize?: number
  markerColor?: string
  markerOpacity?: number
  
  // Other settings
  showDataLabels?: boolean
  interpolation?: 'linear' | 'smooth' | 'step' | 'stepAfter' | 'stepBefore'
}

// ChartComponent has been moved to './chart-types' for better organization

// FileNode has been moved to './chart-types' for better organization

// LayoutSettings has been moved to './chart-types' for better organization

// ChartSettings has been moved to './chart-types' for better organization

// ChartSizes has been removed - rarely used and can be inlined where needed

// Event-related types
export interface EventInfo {
  id: string
  plant: string
  machineNo: string
  label: string
  labelDescription?: string
  event: string
  eventDetail?: string
  start: string
  end: string
}

// EventMaster extends EventInfo with additional fields and flexible indexing
export interface EventMaster extends Omit<EventInfo, 'labelDescription' | 'eventDetail' | 'start' | 'end'> {
  labelDescription: string // Required in EventMaster
  eventDetail: string // Required in EventMaster
  start: Date | string
  end: Date | string
  [key: string]: string | number | boolean | Date | null | undefined
}

// Search and condition types
export interface SearchCondition {
  id: string
  type: 'condition' | 'group'
  // For simple conditions
  parameter?: string
  operator?: OperatorType
  value?: string
  // For groups
  logicalOperator?: LogicalOperator
  conditions?: SearchCondition[]
}

export interface UnitValidationResult {
  hasUnitMismatch: boolean
  units: string[]
  canBeConverted: boolean
  suggestedUnit?: string
  parameterIndices: number[]
}

export interface ManualPeriod {
  id: string
  plant: string
  machineNo: string
  start: string
  end: string
}

export interface SearchResult {
  id: string
  timestamp: string
  plant?: string
  machineNo?: string
  parameters: Record<string, number>
  matchedConditions: string[]
}

export interface SavedCondition {
  id: string
  name: string
  expression: string
  conditions: SearchCondition[]
  createdAt: string
}

export interface PredefinedCondition {
  id: string
  name: string
  description: string
  expression: string
  conditions: SearchCondition[]
}

export interface CSVImportData {
  dataSourceType: CSVDataSourceType
  plant: string
  machineNo: string
  files: File[]
}

// Re-export sidebar types
export * from './sidebar'

// Re-export chart types
export * from './chart-types'

// Re-export plot style types
export * from './plot-style'