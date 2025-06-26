export interface ChartDataPoint {
  x: number | Date
  y: number
  parameter?: string
}

export interface ChartSeriesData {
  name: string
  data: ChartDataPoint[]
  color?: string
  yAxisIndex?: number
}

export interface ChartData {
  series: ChartSeriesData[]
  xAxisType: 'datetime' | 'value'
  yAxisLabels?: string[]
}