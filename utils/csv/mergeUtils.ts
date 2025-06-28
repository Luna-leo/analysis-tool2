import { StandardizedCSVData } from '@/types/csv-data'

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
  const standardFieldsSet = new Set(['plant', 'machineNo', 'sourceType', 'rowNumber', 'timestamp'])

  // Track warnings for duplicate parameters with different values
  const warnings: string[] = []

  // Process each data array
  dataArrays.forEach((dataArray, fileIndex) => {
    console.log(`[mergeCSVDataByTimestamp] Processing file ${fileIndex + 1}, rows: ${dataArray.length}`)
    
    // Process in batches to avoid stack overflow
    const batchSize = 1000
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
            
            if (!standardFieldsSet.has(key) && value !== null && value !== undefined) {
              // Check if this parameter already exists with a different value
              if (existingRow[key] !== undefined && existingRow[key] !== value) {
                if (warnings.length < 100) { // Limit warnings to prevent memory issues
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
            
            if (!standardFieldsSet.has(key) && value !== null && value !== undefined) {
              newRow[key] = value
            }
          }

          mergedMap.set(row.timestamp, newRow)
        }
      })
      
      // Log progress for large datasets
      if (dataArray.length > 1000 && i % 1000 === 0) {
        console.log(`[mergeCSVDataByTimestamp] Processed ${i + batch.length} / ${dataArray.length} rows`)
      }
    }
  })

  console.log(`[mergeCSVDataByTimestamp] Converting map to array, size: ${mergedMap.size}`)
  
  // Convert map back to array
  const mergedData = Array.from(mergedMap.values())
  
  console.log(`[mergeCSVDataByTimestamp] Sorting ${mergedData.length} rows by timestamp`)
  
  // Sort by timestamp - avoid creating Date objects for every comparison
  mergedData.sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0
    // Direct string comparison works for ISO date strings
    return a.timestamp.localeCompare(b.timestamp)
  })

  console.log(`[mergeCSVDataByTimestamp] Re-numbering rows`)
  
  // Re-number rows
  for (let i = 0; i < mergedData.length; i++) {
    mergedData[i].rowNumber = i + 1
  }

  // Build final parameter info
  console.log(`[mergeCSVDataByTimestamp] Building final parameter info, count: ${allParameters.size}`)
  
  const finalParameters = Array.from(allParameters)
  const finalUnits = finalParameters.map(param => parameterUnitMap.get(param) || '')

  console.log(`[mergeCSVDataByTimestamp] Merge complete. Total rows: ${mergedData.length}, Total parameters: ${finalParameters.length}`)

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
      .replace(/\s*[-－]\s*横\d+\s*$/, '')
      .replace(/\s*[-－]\s*\d+\s*$/, '')
      .replace(/\s*[-－]\s*コピー.*$/, '')
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
    .replace(/\s*[-－]\s*横\d+\s*$/, '')
    .replace(/\s*[-－]\s*\d+\s*$/, '')
    .replace(/\s*[-－]\s*コピー.*$/, '')
    .trim()

  return `${baseName}_merged.csv`
}