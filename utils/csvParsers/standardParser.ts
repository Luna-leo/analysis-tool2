import { ParsedCSVData } from '@/types/csv-data'
import { parseCSVLine } from '../csv/parseUtils'

/**
 * Parse standard CSV format
 * Row 1: Headers
 * Row 2+: Data
 */
export function parseStandardFormat(lines: string[], fileName: string): ParsedCSVData {
  const headers = parseCSVLine(lines[0])
  const rows = []
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
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

  return {
    headers,
    rows,
    metadata: {
      fileName,
      format: 'standard'
    }
  }
}