import { CSVDataSourceType } from './index'

export interface StandardizedCSVData {
  plant: string
  machineNo: string
  sourceType: CSVDataSourceType
  rowNumber: number
  timestamp?: string
  [key: string]: string | number | CSVDataSourceType | undefined
}

export interface ParsedCSVColumn {
  name: string
  type: 'string' | 'number' | 'datetime'
  values: Array<string | number | null>
}

export interface ParsedCSVData {
  headers: string[]
  rows: Array<Record<string, string | number | null>>
  columns?: ParsedCSVColumn[]
  metadata?: {
    fileName: string
    format?: 'CASS' | 'standard' | 'CHINAMI' | 'SSAC' | 'streaming' | 'webstream'
    parameterInfo?: {
      ids: string[]
      parameters: string[]
      units: string[]
    }
  }
}

// 時系列データポイント
export interface CSVDataPoint {
  timestamp: string
  [key: string]: string | number | undefined
}

// CSVデータ（期間ベース - レガシー）
export interface CSVData {
  periodId: string
  plant: string
  machineNo: string
  data: CSVDataPoint[]
  metadata?: {
    totalRecords: number
    parameters: string[]
    dateRange: {
      start: string
      end: string
    }
    lastUpdated: string
  }
}