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
    format?: 'CASS' | 'standard' | 'CHINAMI' | 'SSAC'
    parameterInfo?: {
      ids: string[]
      parameters: string[]
      units: string[]
    }
  }
}