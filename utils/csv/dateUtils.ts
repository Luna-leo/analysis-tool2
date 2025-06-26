/**
 * Date parsing utilities for CSV import
 */

// Common date formats in CSV files
const DATE_FORMATS = [
  // ISO formats
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/,
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  /^\d{4}-\d{2}-\d{2}$/,
  
  // Common formats
  /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
  /^\d{2}-\d{2}-\d{4}$/,
  
  // Excel numeric date (days since 1900-01-01)
  /^\d{5}(\.\d+)?$/,
] as const

/**
 * Parse a date string into a Date object
 * Returns null if the date cannot be parsed
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Try native Date parsing first
  const nativeDate = new Date(dateStr)
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate
  }

  // Handle Excel numeric dates
  if (/^\d{5}(\.\d+)?$/.test(dateStr)) {
    const excelDate = parseFloat(dateStr)
    // Excel dates start from 1900-01-01 (with leap year bug)
    const date = new Date(1900, 0, 1)
    date.setDate(date.getDate() + excelDate - 2) // -2 for Excel's leap year bug
    return date
  }

  // Try parsing with common formats
  const cleanedStr = dateStr.trim()
  
  // DD/MM/YYYY or DD-MM-YYYY formats
  const dmyMatch = cleanedStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/)
  if (dmyMatch) {
    const [, day, month, year, timeStr] = dmyMatch
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timeStr}`
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  return null
}

/**
 * Format a Date object to ISO string
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString()
}

/**
 * Format a Date object to local datetime string
 */
export function formatDateToLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Check if a string looks like a date
 */
export function isDateString(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  
  // Check against known date patterns
  return DATE_FORMATS.some(pattern => pattern.test(str.trim()))
}

/**
 * Get date range from an array of date strings
 */
export function getDateRange(dates: (string | Date)[]): { start: Date | null; end: Date | null } {
  const validDates = dates
    .map(d => typeof d === 'string' ? parseDate(d) : d)
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())

  if (validDates.length === 0) {
    return { start: null, end: null }
  }

  return {
    start: validDates[0],
    end: validDates[validDates.length - 1]
  }
}