import { CSVDataSourceType } from "@/types"
import { StandardizedCSVData, ParsedCSVData } from "@/types/csv-data"
import { getDataSourceConfig } from "@/data/dataSourceTypes"
import { parseCASSFormat, parseStandardFormat, isCASSFormat, removeBOM } from "./csvParsers"

export interface CSVParseResult {
  success: boolean
  data?: ParsedCSVData[]
  error?: string
}

export async function parseCSVFiles(files: File[]): Promise<CSVParseResult> {
  try {
    const parsedFiles: ParsedCSVData[] = []

    for (const file of files) {
      const text = await file.text()
      const parsed = parseCSV(text, file.name)
      parsedFiles.push(parsed)
    }

    return {
      success: true,
      data: parsedFiles
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "CSV解析中にエラーが発生しました"
    }
  }
}

function parseCSV(text: string, fileName: string): ParsedCSVData {
  // Remove BOM if present
  const cleanText = removeBOM(text)
  const lines = cleanText.trim().split('\n')
  
  // Check format and parse accordingly
  if (isCASSFormat(lines)) {
    return parseCASSFormat(lines, fileName)
  } else {
    return parseStandardFormat(lines, fileName)
  }
}

export function validateCSVStructure(
  headers: string[], 
  dataSourceType: CSVDataSourceType,
  metadata?: ParsedCSVData['metadata']
): { valid: boolean; missingColumns?: string[] } {
  // For CASS format, validation is different
  if (dataSourceType === 'CASS' && metadata?.format === 'CASS') {
    // CASS format should have Datetime column and at least one parameter
    const hasDatetime = headers.includes('Datetime')
    const hasParameters = headers.length > 1
    
    if (!hasDatetime) {
      return { valid: false, missingColumns: ['Datetime'] }
    }
    
    if (!hasParameters) {
      return { valid: false, missingColumns: ['At least one parameter column'] }
    }
    
    return { valid: true }
  }
  
  // Standard validation for other formats
  const config = getDataSourceConfig(dataSourceType)
  const headerLower = headers.map(h => h.toLowerCase())
  
  const missingColumns = config.columns.required.filter(
    col => !headerLower.includes(col.toLowerCase())
  )

  return {
    valid: missingColumns.length === 0,
    missingColumns: missingColumns.length > 0 ? missingColumns : undefined
  }
}

export function mapCSVDataToStandardFormat(
  parsedData: ParsedCSVData,
  dataSourceType: CSVDataSourceType,
  plant: string,
  machineNo: string
): StandardizedCSVData[] {
  // Special handling for CASS format
  if (dataSourceType === 'CASS' && parsedData.metadata?.format === 'CASS') {
    return mapCASSFormatToStandardized(parsedData, plant, machineNo)
  }

  // Regular handling for other formats
  const config = getDataSourceConfig(dataSourceType)
  const headerIndexMap = new Map<string, number>()
  
  // Create a map of column names to indices (case-insensitive)
  parsedData.headers.forEach((header, index) => {
    headerIndexMap.set(header.toLowerCase(), index)
  })

  return parsedData.rows.map((row, rowIndex) => {
    const standardData: StandardizedCSVData = {
      plant,
      machineNo,
      sourceType: dataSourceType,
      rowNumber: rowIndex + 1
    }

    // Map columns using the configured column mappings
    Object.entries(config.columnMappings).forEach(([standardField, sourceField]) => {
      const index = headerIndexMap.get(sourceField.toLowerCase())
      if (index !== undefined) {
        standardData[standardField] = row[index]
      }
    })

    // Also include any optional columns if they exist
    config.columns.optional?.forEach(colName => {
      const index = headerIndexMap.get(colName.toLowerCase())
      if (index !== undefined) {
        standardData[colName] = row[index]
      }
    })

    return standardData
  })
}

function mapCASSFormatToStandardized(
  parsedData: ParsedCSVData,
  plant: string,
  machineNo: string
): StandardizedCSVData[] {
  const result: StandardizedCSVData[] = []
  
  // Get parameter information from metadata
  const parameterInfo = parsedData.metadata?.parameterInfo
  if (!parameterInfo) {
    console.error('No parameter info found in CASS metadata')
    return result
  }

  // Find datetime column index
  const datetimeIndex = parsedData.headers.findIndex(h => h.toLowerCase() === 'datetime')
  if (datetimeIndex === -1) {
    console.error('No Datetime column found in CASS data')
    return result
  }

  // Process each data row
  parsedData.rows.forEach((row, rowIndex) => {
    // CASS format rows are objects with index as keys
    const rowData = Object.values(row)
    const timestamp = rowData[datetimeIndex]
    
    if (!timestamp) return

    const standardData: StandardizedCSVData = {
      plant,
      machineNo,
      sourceType: 'CASS',
      rowNumber: rowIndex + 1,
      timestamp: typeof timestamp === 'string' ? timestamp : String(timestamp)
    }

    // Add all parameter values to the standardized data
    parameterInfo.parameters.forEach((paramName: string, paramIndex: number) => {
      const columnIndex = paramIndex + 1 // Skip datetime column (index 0)
      if (columnIndex < rowData.length && rowData[columnIndex] !== null && rowData[columnIndex] !== undefined) {
        // Convert to number if possible
        const value = rowData[columnIndex]
        if (typeof value === 'string' && !isNaN(Number(value))) {
          standardData[paramName] = Number(value)
        } else {
          standardData[paramName] = value
        }
      }
    })

    result.push(standardData)
  })

  return result
}