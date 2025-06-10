/**
 * Consolidated date utilities for the application
 */

/**
 * Formats a date for HTML datetime-local input
 * Returns date in format: YYYY-MM-DDTHH:MM:SS
 */
export function formatDateTimeForInput(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) {
      return typeof dateInput === 'string' ? dateInput : ''
    }
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  } catch {
    return typeof dateInput === 'string' ? dateInput : ''
  }
}

/**
 * Legacy alias for formatDateTimeForInput - will be removed in future
 * @deprecated Use formatDateTimeForInput instead
 */
export const formatDateTimeLocal = formatDateTimeForInput

/**
 * Formats a datetime string for display
 * Returns an object with formatted date and time parts
 */
export function formatDateTimeForDisplay(dateTimeString: string): { date: string; time: string } {
  if (!dateTimeString) return { date: '', time: '' }
  
  try {
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) {
      // Fallback to simple split if date is invalid
      const [datePart, timePart] = dateTimeString.split('T')
      return { date: datePart || '', time: timePart || '' }
    }
    
    // Format date as YYYY-MM-DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    // Format time as HH:MM:SS
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:${seconds}`
    }
  } catch {
    const [datePart, timePart] = dateTimeString.split('T')
    return { date: datePart || '', time: timePart || '' }
  }
}

/**
 * Formats a datetime for display as a single localized string
 */
export function formatDateTimeAsString(dateTimeString: string): string {
  if (!dateTimeString) return ''
  
  try {
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) return dateTimeString
    
    return date.toLocaleString()
  } catch {
    return dateTimeString
  }
}

/**
 * Formats a date as ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
export function formatDateToISO(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) {
      return typeof dateInput === 'string' ? dateInput : ''
    }
    return date.toISOString()
  } catch {
    return typeof dateInput === 'string' ? dateInput : ''
  }
}

/**
 * Formats a date as local date string (MM/DD/YYYY or locale-specific)
 */
export function formatDateToLocalDateString(dateInput: string | Date, locale?: string): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) {
      return typeof dateInput === 'string' ? dateInput : ''
    }
    return date.toLocaleDateString(locale)
  } catch {
    return typeof dateInput === 'string' ? dateInput : ''
  }
}

/**
 * Formats a date as ISO string without milliseconds (YYYY-MM-DDTHH:mm:ss)
 */
export function formatDateToISOWithoutMillis(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(date.getTime())) {
      return typeof dateInput === 'string' ? dateInput : ''
    }
    return date.toISOString().slice(0, 19)
  } catch {
    return typeof dateInput === 'string' ? dateInput : ''
  }
}

/**
 * Adjusts a date by a given amount and unit
 */
export function adjustDate(
  dateString: string, 
  amount: number, 
  unit: 'd' | 'h' | 'm' | 's'
): string {
  if (!dateString) return dateString
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    switch(unit) {
      case 'd':
        date.setDate(date.getDate() + amount)
        break
      case 'h':
        date.setHours(date.getHours() + amount)
        break
      case 'm':
        date.setMinutes(date.getMinutes() + amount)
        break
      case 's':
        date.setSeconds(date.getSeconds() + amount)
        break
    }
    
    return formatDateTimeForInput(date)
  } catch {
    return dateString
  }
}

/**
 * Calculates the overall time range from multiple data sources
 */
export function calculateOverallTimeRange(dataSourceItems: Array<{ start: string; end: string }>): { earliestStart: Date; latestEnd: Date } | null {
  if (!dataSourceItems || dataSourceItems.length === 0) {
    return null
  }

  let earliestStart: Date | null = null
  let latestEnd: Date | null = null

  dataSourceItems.forEach(dataSource => {
    const startTime = new Date(dataSource.start)
    const endTime = new Date(dataSource.end)

    if (!isNaN(startTime.getTime())) {
      if (!earliestStart || startTime < earliestStart) {
        earliestStart = startTime
      }
    }

    if (!isNaN(endTime.getTime())) {
      if (!latestEnd || endTime > latestEnd) {
        latestEnd = endTime
      }
    }
  })

  if (!earliestStart || !latestEnd) {
    return null
  }

  return { earliestStart, latestEnd }
}