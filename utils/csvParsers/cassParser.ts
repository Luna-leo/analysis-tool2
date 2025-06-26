import { ParsedCSVData } from '@/types/csv-data'
import { parseCSVLine } from '../csv/parseUtils'

/**
 * Check if the CSV data is in CASS format
 */
export function isCASSFormat(lines: string[]): boolean {
  if (lines.length < 4) return false // Need at least 4 rows (3 header rows + 1 data row)
  
  const firstLine = parseCSVLine(lines[0])
  const secondLine = parseCSVLine(lines[1])
  const thirdLine = parseCSVLine(lines[2])
  const fourthLine = parseCSVLine(lines[3])
  
  // CASS format detection:
  // - First column header (rows 1-3) is empty
  // - Second column and onwards contain numeric IDs in row 1
  // - Second row has parameter names
  // - Third row has units
  // - Fourth row starts with timestamp data
  return (
    firstLine.length > 1 && 
    firstLine[0] === '' && // First column header is empty
    secondLine[0] === '' && // First column header is empty
    thirdLine[0] === '' && // First column header is empty
    firstLine.slice(1).every(id => id && !isNaN(Number(id))) && // All IDs are numeric
    secondLine.length > 1 &&
    thirdLine.length > 1 &&
    fourthLine.length > 0 && fourthLine[0] !== '' // Fourth row has timestamp data
  )
}

/**
 * Parse CASS format CSV
 * Row 1: ID row (empty, numeric IDs...)
 * Row 2: Parameter names (empty, param names...)
 * Row 3: Units (empty, units...)
 * Row 4+: Data (timestamp, values...)
 */
export function parseCASSFormat(lines: string[], fileName: string): ParsedCSVData {
  const idRow = parseCSVLine(lines[0])
  const paramRow = parseCSVLine(lines[1])
  const unitRow = parseCSVLine(lines[2])
  
  // Create headers from parameter names (trim whitespace)
  // First column is Datetime
  const headers = ['Datetime']
  for (let i = 1; i < paramRow.length; i++) {
    if (paramRow[i]) {
      headers.push(paramRow[i].trim())
    }
  }
  
  // Parse data rows starting from row 4 (index 3)
  const rows = []
  for (let i = 3; i < lines.length; i++) {
    const rowArray = parseCSVLine(lines[i])
    if (rowArray.length === 0 || !rowArray[0]) continue // Skip empty rows
    
    const rowObj: Record<string, string | number | null> = {}
    rowObj['Datetime'] = rowArray[0] // First column is Datetime
    
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
      format: 'CASS',
      parameterInfo: {
        ids: idRow.slice(1).map(id => id.trim()),
        parameters: paramRow.slice(1).map(param => param.trim()),
        units: unitRow.slice(1).map(unit => unit.trim())
      }
    }
  }
}