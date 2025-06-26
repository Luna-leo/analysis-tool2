import { ParsedCSVData } from '@/types/csv-data'
import { parseCSVLine } from '../csv/parseUtils'

/**
 * Parse standard CSV format
 * Row 1: Headers
 * Row 2+: Data
 */
export function parseStandardFormat(lines: string[], fileName: string): ParsedCSVData {
  console.log(`[parseStandardFormat] Processing ${lines.length} lines for file: ${fileName}`)
  
  if (lines.length === 0) {
    console.error('[parseStandardFormat] No lines to parse')
    return {
      headers: [],
      rows: [],
      metadata: {
        fileName,
        format: 'standard'
      }
    }
  }
  
  // Check if this might be a multi-row header format (like PlantA_GT-1.csv)
  // First row has empty first cell and numbers, second row has parameter names, third row has units
  let headers: string[] = []
  let units: string[] = []
  let dataStartRow = 1
  
  const firstLine = parseCSVLine(lines[0])
  console.log(`[parseStandardFormat] First line parsed:`, firstLine.slice(0, 10))
  
  // Check if first cell is empty or contains BOM/whitespace
  const firstCellEmpty = !firstLine[0] || firstLine[0].trim() === '' || firstLine[0] === '\ufeff'
  const secondCellIsNumber = firstLine.length > 1 && !isNaN(Number(firstLine[1]))
  
  if (firstCellEmpty && secondCellIsNumber) {
    console.log('[parseStandardFormat] Detected multi-row header format')
    // This is likely a format with:
    // Row 1: Column numbers
    // Row 2: Parameter names
    // Row 3: Units
    if (lines.length >= 3) {
      const headerLine = parseCSVLine(lines[1])
      const unitLine = parseCSVLine(lines[2])
      
      // The first column should be the timestamp column
      // If it's empty in the header, set it to a default name
      if (!headerLine[0] || headerLine[0].trim() === '') {
        headerLine[0] = 'timestamp'
      }
      
      headers = headerLine
      units = unitLine
      dataStartRow = 3
      console.log(`[parseStandardFormat] Headers:`, headers.slice(0, 10))
      console.log(`[parseStandardFormat] Units:`, units.slice(0, 10))
    }
  } else {
    // Standard format - first row is headers
    headers = firstLine
    console.log(`[parseStandardFormat] Standard format headers:`, headers.slice(0, 10))
  }
  
  const rows = []
  
  // Parse data rows
  for (let i = dataStartRow; i < lines.length; i++) {
    const rowArray = parseCSVLine(lines[i])
    if (rowArray.length === 0) continue // Skip empty rows
    
    const rowObj: Record<string, string | number | null> = {}
    headers.forEach((header, index) => {
      const value = rowArray[index] || null
      // Try to parse as number
      const numValue = Number(value)
      rowObj[header] = !isNaN(numValue) && value !== '' ? numValue : value
    })
    rows.push(rowObj)
  }

  console.log(`[parseStandardFormat] Parsed ${rows.length} data rows`)

  return {
    headers,
    rows,
    metadata: {
      fileName,
      format: 'standard',
      parameterInfo: units.length > 0 ? {
        ids: headers, // Use headers as IDs for standard format
        parameters: headers,
        units: units
      } : undefined
    }
  }
}