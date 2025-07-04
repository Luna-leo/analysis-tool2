import { CSVDataSourceType } from './index'

export interface CollectedPeriod {
  id: string
  plant: string
  machineNo: string
  dataSourceType: CSVDataSourceType | string
  startDate: string // ISO date string
  endDate: string   // ISO date string
  fileCount: number
  importedAt: string // ISO date string
  metadata?: {
    fileNames?: string[]
    dateColumnName?: string
  }
}