import { CSVDataSourceType } from "@/types"
import { StandardizedCSVData, ParsedCSVData } from "@/types/csv-data"
import { getDataSourceConfig } from "@/data/dataSourceTypes"

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
  const cleanText = text.charAt(0) === '\uFEFF' ? text.slice(1) : text
  const lines = cleanText.trim().split('\n')
  
  // Check if this is SSAC format (by looking for typical SSAC structure)
  const firstLine = parseCSVLine(lines[0])
  const secondLine = lines.length > 1 ? parseCSVLine(lines[1]) : []
  const thirdLine = lines.length > 2 ? parseCSVLine(lines[2]) : []
  
  // SSAC format detection:
  // - First row starts with Datetime or empty, followed by P#### pattern
  // - Second row has parameter names
  // - Third row has units
  const isSSACFormat = lines.length >= 3 && 
    firstLine.length > 1 && 
    (firstLine[0].toLowerCase().includes('datetime') || firstLine[0] === '' || firstLine[0] === '﻿Datetime') &&
    (firstLine[1] && firstLine[1].match(/^P\d+$/)) &&
    secondLine.length > 1 &&
    thirdLine.length > 1
  
  if (isSSACFormat) {
    // SSAC format: 3 header rows, data starts from row 4
    // Extract parameter information from the header rows
    const idRow = parseCSVLine(lines[0])
    const paramRow = parseCSVLine(lines[1])
    const unitRow = parseCSVLine(lines[2])
    
    // Create headers from parameter names
    const headers = ['Datetime']
    for (let i = 1; i < paramRow.length; i++) {
      if (paramRow[i]) {
        headers.push(paramRow[i])
      }
    }
    
    // Parse data rows starting from row 4 (index 3)
    const rows = []
    for (let i = 3; i < lines.length; i++) {
      const rowArray = parseCSVLine(lines[i])
      if (rowArray.length === 0 || !rowArray[0]) continue // Skip empty rows
      
      const rowObj: Record<string, string | number | null> = {}
      rowObj['Datetime'] = rowArray[0] // First column is datetime
      
      for (let j = 1; j < rowArray.length && j < headers.length; j++) {
        const value = rowArray[j] || null
        const numValue = Number(value)
        rowObj[headers[j]] = !isNaN(numValue) && value !== '' ? numValue : value
      }
      rows.push(rowObj)
    }
    
    return {
      headers,
      rows,
      metadata: {
        fileName,
        format: 'SSAC',
        parameterInfo: {
          ids: idRow.slice(1),
          parameters: paramRow.slice(1),
          units: unitRow.slice(1)
        }
      }
    }
  } else {
    // Standard CSV format
    const headers = parseCSVLine(lines[0])
    const rowArrays = lines.slice(1).map(line => parseCSVLine(line))
    
    // Convert array rows to object rows
    const rows = rowArrays.map(rowArray => {
      const rowObj: Record<string, string | number | null> = {}
      headers.forEach((header, index) => {
        const value = rowArray[index] || null
        // Try to parse as number
        const numValue = Number(value)
        rowObj[header] = !isNaN(numValue) && value !== '' ? numValue : value
      })
      return rowObj
    })

    return {
      headers,
      rows,
      metadata: {
        fileName
      }
    }
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

export function validateCSVStructure(
  headers: string[], 
  dataSourceType: CSVDataSourceType,
  metadata?: ParsedCSVData['metadata']
): { valid: boolean; missingColumns?: string[] } {
  // For SSAC format, validation is different
  if (dataSourceType === 'SSAC' && metadata?.format === 'SSAC') {
    // SSAC format should have Datetime column and at least one parameter
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