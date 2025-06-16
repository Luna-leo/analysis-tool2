import { FormulaDefinition } from './formula'
import { StandardizedCSVData } from './csv-data'
import { ChartDataPoint } from './chart-data'

export type ActiveView = "explorer" | "search" | "database" | "calculator" | "settings"

export type ConditionMode = "predefined" | "manual"

export type CSVDataSourceType = "CASS" | "ACS" | "CHINAMI" | "SSAC" | "standard"


export type AxisType = "datetime" | "time" | "numeric" | "category" | "parameter"

export type TimeUnit = "sec" | "min" | "hr"

export type DurationUnit = "seconds" | "minutes" | "hours"

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
  // For interlock type
  interlockId?: string
  interlockSource?: "master" | "custom"
  interlockDefinition?: InterlockDefinition
  selectedThresholds?: string[]
}

export interface DataSourceStyle {
  // Line settings
  lineEnabled?: boolean  // Whether to show lines connecting points
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

export interface ChartComponent {
  id: string
  title: string
  showTitle?: boolean
  showLegend?: boolean
  data: Array<{ name: string; value: number }>
  xLabel?: string
  yLabel?: string
  yAxisLabels?: Record<number, string>
  xParameter?: string
  yParameters?: string[]
  verticalLines?: Array<{ value: number; label?: string; color?: string }>
  horizontalLines?: Array<{ value: number; label?: string; color?: string }>
  referenceLines?: ReferenceLine[]
  dataSource?: {
    name: string
    table: string
    columns: string[]
    lastUpdated: string
  }
  xAxisType?: AxisType
  xAxisRange?: {
    auto?: boolean
    min: string | number
    max: string | number
    unit?: TimeUnit
  }
  yAxisParams?: Array<{
    parameterType?: "Parameter" | "Formula" | "Interlock"
    parameter: string
    axisNo?: number
    axisName: string
    range?: {
      auto?: boolean
      min: number
      max: number
    }
    marker?: {
      type: MarkerType
      size: number
      borderColor: string
      fillColor: string
    }
    line?: {
      width: number
      color: string
      style: LineStyle
    }
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
  }>
  fileId?: string
  type?: string
  showMarkers?: boolean
  showLines?: boolean
  legendPosition?: {
    xRatio: number
    yRatio: number
  }
  legendMode?: 'datasource' | 'parameter' | 'both'
  dataSourceLegends?: Record<string, string> // For storing legend text per data source ID
}

export interface FileNode {
  id: string
  name: string
  type: "file" | "folder" | "csv-import" | "event-master" | "interlock-master" | "formula-master" | "trigger-condition-master" | "unit-converter-formula-master" | "sensor-data-master" | "parameter-master" | "tag-master" | "settings"
  children?: FileNode[]
  dataSources?: string[]
  selectedDataSources?: EventInfo[] // Common data sources for all charts in this grid
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle } // Styles for each data source
  charts?: ChartComponent[]
  isSystemNode?: boolean // For non-removable nodes like CSV Import
}

export interface LayoutSettings {
  showFileName: boolean
  showDataSources: boolean
  columns: number
  rows: number
  pagination: boolean
  width?: number
  height?: number
}

export interface ChartSettings {
  showXAxis: boolean
  showYAxis: boolean
  showGrid: boolean
}

export interface ChartSizes {
  cardMinHeight: number
  chartMinHeight: number
  isCompactLayout: boolean
}

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

export interface EventMaster {
  id: string
  plant: string
  machineNo: string
  label: string
  labelDescription: string
  event: string
  eventDetail: string
  start: Date | string
  end: Date | string
  [key: string]: string | number | boolean | Date | null | undefined
}

// Re-export sidebar types
export * from './sidebar'