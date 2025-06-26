import { MarkerType, LineStyle } from './index'

export interface PlotStyleRow {
  id: string
  dataSource?: {
    id: string
    plant: string
    machineNo: string
    label: string
    labelDescription?: string
  }
  parameter?: {
    parameterType?: "Parameter" | "Formula" | "Interlock"
    parameter: string
    axisNo?: number
    axisName: string
    marker?: MarkerSettings
    line?: LineSettings
    legendText?: string
  }
  paramIndex: number
  dataSourceIndex?: number
  legendText: string
  colorIndex: number
}

export interface MarkerSettings {
  type: MarkerType
  size: number
  borderColor: string
  fillColor: string
}

export interface LineSettings {
  width: number
  color: string
  style: LineStyle
}

export type LegendMode = 'datasource' | 'parameter' | 'both'

export interface PlotStyleStrategy {
  generateRows(
    dataSources: PlotStyleRow['dataSource'][],
    params: PlotStyleRow['parameter'][]
  ): PlotStyleRow[]
  getTableHeaders(): string[]
  getDefaultLegend(row: PlotStyleRow): string
}

export interface PlotStyle {
  marker: MarkerSettings
  line: LineSettings
  legendText?: string
  visible?: boolean
}

export interface PlotStylesConfig {
  mode: LegendMode
  byDataSource?: Record<string, PlotStyle>
  byParameter?: Record<number, PlotStyle>
  byBoth?: Record<string, PlotStyle> // key format: "${dataSourceId}-${paramIndex}"
}