import { CSVDataSourceType } from "@/types"
import { StandardizedCSVData, ParsedCSVData } from "@/types/csv-data"
import { getDataSourceConfig } from "@/data/dataSourceTypes"
import { parseSSACFormat, parseStandardFormat, isSSACFormat, removeBOM } from "./csvParsers"

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
  if (isSSACFormat(lines)) {
    return parseSSACFormat(lines, fileName)
  } else {
    return parseStandardFormat(lines, fileName)
  }
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