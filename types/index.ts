export type ActiveView = "explorer" | "search" | "database" | "settings"

export type ConditionMode = "predefined" | "manual"

export type ChartType = "bar" | "line" | "pie"

export type AxisType = "datetime" | "time" | "numeric" | "category" | "parameter"

export type TimeUnit = "sec" | "min" | "hr"

export type DurationUnit = "seconds" | "minutes" | "hours"

export type OperatorType = "gt" | "lt" | "eq" | "gte" | "lte" | "ne"

export type LogicalOperator = "AND" | "OR"

export type MarkerType = "circle" | "square" | "triangle" | "diamond"

export type LineStyle = "solid" | "dashed" | "dotted"

export interface ChartComponent {
  id: string
  title: string
  showTitle?: boolean
  chartType: ChartType
  data: Array<{ name: string; value: number }>
  legend?: boolean
  xLabel?: string
  yLabel?: string
  yAxisLabels?: Record<number, string>
  xParameter?: string
  yParameters?: string[]
  verticalLines?: Array<{ value: number; label?: string; color?: string }>
  horizontalLines?: Array<{ value: number; label?: string; color?: string }>
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
  }>
}

export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  chartType?: ChartType
  dataSources?: string[]
  charts?: ChartComponent[]
}

export interface LayoutSettings {
  showFileName: boolean
  showDataSources: boolean
  columns: number
  rows: number
  pagination: boolean
}

export interface ChartSettings {
  showLegend: boolean
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