import type { ChartComponent, LayoutSettings, ChartSettings } from './index'

/**
 * ChartGrid configuration export format
 */
export interface ChartGridConfig {
  version: string // Format version for future compatibility
  metadata: {
    exportedAt: string
    fileId: string
    fileName?: string
    description?: string
  }
  layoutSettings: LayoutSettings
  chartSettings: ChartSettings
  charts: ChartComponent[]
  dataSourceInfo?: {
    // Optional metadata about data sources for validation
    requiredDataSources?: string[]
    requiredParameters?: string[]
  }
}

/**
 * Validation result for imported config
 */
export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Import options
 */
export interface ImportOptions {
  preserveExistingData?: boolean // Keep existing charts and merge with imported
  validateDataSources?: boolean // Check if required data sources exist
  applyImmediately?: boolean // Apply settings immediately or preview first
}