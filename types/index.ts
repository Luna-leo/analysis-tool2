export type ActiveView = "explorer" | "search" | "database" | "settings"

export interface ChartComponent {
  id: string
  title: string
  showTitle?: boolean
  chartType: "bar" | "line" | "pie"
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
  xAxisType?: "datetime" | "time" | "numeric" | "category" | "parameter"
  xAxisRange?: {
    auto?: boolean
    min: string | number
    max: string | number
    unit?: "sec" | "min" | "hr"
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
      type: "circle" | "square" | "triangle" | "diamond"
      size: number
      borderColor: string
      fillColor: string
    }
    line?: {
      width: number
      color: string
      style: "solid" | "dashed" | "dotted"
    }
  }>
}

export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  chartType?: "bar" | "line" | "pie"
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