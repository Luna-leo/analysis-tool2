import { ParsedCSVData } from '@/types/csv-data'
import { parseCSVLine } from '../csv/parseUtils'

/**
 * Check if the CSV data is in CASS format
 */
export function isCASSFormat(lines: string[]): boolean {
  if (lines.length < 3) return false
  
  const firstLine = parseCSVLine(lines[0])
  const secondLine = parseCSVLine(lines[1])
  const thirdLine = parseCSVLine(lines[2])
  
  // CASS format detection:
  // - First row starts with Datetime or empty, followed by P#### pattern
  // - Second row has parameter names
  // - Third row has units
  return (
    firstLine.length > 1 && 
    (firstLine[0].toLowerCase().includes('datetime') || firstLine[0] === '') &&
    (firstLine[1] && firstLine[1].match(/^P\d+$/)) &&
    secondLine.length > 1 &&
    thirdLine.length > 1
  )
}

/**
 * Parse CASS format CSV
 * Row 1: ID row (Datetime, P0001, P0002, ...)
 * Row 2: Parameter names
 * Row 3: Units
 * Row 4+: Data
 */
export function parseCASSFormat(lines: string[], fileName: string): ParsedCSVData {
  const idRow = parseCSVLine(lines[0])
  const paramRow = parseCSVLine(lines[1])
  const unitRow = parseCSVLine(lines[2])
  
  // Create headers from parameter names (trim whitespace)
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
      format: 'CASS',
      parameterInfo: {
        ids: idRow.slice(1).map(id => id.trim()),
        parameters: paramRow.slice(1).map(param => param.trim()),
        units: unitRow.slice(1).map(unit => unit.trim())
      }
    }
  }
}