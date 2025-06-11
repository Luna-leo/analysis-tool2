import { Parameter } from '@/types/parameter'
import { EventInfo } from '@/types'
import { ParsedCSVData } from '@/types/csv-data'

export interface EnhancedParameter extends Parameter {
  isFromDataSource?: boolean
  matchesDataSource?: boolean
}

/**
 * Extract parameter-like columns from CSV data
 * Excludes system columns and metadata columns
 */
export function extractParametersFromCSV(csvData: ParsedCSVData): EnhancedParameter[] {
  if (!csvData || !csvData.headers) return []

  // System columns to exclude
  const excludedColumns = new Set([
    'timestamp', 'time', 'date', 'datetime',
    'plant', 'machineNo', 'machine_no', 
    'sourceType', 'source_type',
    'rowNumber', 'row_number',
    'id', 'ID'
  ])

  const parameters: EnhancedParameter[] = []

  csvData.headers.forEach(header => {
    // Skip if it's a system column
    if (excludedColumns.has(header.toLowerCase())) return

    // Try to extract unit from header (e.g., "Temperature (°C)" -> name: "Temperature", unit: "°C")
    const unitMatch = header.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
    
    let paramName = header
    let unit = ''
    
    if (unitMatch) {
      paramName = unitMatch[1].trim()
      unit = unitMatch[2].trim()
    }

    parameters.push({
      id: `ds_${header}`, // Prefix with ds_ to differentiate from master
      name: paramName,
      unit: unit,
      plant: '', // Will be filled from EventInfo
      machineNo: '', // Will be filled from EventInfo
      source: 'DataSource',
      isFromDataSource: true
    })
  })

  return parameters
}

/**
 * Merge master parameters with data source parameters
 * Data source parameters take priority in sorting
 */
export function mergeParametersWithPriority(
  masterParameters: Parameter[],
  dataSourceParameters: EnhancedParameter[]
): EnhancedParameter[] {
  const enhancedMasterParams: EnhancedParameter[] = masterParameters.map(param => ({
    ...param,
    isFromDataSource: false,
    matchesDataSource: false
  }))

  // Create a map of data source parameters by name+unit for matching
  const dsParamMap = new Map<string, EnhancedParameter>()
  dataSourceParameters.forEach(param => {
    const key = `${param.name}|${param.unit}`
    dsParamMap.set(key, param)
  })

  // Mark master parameters that match data source parameters
  enhancedMasterParams.forEach(param => {
    const key = `${param.name}|${param.unit}`
    if (dsParamMap.has(key)) {
      param.matchesDataSource = true
    }
  })

  // Get unique parameters from data source that don't exist in master
  const uniqueDsParams = dataSourceParameters.filter(dsParam => {
    const key = `${dsParam.name}|${dsParam.unit}`
    return !enhancedMasterParams.some(masterParam => 
      `${masterParam.name}|${masterParam.unit}` === key
    )
  })

  // Combine all parameters with proper sorting
  const allParams = [...enhancedMasterParams, ...uniqueDsParams]

  // Sort: DataSource matches first, then DataSource unique, then master only
  return allParams.sort((a, b) => {
    // Priority 1: Parameters that exist in DataSource (either matched or unique)
    const aInDs = a.isFromDataSource || a.matchesDataSource
    const bInDs = b.isFromDataSource || b.matchesDataSource
    
    if (aInDs && !bInDs) return -1
    if (!aInDs && bInDs) return 1
    
    // Priority 2: Among DataSource parameters, matched ones come first
    if (aInDs && bInDs) {
      if (a.matchesDataSource && !b.isFromDataSource) return -1
      if (!a.matchesDataSource && b.matchesDataSource) return 1
    }
    
    // Priority 3: Alphabetical by name
    return a.name.localeCompare(b.name)
  })
}

/**
 * Check if parameter source setting is set to use data source
 */
export function shouldUseDataSourcePriority(parameterSource: string): boolean {
  return parameterSource === 'datasource'
}