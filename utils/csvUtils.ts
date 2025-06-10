import { CSVDataSourceType } from "@/types"

export interface ParsedCSVData {
  headers: string[]
  rows: string[][]
  metadata: {
    fileName: string
    rowCount: number
    columnCount: number
  }
}

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
  const lines = text.trim().split('\n')
  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(line => parseCSVLine(line))

  return {
    headers,
    rows,
    metadata: {
      fileName,
      rowCount: rows.length,
      columnCount: headers.length
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

// データソースタイプに応じたカラムマッピング
export const DATA_SOURCE_COLUMN_MAPPING: Record<CSVDataSourceType, {
  required: string[]
  optional?: string[]
}> = {
  SSAC: {
    required: ['timestamp', 'tag_name', 'value', 'quality'],
    optional: ['unit', 'description']
  },
  SCA: {
    required: ['datetime', 'parameter', 'measurement', 'status'],
    optional: ['plant_id', 'machine_id']
  },
  INOMOT: {
    required: ['time', 'signal_id', 'data', 'valid'],
    optional: ['sensor_type', 'location']
  }
}

export function validateCSVStructure(
  headers: string[], 
  dataSourceType: CSVDataSourceType
): { valid: boolean; missingColumns?: string[] } {
  const mapping = DATA_SOURCE_COLUMN_MAPPING[dataSourceType]
  const headerLower = headers.map(h => h.toLowerCase())
  
  const missingColumns = mapping.required.filter(
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
): any[] {
  const mapping = DATA_SOURCE_COLUMN_MAPPING[dataSourceType]
  const headerIndexMap = new Map<string, number>()
  
  // Create a map of column names to indices (case-insensitive)
  parsedData.headers.forEach((header, index) => {
    headerIndexMap.set(header.toLowerCase(), index)
  })

  return parsedData.rows.map((row, rowIndex) => {
    const standardData: any = {
      plant,
      machineNo,
      sourceType: dataSourceType,
      rowNumber: rowIndex + 1
    }

    // Map required columns
    mapping.required.forEach(colName => {
      const index = headerIndexMap.get(colName.toLowerCase())
      if (index !== undefined) {
        standardData[colName] = row[index]
      }
    })

    // Map optional columns if they exist
    mapping.optional?.forEach(colName => {
      const index = headerIndexMap.get(colName.toLowerCase())
      if (index !== undefined) {
        standardData[colName] = row[index]
      }
    })

    return standardData
  })
}