import { CSVDataSourceType } from "@/types"
import { StandardizedCSVData, ParsedCSVData } from "@/types/csv-data"
import { getDataSourceConfig } from "@/data/dataSourceTypes"
import { parseCASSFormat, parseStandardFormat, isCASSFormat, removeBOM } from "./csvParsers"
import { isTestDataFile as checkTestDataFile } from "@/config/csvFormats"

export interface CSVParseResult {
  success: boolean
  data?: ParsedCSVData[]
  error?: string
}

export async function parseCSVFiles(files: File[]): Promise<CSVParseResult> {
  try {
    const parsedFiles: ParsedCSVData[] = []

    for (const file of files) {
      // First try to read as UTF-8
      let text = await file.text()
      
      // Check if the text appears to be garbled (common with Shift-JIS files)
      // If so, try reading as Shift-JIS
      if (containsGarbledText(text)) {
        try {
          const buffer = await file.arrayBuffer()
          const decoder = new TextDecoder('shift-jis')
          text = decoder.decode(buffer)
        } catch (encodingError) {
          // If Shift-JIS decoding fails, fall back to UTF-8
          console.warn('Failed to decode as Shift-JIS, using UTF-8:', encodingError)
        }
      }
      
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

// Helper function to detect if text might be garbled
function containsGarbledText(text: string): boolean {
  // Check for common garbled patterns that occur when Shift-JIS is read as UTF-8
  // These are Unicode replacement characters and other signs of encoding issues
  return text.includes('�') || text.includes('ï¿½') || 
         // Check for BOM at the start that might indicate encoding issues
         (text.charCodeAt(0) === 0xFEFF && text.includes('�'))
}

function parseCSV(text: string, fileName: string): ParsedCSVData {
  // Remove BOM if present
  const cleanText = removeBOM(text)
  const lines = cleanText.trim().split('\n')
  
  // Check if this is a test data file that should be treated as CHINAMI format
  const isTestDataFile = checkTestDataFile(fileName)
  
  // If it's a test data file, parse it as standard format and mark it as CHINAMI
  if (isTestDataFile) {
    const parsedData = isCASSFormat(lines) 
      ? parseCASSFormat(lines, fileName)
      : parseStandardFormat(lines, fileName)
    
    // Override the format metadata to indicate this is CHINAMI data
    if (parsedData.metadata) {
      parsedData.metadata.format = 'CHINAMI'
    }
    
    return parsedData
  }
  
  // Check format and parse accordingly for non-test files
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
    const hasDatetime = headers.some(h => h.toLowerCase() === 'datetime')
    const hasParameters = headers.length > 1
    
    if (!hasDatetime) {
      return { valid: false, missingColumns: ['Datetime'] }
    }
    
    if (!hasParameters) {
      return { valid: false, missingColumns: ['At least one parameter column'] }
    }
    
    return { valid: true }
  }
  
  // Special handling for CASS format when user selected CASS but file is not detected as CASS
  if (dataSourceType === 'CASS') {
    // Allow any file with timestamp/datetime/time column for CASS data source type
    const hasTimeColumn = headers.some(h => 
      h.toLowerCase().includes('timestamp') || 
      h.toLowerCase().includes('datetime') || 
      h.toLowerCase().includes('time')
    )
    if (hasTimeColumn && headers.length > 1) {
      return { valid: true }
    }
    return { 
      valid: false, 
      missingColumns: ['timestamp or time column'] 
    }
  }
  
  // Special handling for CHINAMI format (test data files)
  if (dataSourceType === 'CHINAMI' || metadata?.format === 'CHINAMI') {
    // CHINAMI format should have time-related column and at least one data column
    const hasTimeColumn = headers.some(h => 
      h.toLowerCase().includes('datetime') || 
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('timestamp')
    )
    
    if (!hasTimeColumn) {
      return { valid: false, missingColumns: ['time'] }
    }
    
    if (headers.length < 2) {
      return { valid: false, missingColumns: ['At least one data column'] }
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

  // Special handling for CHINAMI format (test data)
  if (dataSourceType === 'CHINAMI' || parsedData.metadata?.format === 'CHINAMI') {
    // For CHINAMI format, if it was originally CASS format, use CASS mapping
    if (parsedData.metadata?.parameterInfo) {
      return mapCASSFormatToStandardized(parsedData, plant, machineNo)
    }
    
    // Otherwise, map using flexible time column detection
    return parsedData.rows.map((row, rowIndex) => {
      const standardData: StandardizedCSVData = {
        plant,
        machineNo,
        sourceType: 'CHINAMI',
        rowNumber: rowIndex + 1
      }
      
      // Find time-related column
      const timeKey = Object.keys(row).find(key => 
        key.toLowerCase().includes('datetime') || 
        key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('timestamp')
      )
      
      if (timeKey) {
        standardData.timestamp = String(row[timeKey])
      }
      
      // Include all other columns as data
      Object.entries(row).forEach(([key, value]) => {
        if (key !== timeKey && value !== null) {
          standardData[key] = value as string | number | undefined
        }
      })
      
      return standardData
    })
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
      if (index !== undefined && row[index] !== null) {
        standardData[standardField] = row[index]
      }
    })

    // Also include any optional columns if they exist
    config.columns.optional?.forEach(colName => {
      const index = headerIndexMap.get(colName.toLowerCase())
      if (index !== undefined && row[index] !== null) {
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
    // Get timestamp from row object (CASS format uses headers as keys)
    const timestamp = row['Datetime']
    
    if (!timestamp) return

    const standardData: StandardizedCSVData = {
      plant,
      machineNo,
      sourceType: 'CASS',
      rowNumber: rowIndex + 1,
      timestamp: typeof timestamp === 'string' ? timestamp : String(timestamp)
    }

    // Add all parameter values to the standardized data
    // Use headers directly to get values from row object
    parsedData.headers.forEach((header) => {
      if (header !== 'Datetime' && row[header] !== null && row[header] !== undefined) {
        const value = row[header]
        if (typeof value === 'string' && !isNaN(Number(value))) {
          standardData[header] = Number(value)
        } else {
          standardData[header] = value
        }
      }
    })

    result.push(standardData)
  })

  return result
}