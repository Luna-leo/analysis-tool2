// Chart-specific type definitions

export interface DataSourceColorMapping {
  [dataSourceId: string]: number
}

export interface ChartRenderData {
  x: number | string | Date
  y: number
  series: string
  seriesIndex: number
  timestamp: string
  dataSourceId: string
  dataSourceLabel: string
  dataSourceIndex?: number
}