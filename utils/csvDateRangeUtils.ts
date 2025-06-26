import { ParsedCSVData } from '@/types/csv-data'
import { CSVDataSourceType } from '@/types'
import { getDataSourceConfig } from '@/data/dataSourceTypes'

export interface DateRange {
  minDate: Date | null
  maxDate: Date | null
  dateColumnName: string | null
}

/**
 * Extract date range from parsed CSV data
 */
export function extractDateRangeFromCSV(
  parsedData: ParsedCSVData,
  dataSourceType: CSVDataSourceType
): DateRange {
  // Check if this is SSAC format with special handling
  if (parsedData.metadata?.format === 'SSAC') {
    // For SSAC format, datetime is always in the 'Datetime' column
    return extractDateRangeFromColumn(parsedData.rows, 'Datetime')
  }
  
  // For standard format or if no specific config, use flexible approach
  if (dataSourceType === 'standard' || !getDataSourceConfig(dataSourceType)) {
    // Try to find any column that might contain dates
    // Check first column first (common for time-series data)
    const firstColumn = parsedData.headers[0]
    const datePatternColumns = parsedData.headers.filter(header => 
      /date|time|timestamp|datetime/i.test(header)
    )
    
    // Use the first column if it looks like it contains dates, otherwise use date pattern columns
    const dateColumnName = datePatternColumns.length > 0 ? datePatternColumns[0] : firstColumn
    
    if (!dateColumnName) {
      return { minDate: null, maxDate: null, dateColumnName: null }
    }
    
    return extractDateRangeFromColumn(parsedData.rows, dateColumnName)
  }
  
  const config = getDataSourceConfig(dataSourceType)
  
  // Find the timestamp column
  const timestampColumnName = config.columnMappings.timestamp
  const timestampIndex = parsedData.headers.findIndex(
    header => header.toLowerCase() === timestampColumnName.toLowerCase()
  )
  
  if (timestampIndex === -1) {
    // Try to find any column that might contain dates
    const datePatternColumns = parsedData.headers.filter(header => 
      /date|time|timestamp|datetime/i.test(header)
    )
    
    if (datePatternColumns.length === 0) {
      return { minDate: null, maxDate: null, dateColumnName: null }
    }
    
    // Use the first date-like column
    const dateColumnName = datePatternColumns[0]
    
    return extractDateRangeFromColumn(parsedData.rows, dateColumnName)
  }
  
  return extractDateRangeFromColumn(parsedData.rows, timestampColumnName)
}

/**
 * Extract date range from a specific column
 */
function extractDateRangeFromColumn(
  rows: Array<Record<string, string | number | null>>,
  columnName: string
): DateRange {
  let minDate: Date | null = null
  let maxDate: Date | null = null
  
  rows.forEach(row => {
    const dateValue = row[columnName]
    
    if (dateValue && typeof dateValue === 'string') {
      const parsedDate = parseDate(dateValue)
      
      if (parsedDate) {
        if (!minDate || parsedDate < minDate) {
          minDate = parsedDate
        }
        if (!maxDate || parsedDate > maxDate) {
          maxDate = parsedDate
        }
      }
    }
  })
  
  return { minDate, maxDate, dateColumnName: columnName }
}

/**
 * Parse various date formats
 */
function parseDate(dateString: string): Date | null {
  // Remove any extra whitespace
  const cleaned = dateString.trim()
  
  // Try to parse various date formats
  const dateFormats = [
    // ISO formats
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO with time
    /^\d{4}-\d{2}-\d{2}/, // ISO date only
    
    // Common formats
    /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY or DD/MM/YYYY
    /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
    /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY or DD-MM-YYYY
    
    // Japanese formats
    /^\d{4}年\d{1,2}月\d{1,2}日/, // YYYY年MM月DD日
  ]
  
  // Try to parse with Date constructor
  const parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }
  
  // Try custom parsing for specific formats
  // MM/DD/YYYY or DD/MM/YYYY
  const slashFormat = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (slashFormat) {
    // Assume MM/DD/YYYY format (US standard)
    const [_, month, day, year] = slashFormat
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  // YYYY/MM/DD
  const ymdFormat = cleaned.match(/^(\d{4})\/(\d{2})\/(\d{2})/)
  if (ymdFormat) {
    const [_, year, month, day] = ymdFormat
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  
  return null
}

/**
 * Format date range for display
 */
export function formatDateRange(dateRange: DateRange): string {
  if (!dateRange.minDate || !dateRange.maxDate) {
    return 'No date range found'
  }
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return `${formatDate(dateRange.minDate)} ~ ${formatDate(dateRange.maxDate)}`
}