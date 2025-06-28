import { StandardizedCSVData } from '@/types/csv-data'
import { createLogger } from '@/utils/logger'
import { CSV_IMPORT_CONFIG } from '@/constants/csvImportConstants'

const logger = createLogger('mergeUtils')

export interface MergeResult {
  mergedData: StandardizedCSVData[]
  parameterInfo: {
    parameters: string[]
    units: string[]
  }
  warnings?: string[]
}

/**
 * Merge multiple CSV data arrays that have the same timestamp but different parameters
 * This is used for horizontally split CSV files (横分割)
 */
export function mergeCSVDataByTimestamp(
  dataArrays: StandardizedCSVData[][],
  parameterInfos: Array<{ parameters: string[]; units: string[] } | undefined>
): MergeResult {
  if (dataArrays.length === 0) {
    return {
      mergedData: [],
      parameterInfo: { parameters: [], units: [] }
    }
  }

  // If only one array, return as is
  if (dataArrays.length === 1) {
    return {
      mergedData: dataArrays[0],
      parameterInfo: parameterInfos[0] || { parameters: [], units: [] }
    }
  }

  // Create a map to store merged data by timestamp
  const mergedMap = new Map<string, StandardizedCSVData>()

  // Collect all parameters and units
  const allParameters = new Set<string>()
  const parameterUnitMap = new Map<string, string>()

  // Process parameter info
  parameterInfos.forEach((info) => {
    if (info) {
      info.parameters.forEach((param, index) => {
        allParameters.add(param)
        if (info.units[index]) {
          parameterUnitMap.set(param, info.units[index])
        }
      })
    }
  })

  // Get all data keys (excluding standard fields)
  const standardFieldsSet = new Set(CSV_IMPORT_CONFIG.STANDARD_FIELDS)

  // Track warnings for duplicate parameters with different values
  const warnings: string[] = []

  // Process each data array
  dataArrays.forEach((dataArray, fileIndex) => {
    logger.debug(`Processing file ${fileIndex + 1}, rows: ${dataArray.length}`)
    
    // Process in batches to avoid stack overflow
    const batchSize = CSV_IMPORT_CONFIG.BATCH_SIZE
    for (let i = 0; i < dataArray.length; i += batchSize) {
      const batch = dataArray.slice(i, Math.min(i + batchSize, dataArray.length))
      
      batch.forEach((row) => {
        if (!row.timestamp) return

        const existingRow = mergedMap.get(row.timestamp)
        
        if (existingRow) {
          // Merge data from this row into existing row - use Object.keys for better performance
          const keys = Object.keys(row)
          for (let j = 0; j < keys.length; j++) {
            const key = keys[j]
            const value = row[key]
            
            if (!standardFieldsSet.has(key as any) && value !== null && value !== undefined) {
              // Check if this parameter already exists with a different value
              if (existingRow[key] !== undefined && existingRow[key] !== value) {
                if (warnings.length < CSV_IMPORT_CONFIG.MAX_WARNINGS) { // Limit warnings to prevent memory issues
                  warnings.push(
                    `Parameter "${key}" at timestamp ${row.timestamp} has conflicting values: ${existingRow[key]} (file ${fileIndex}) vs ${value} (file ${fileIndex + 1})`
                  )
                }
              }
              
              // Add or update the data field
              existingRow[key] = value
            }
          }
        } else {
          // Create new row - copy standard fields first
          const newRow: StandardizedCSVData = {
            plant: row.plant,
            machineNo: row.machineNo,
            sourceType: row.sourceType,
            rowNumber: row.rowNumber,
            timestamp: row.timestamp
          }

          // Add all data fields - use Object.keys for better performance
          const keys = Object.keys(row)
          for (let j = 0; j < keys.length; j++) {
            const key = keys[j]
            const value = row[key]
            
            if (!standardFieldsSet.has(key as any) && value !== null && value !== undefined) {
              newRow[key] = value
            }
          }

          mergedMap.set(row.timestamp, newRow)
        }
      })
      
      // Log progress for large datasets
      if (dataArray.length > CSV_IMPORT_CONFIG.BATCH_SIZE && i % CSV_IMPORT_CONFIG.BATCH_SIZE === 0) {
        logger.debug(`Processed ${i + batch.length} / ${dataArray.length} rows`)
      }
    }
  })

  logger.debug(`Converting map to array, size: ${mergedMap.size}`)
  
  // Convert map back to array
  const mergedData = Array.from(mergedMap.values())
  
  logger.debug(`Sorting ${mergedData.length} rows by timestamp`)
  
  // Sort by timestamp - avoid creating Date objects for every comparison
  mergedData.sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0
    // Direct string comparison works for ISO date strings
    return a.timestamp.localeCompare(b.timestamp)
  })

  logger.debug(`Re-numbering rows`)
  
  // Re-number rows
  for (let i = 0; i < mergedData.length; i++) {
    mergedData[i].rowNumber = i + 1
  }

  // Build final parameter info
  logger.debug(`Building final parameter info, count: ${allParameters.size}`)
  
  const finalParameters = Array.from(allParameters)
  const finalUnits = finalParameters.map(param => parameterUnitMap.get(param) || '')

  logger.debug(`Merge complete. Total rows: ${mergedData.length}, Total parameters: ${finalParameters.length}`)

  return {
    mergedData,
    parameterInfo: {
      parameters: finalParameters,
      units: finalUnits
    },
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Check if multiple files should be merged based on their names
 * Files with same base name but different suffix (e.g., "横1", "横2") should be merged
 */
export function shouldMergeFiles(fileNames: string[]): boolean {
  if (fileNames.length < 2) return false

  // Extract base names by removing common patterns for split files
  const baseNames = fileNames.map(name => {
    // Remove file extension
    const withoutExt = name.replace(/\.(csv|CSV)$/, '')
    // Remove common split patterns: "横1", "横2", " - コピー", etc.
    return withoutExt
      .replace(CSV_IMPORT_CONFIG.MERGE_PATTERNS.HORIZONTAL_SPLIT, '')
      .replace(CSV_IMPORT_CONFIG.MERGE_PATTERNS.NUMBERED_SPLIT, '')
      .replace(CSV_IMPORT_CONFIG.MERGE_PATTERNS.COPY_PATTERN, '')
      .trim()
  })

  // Check if all files have the same base name
  const uniqueBaseNames = new Set(baseNames)
  return uniqueBaseNames.size === 1
}

/**
 * Get a merged file name from multiple file names
 */
export function getMergedFileName(fileNames: string[]): string {
  if (fileNames.length === 0) return ''
  if (fileNames.length === 1) return fileNames[0]

  // Use the base name from the first file
  const firstName = fileNames[0]
  const baseName = firstName
    .replace(/\.(csv|CSV)$/, '')
    .replace(CSV_IMPORT_CONFIG.MERGE_PATTERNS.HORIZONTAL_SPLIT, '')
    .replace(CSV_IMPORT_CONFIG.MERGE_PATTERNS.NUMBERED_SPLIT, '')
    .replace(CSV_IMPORT_CONFIG.MERGE_PATTERNS.COPY_PATTERN, '')
    .trim()

  return `${baseName}_merged.csv`
}

/**
 * Convert wide format data to long format (normalized form)
 * Each row becomes multiple rows: one for each parameter
 */
interface LongFormatRow {
  timestamp: string
  parameterName: string
  value: number | string | null
  unit: string
  plant: string
  machineNo: string
  sourceType: string
}

function convertToLongFormat(
  dataArray: StandardizedCSVData[],
  parameterInfo?: { parameters: string[]; units: string[] }
): LongFormatRow[] {
  const longFormatData: LongFormatRow[] = []
  const standardFields = new Set(CSV_IMPORT_CONFIG.STANDARD_FIELDS)
  
  // Build parameter-unit map
  const paramUnitMap = new Map<string, string>()
  if (parameterInfo) {
    parameterInfo.parameters.forEach((param, index) => {
      paramUnitMap.set(param, parameterInfo.units[index] || '')
    })
  }
  
  // Process in batches to avoid stack overflow
  const batchSize = 1000
  console.log(`Converting ${dataArray.length} rows to long format in batches of ${batchSize}`)
  
  for (let i = 0; i < dataArray.length; i += batchSize) {
    const batch = dataArray.slice(i, Math.min(i + batchSize, dataArray.length))
    
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j]
      if (!row.timestamp) continue
      
      // Extract parameter values from each row
      const keys = Object.keys(row)
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k]
        if (!standardFields.has(key as any)) {
          const value = row[key]
          if (value !== null && value !== undefined) {
            longFormatData.push({
              timestamp: row.timestamp!,
              parameterName: key,
              value: value as number | string,
              unit: paramUnitMap.get(key) || '',
              plant: row.plant,
              machineNo: row.machineNo,
              sourceType: row.sourceType as string
            })
          }
        }
      }
    }
    
    if (i % (batchSize * 10) === 0 && i > 0) {
      console.log(`Converted ${i} / ${dataArray.length} rows to long format`)
    }
  }
  
  console.log(`Long format conversion complete: ${longFormatData.length} entries`)
  return longFormatData
}

/**
 * Convert long format data back to wide format
 */
function convertToWideFormat(longFormatData: LongFormatRow[]): StandardizedCSVData[] {
  const wideFormatMap = new Map<string, StandardizedCSVData>()
  
  // Process in batches to avoid stack overflow
  const batchSize = 10000
  console.log(`Processing ${longFormatData.length} rows in batches of ${batchSize}`)
  
  for (let i = 0; i < longFormatData.length; i += batchSize) {
    const batch = longFormatData.slice(i, Math.min(i + batchSize, longFormatData.length))
    
    batch.forEach(row => {
      const key = row.timestamp
      
      if (!wideFormatMap.has(key)) {
        wideFormatMap.set(key, {
          timestamp: row.timestamp,
          plant: row.plant,
          machineNo: row.machineNo,
          sourceType: row.sourceType as any,
          rowNumber: 0 // Will be set later
        })
      }
      
      const wideRow = wideFormatMap.get(key)!
      wideRow[row.parameterName] = row.value as any
    })
    
    if (i % (batchSize * 10) === 0 && i > 0) {
      console.log(`Processed ${i} rows...`)
    }
  }
  
  // Convert to array and sort by timestamp
  const wideFormatData = Array.from(wideFormatMap.values())
  wideFormatData.sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0
    return a.timestamp.localeCompare(b.timestamp)
  })
  
  // Re-number rows
  wideFormatData.forEach((row, index) => {
    row.rowNumber = index + 1
  })
  
  return wideFormatData
}

/**
 * Universal merge function that handles both time-split and parameter-split files
 * Converts to long format, merges, then converts back to wide format
 */
export function mergeCSVDataUniversal(
  dataArrays: StandardizedCSVData[][],
  parameterInfos: Array<{ parameters: string[]; units: string[] } | undefined>
): MergeResult {
  // Temporarily comment out debug logging to avoid stack overflow
  // logger.debug('mergeCSVDataUniversal started', {
  //   filesCount: dataArrays.length,
  //   totalRows: dataArrays.reduce((sum, arr) => sum + arr.length, 0)
  // })
  console.log('mergeCSVDataUniversal started', dataArrays.length, 'files')
  
  if (dataArrays.length === 0) {
    return {
      mergedData: [],
      parameterInfo: { parameters: [], units: [] }
    }
  }

  // If only one array, return as is
  if (dataArrays.length === 1) {
    const params = parameterInfos[0] || { parameters: [], units: [] }
    
    // Extract parameters from data if not provided
    if (params.parameters.length === 0) {
      const standardFields = new Set(CSV_IMPORT_CONFIG.STANDARD_FIELDS)
      const paramSet = new Set<string>()
      
      dataArrays[0].forEach(row => {
        Object.keys(row).forEach(key => {
          if (!standardFields.has(key as any)) {
            paramSet.add(key)
          }
        })
      })
      
      params.parameters = Array.from(paramSet)
      params.units = new Array(params.parameters.length).fill('')
    }
    
    return {
      mergedData: dataArrays[0],
      parameterInfo: params
    }
  }

  // Convert all data to long format
  console.log('Converting to long format...')
  const allLongFormatData: LongFormatRow[] = []
  
  for (let index = 0; index < dataArrays.length; index++) {
    const dataArray = dataArrays[index]
    const paramInfo = parameterInfos[index]
    console.log(`Converting file ${index + 1} (${dataArray.length} rows) to long format...`)
    
    const longData = convertToLongFormat(dataArray, paramInfo)
    console.log(`File ${index + 1}: ${longData.length} long format rows`)
    
    // Avoid spread operator for large arrays - use concat or manual pushing
    if (longData.length > 50000) {
      console.log(`Large dataset detected (${longData.length} rows), using batch concat...`)
      // For very large arrays, concat in smaller chunks
      const chunkSize = 10000
      for (let i = 0; i < longData.length; i += chunkSize) {
        const chunk = longData.slice(i, i + chunkSize)
        for (let j = 0; j < chunk.length; j++) {
          allLongFormatData.push(chunk[j])
        }
        if (i % (chunkSize * 5) === 0 && i > 0) {
          console.log(`Merged ${i} / ${longData.length} long format rows`)
        }
      }
    } else {
      // For smaller arrays, simple push
      for (let i = 0; i < longData.length; i++) {
        allLongFormatData.push(longData[i])
      }
    }
  }
  
  // Check for duplicates (same timestamp + parameter)
  console.log('Checking for duplicates...')
  const warnings: string[] = []
  const seenKeys = new Set<string>()
  const duplicateKeys = new Set<string>()
  
  allLongFormatData.forEach(row => {
    const key = `${row.timestamp}|${row.parameterName}`
    if (seenKeys.has(key)) {
      duplicateKeys.add(key)
    }
    seenKeys.add(key)
  })
  
  if (duplicateKeys.size > 0 && warnings.length < CSV_IMPORT_CONFIG.MAX_WARNINGS) {
    warnings.push(`Found ${duplicateKeys.size} duplicate timestamp-parameter combinations`)
  }
  
  // Remove duplicates (keep the last occurrence)
  console.log('Removing duplicates...')
  const uniqueDataMap = new Map<string, LongFormatRow>()
  
  // Process in batches
  const batchSize = 10000
  for (let i = 0; i < allLongFormatData.length; i += batchSize) {
    const batch = allLongFormatData.slice(i, Math.min(i + batchSize, allLongFormatData.length))
    
    batch.forEach(row => {
      const key = `${row.timestamp}|${row.parameterName}`
      if (uniqueDataMap.has(key) && warnings.length < CSV_IMPORT_CONFIG.MAX_WARNINGS) {
        const existing = uniqueDataMap.get(key)!
        if (existing.value !== row.value) {
          warnings.push(
            `Duplicate data for ${row.parameterName} at ${row.timestamp}: ${existing.value} vs ${row.value}`
          )
        }
      }
      uniqueDataMap.set(key, row)
    })
    
    if (i % (batchSize * 10) === 0 && i > 0) {
      console.log(`Processed ${i} duplicate checks...`)
    }
  }
  
  const uniqueLongData = Array.from(uniqueDataMap.values())
  console.log(`After deduplication: ${uniqueLongData.length} rows`)
  
  // Convert back to wide format
  console.log('Converting back to wide format...')
  const mergedData = convertToWideFormat(uniqueLongData)
  console.log(`Final merged data: ${mergedData.length} rows`)
  
  // Collect all unique parameters and their units
  const parameterMap = new Map<string, string>() // parameter -> unit
  
  uniqueLongData.forEach(row => {
    if (!parameterMap.has(row.parameterName)) {
      parameterMap.set(row.parameterName, row.unit)
    }
  })
  
  const finalParameters = Array.from(parameterMap.keys())
  const finalUnits = finalParameters.map(param => parameterMap.get(param) || '')
  
  console.log('Merge complete', {
    totalRows: mergedData.length,
    totalParameters: finalParameters.length,
    warnings: warnings.length
  })

  return {
    mergedData,
    parameterInfo: {
      parameters: finalParameters,
      units: finalUnits
    },
    warnings: warnings.length > 0 ? warnings : undefined
  }
}