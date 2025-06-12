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
  
  // Debug logging
  console.log('CASS format detection:', {
    firstLine: firstLine.slice(0, 5),
    secondLine: secondLine.slice(0, 5),
    thirdLine: thirdLine.slice(0, 5),
    firstColRaw: firstLine[0],
    secondColRaw: firstLine[1]
  })
  
  // CASS format detection - more flexible approach:
  // Pattern 1: Standard CASS format
  // - First row: Datetime or empty, followed by P0001, P0002, etc.
  // - Second row: Parameter names
  // - Third row: Units
  
  // Check if we have parameter IDs in the first row
  // Can be either P#### format or simple numbers (1, 2, 3...)
  let hasParameterIDs = false
  for (let i = 1; i < firstLine.length && i < 5; i++) {
    const trimmed = firstLine[i]?.trim()
    if (trimmed && (
      trimmed.match(/^P\d{3,4}$/) || // P0001 format
      trimmed.match(/^\d+$/)         // Simple number format
    )) {
      hasParameterIDs = true
      break
    }
  }
  
  // Check first column - should be datetime-related or empty
  const firstCol = (firstLine[0] || '').trim().toLowerCase()
  const isValidFirstCol = firstCol === '' || firstCol.includes('datetime') || firstCol.includes('time')
  
  // Check if second row contains text (parameter names) not numbers
  const secondRowHasText = secondLine.length > 1 && 
    secondLine.slice(1, 3).some(cell => cell && isNaN(Number(cell)))
  
  console.log('CASS detection results:', {
    hasParameterIDs,
    isValidFirstCol,
    secondRowHasText
  })
  
  return (
    firstLine.length > 1 && 
    isValidFirstCol &&
    hasParameterIDs &&
    secondLine.length > 1 &&
    secondRowHasText &&
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
  // If first column is empty in ID row, use 'Datetime' as default
  const headers = []
  const firstColName = idRow[0]?.trim() || 'Datetime'
  headers.push(firstColName)
  
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
    // Use the actual header name for the first column (might be 'Datetime' or something else)
    rowObj[headers[0]] = rowArray[0]
    
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