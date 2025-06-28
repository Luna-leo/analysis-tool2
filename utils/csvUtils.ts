import { CSVDataSourceType } from "@/types"
import { StandardizedCSVData, ParsedCSVData } from "@/types/csv-data"
import { getDataSourceConfig } from "@/data/dataSourceTypes"
import { parseCASSFormat, parseStandardFormat, isCASSFormat, removeBOM } from "./csvParsers"
import { parseCSVStreaming } from "./csvParsers/streamingParser"
import { isTestDataFile as checkTestDataFile } from "@/config/csvFormats"
import { CSVErrorCollector } from "./csv/errorHandling"
import { parseCSVWithWorker, isWorkerAvailable } from "./csv/workerParser"

// Threshold for using streaming parser (5MB)
const STREAMING_THRESHOLD = 5 * 1024 * 1024

export interface CSVParseResult {
  success: boolean
  data?: ParsedCSVData[]
  error?: string
}

export interface CSVContentParseOptions {
  plant: string
  machineNo: string
  sourceType: CSVDataSourceType
  fileName: string
}

export interface CSVContentParseResult {
  data: StandardizedCSVData[]
  parameterInfo?: {
    parameters: string[]
    units: string[]
  }
  format?: string
}

export async function parseCSVContent(content: string, options: CSVContentParseOptions & { onProgress?: (progress: number) => void; errorCollector?: CSVErrorCollector }): Promise<CSVContentParseResult | null> {
  try {
    // Parse the CSV content
    const parsedData = await parseCSV(content, options.fileName, {
      onProgress: options.onProgress,
      errorCollector: options.errorCollector
    })
    
    // Validate the structure
    const validation = validateCSVStructure(
      parsedData.headers,
      options.sourceType,
      parsedData.metadata
    )
    
    if (!validation.valid) {
      console.error(`Invalid CSV structure for ${options.sourceType}:`, validation.missingColumns)
      return null
    }
    
    // Map to standardized format
    const standardizedData = mapCSVDataToStandardFormat(
      parsedData,
      options.sourceType,
      options.plant,
      options.machineNo
    )
    
    return {
      data: standardizedData,
      parameterInfo: parsedData.metadata?.parameterInfo,
      format: parsedData.metadata?.format
    }
  } catch (error) {
    console.error('Error parsing CSV content:', error)
    return null
  }
}

export async function parseCSVFiles(files: File[]): Promise<CSVParseResult> {
  try {
    const parsedFiles: ParsedCSVData[] = []

    for (const file of files) {
      console.log(`[parseCSVFiles] Processing file: ${file.name}, size: ${file.size} bytes`)
      
      // First try to read as UTF-8
      let text = await file.text()
      console.log(`[parseCSVFiles] Initial text length: ${text.length}, first 100 chars:`, text.substring(0, 100))
      
      // Check if the text appears to be garbled (common with Shift-JIS files)
      // If so, try reading as Shift-JIS
      if (containsGarbledText(text)) {
        console.log(`[parseCSVFiles] Detected garbled text, trying Shift-JIS encoding`)
        try {
          const buffer = await file.arrayBuffer()
          const decoder = new TextDecoder('shift-jis')
          text = decoder.decode(buffer)
          console.log(`[parseCSVFiles] Successfully decoded as Shift-JIS`)
        } catch (encodingError) {
          // If Shift-JIS decoding fails, fall back to UTF-8
          console.warn('Failed to decode as Shift-JIS, using UTF-8:', encodingError)
        }
      }
      
      console.log(`[parseCSVFiles] Parsing CSV content...`)
      const parsed = await parseCSV(text, file.name)
      console.log(`[parseCSVFiles] Parsed result:`, {
        headers: parsed.headers,
        rowCount: parsed.rows.length,
        metadata: parsed.metadata
      })
      parsedFiles.push(parsed)
    }

    console.log(`[parseCSVFiles] Successfully parsed ${parsedFiles.length} files`)
    return {
      success: true,
      data: parsedFiles
    }
  } catch (error) {
    console.error('[parseCSVFiles] Error details:', {
      error,
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      filesAttempted: files.map(f => ({ name: f.name, size: f.size }))
    })
    
    // Create a more informative error message
    let errorMessage = "CSV解析中にエラーが発生しました"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return {
      success: false,
      error: errorMessage
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

async function parseCSV(text: string, fileName: string, options?: { useStreaming?: boolean, onProgress?: (progress: number) => void, errorCollector?: CSVErrorCollector }): Promise<ParsedCSVData> {
  console.log(`[parseCSV] Parsing file: ${fileName}, text length: ${text.length}, options:`, options)
  
  // Check if we should use streaming parser
  const shouldUseStreaming = options?.useStreaming || text.length > STREAMING_THRESHOLD
  
  // Try to use Web Worker for large files if available
  if (shouldUseStreaming && isWorkerAvailable() && !options?.errorCollector) {
    try {
      console.log(`[parseCSV] Using Web Worker for large file (${text.length} bytes)`)
      return await parseCSVWithWorker(text, fileName, {
        useStreaming: true,
        onProgress: options?.onProgress
      })
    } catch (workerError) {
      console.warn('[parseCSV] Web Worker failed, falling back to streaming parser:', workerError)
      // Fall back to streaming parser if worker fails
    }
  }
  
  if (shouldUseStreaming) {
    console.log(`[parseCSV] Using streaming parser for large file (${text.length} bytes)`)
    return await parseCSVStreaming(text, fileName, {
      onProgress: options?.onProgress,
      errorCollector: options?.errorCollector,
      chunkSize: 1000
    })
  }
  
  // Remove BOM if present
  const cleanText = removeBOM(text)
  const lines = cleanText.trim().split('\n')
  console.log(`[parseCSV] After cleaning - total lines: ${lines.length}, first line:`, lines[0]?.substring(0, 100))
  
  if (lines.length === 0) {
    throw new Error(`File ${fileName} is empty`)
  }
  
  if (lines.length === 1 && lines[0].trim() === '') {
    throw new Error(`File ${fileName} contains no data`)
  }
  
  // Check if this is a test data file that should be treated as CHINAMI format
  const isTestDataFile = checkTestDataFile(fileName)
  console.log(`[parseCSV] Is test data file: ${isTestDataFile}`)
  
  // If it's a test data file, parse it as standard format and mark it as CHINAMI
  if (isTestDataFile) {
    const isCASSFormatFile = isCASSFormat(lines)
    console.log(`[parseCSV] Is CASS format: ${isCASSFormatFile}`)
    
    const parsedData = isCASSFormatFile 
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
    console.log(`[parseCSV] Parsing as CASS format`)
    return parseCASSFormat(lines, fileName)
  } else {
    console.log(`[parseCSV] Parsing as standard format`)
    return parseStandardFormat(lines, fileName)
  }
}

export function validateCSVStructure(
  headers: string[], 
  dataSourceType: CSVDataSourceType,
  metadata?: ParsedCSVData['metadata']
): { valid: boolean; missingColumns?: string[] } {
  console.log(`[validateCSVStructure] Validating for ${dataSourceType}:`, {
    headers: headers.slice(0, 10),
    metadata
  })
  
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
  
  // For standard format, be more flexible
  if (dataSourceType === 'standard') {
    // Just check if we have at least one column that could be a timestamp
    const hasTimeColumn = headers.some(h => 
      h.toLowerCase().includes('timestamp') || 
      h.toLowerCase().includes('datetime') || 
      h.toLowerCase().includes('time') ||
      h.toLowerCase().includes('date') ||
      h === headers[0] // First column is often timestamp
    )
    
    if (!hasTimeColumn && headers.length > 0) {
      console.log('[validateCSVStructure] Standard format: considering first column as timestamp')
      return { valid: true } // Accept any format with columns
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

  // For standard format or unknown formats, use flexible mapping
  if (dataSourceType === 'standard' || !getDataSourceConfig(dataSourceType)) {
    return parsedData.rows.map((row, rowIndex) => {
      const standardData: StandardizedCSVData = {
        plant,
        machineNo,
        sourceType: dataSourceType,
        rowNumber: rowIndex + 1
      }
      
      // Find timestamp column (first column or any column with time-related name)
      const firstKey = Object.keys(row)[0]
      const timeKey = Object.keys(row).find(key => 
        key.toLowerCase().includes('datetime') || 
        key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('timestamp') ||
        key.toLowerCase().includes('date')
      ) || firstKey
      
      if (timeKey && row[timeKey] !== null) {
        standardData.timestamp = String(row[timeKey])
      }
      
      // Include all columns as data
      Object.entries(row).forEach(([key, value]) => {
        if (value !== null) {
          standardData[key] = value as string | number | undefined
        }
      })
      
      return standardData
    })
  }

  // Regular handling for other formats with specific mappings
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